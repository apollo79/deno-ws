import { EventEmitter, StdServer } from "../../deps.ts";
import type { CustomEventMap } from "../../deps.ts";
import {
    WSConnEventDetail,
    WSServerConfig,
    type WSServerInit,
} from "./types.ts";

// https://deno.com/blog/v1.12#server-side-websocket-support-in-native-http
// https://stackoverflow.com/questions/71131574/deno-land-ws-module-not-found/71133383#comment125796183_71133383

import { Connection } from "./Connection.ts";
import Channel from "./Channel.ts";
import { createMapEntryIfNotExistsAndGet, EnhancedMap } from "../util/index.ts";

export interface DefaultEvents extends CustomEventMap {
    connect: WSConnEventDetail;
    disconnect: WSConnEventDetail & {
        code: number;
        reason: string;
    };
    message: WSConnEventDetail & {
        data: MessageEvent["data"];
    };
}

export class Server // <E extends CustomEventMap = Record<never, never>>
extends EventEmitter<DefaultEvents /* & E */> {
    public readonly config: WSServerConfig;

    protected server?: StdServer;

    get listening(): boolean {
        return this.server !== undefined;
    }

    public connections: EnhancedMap<number, Connection>;

    public channels: EnhancedMap<string, Channel>;

    public readonly tls: boolean;

    #serverPromise?: Promise<void>;

    get address(): string {
        return `ws${this.tls && "s"}://${this.config.host}:${this.config.port}`;
    }

    get closed(): boolean {
        return this.server ? this.server.closed : false;
    }

    constructor(serverInit: WSServerInit) {
        super();

        const defaultInit: WSServerConfig = {
            host: "localhost",
            port: 8080,
            autoServe: false,
            path: "/",
        };

        this.config = Object.assign(defaultInit, serverInit);

        this.connections = new EnhancedMap<number, Connection>();

        this.channels = new EnhancedMap<string, Channel>();

        this.tls = (this.config.certFile && this.config.keyFile) ? true : false;

        if (this.config.autoServe) {
            this.serve();
        }
    }

    serve(): void {
        if (this.server === undefined) {
            const { port, host } = this.config;

            this.server = new StdServer({
                hostname: host,
                port: port,
                handler: this.#getHandler(),
            });

            // serve via wss://
            if (this.tls) {
                const certFile = this.config.certFile!,
                    keyFile = this.config.keyFile!;

                this.#serverPromise = this.server.listenAndServeTls(
                    certFile,
                    keyFile,
                );
            } // serve via ws://
            else {
                this.#serverPromise = this.server.listenAndServe();
            }

            console.log("serves");
        }
    }

    run(): void {
        return this.serve();
    }

    listen(): void {
        return this.serve();
    }

    /**
     * @see https://github.com/drashland/wocket/blob/main/src/server.ts#L189 (#getHandler method)
     * @returns
     */
    #getHandler() {
        const config = this.config,
            connections = this.connections;

        return (req: Request) => {
            const url = new URL(req.url);

            const { pathname } = url;

            if (config.path && config.path !== pathname) {
                return new Response(
                    "The client has not specified the correct path that the server is listening on.",
                    {
                        status: 406,
                    },
                );
            }
            const { socket, response } = Deno.upgradeWebSocket(req);

            // Create the client and find the best available id to use
            let id = 1;

            do {
                id++;
            } while (connections.get(id));

            const conn = new Connection(socket, id);

            connections.set(id, conn);

            conn.on("open", ({ timeStamp }) => {
                this.emit("connect", {
                    conn,
                    timeStamp,
                });
            });

            // When the socket calls `.send()`, then do the following
            conn.on("message", ({ timeStamp, data }) => {
                this.emit("message", {
                    conn,
                    timeStamp,
                    data,
                });
            });

            // When the socket calls `.close()`, then do the following
            conn.on("close", ({ code, reason, timeStamp }) => {
                // Remove the client
                connections.delete(conn.id);

                this.emit("disconnect", {
                    conn,
                    timeStamp,
                    reason,
                    code,
                });
            });

            return response;
        };
    }

    channel(name: string): Channel {
        const createChannelIfNotExistsAndGet = (name: string): Channel => {
            return createMapEntryIfNotExistsAndGet<Channel>(
                this.channels,
                name,
                new Channel(),
            );
        };

        return createChannelIfNotExistsAndGet(name);
    }

    close(): Promise<void> {
        if (this.server && !this.server.closed) {
            this.server.close();

            return this.#serverPromise!;
        }

        return Promise.resolve();
    }
}

export default Server;

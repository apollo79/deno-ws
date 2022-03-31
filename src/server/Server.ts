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
import { createMapEntryIfNotExistsAndGet } from "./util/index.ts";
import { Group } from "./Group.ts";

export interface DefaultEvents extends CustomEventMap {
    connect: WSConnEventDetail;
    disconnect: WSConnEventDetail & {
        code: number;
        reason: string;
    };
    message: WSConnEventDetail & { event: MessageEvent<string> };
}

export class Server // <E extends CustomEventMap = Record<never, never>>
extends EventEmitter<DefaultEvents /* & E */> {
    public readonly config: WSServerConfig;

    protected server?: StdServer;

    get listening(): boolean {
        return this.server !== undefined;
    }

    public connections: Map<number, Connection>;

    public channels: Map<string, Channel>;

    public groups: Map<string, Group>;

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

        this.connections = new Map<number, Connection>();

        this.channels = new Map<string, Channel>();

        this.groups = new Map<string, Group>();

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

            conn.addEventListener("open", ({ detail }) => {
                this.emit("connect", {
                    conn: conn,
                    time: detail.timeStamp,
                });
            });

            // When the socket calls `.send()`, then do the following
            conn.addEventListener("message", ({ detail }) => {
                const message: MessageEvent = detail;

                try {
                    if ("data" in message && typeof message.data === "string") {
                        // const json = JSON.parse(message.data); // TODO wrap in a try catch, if error throw then send error message to client maybe? ie malformed request

                        // Get the channel they want to send the msg to
                        // const channel = channels.get(json.channel);

                        // if (!channel) {
                        //     socket.send(
                        //         `The channel "${json.channel}" doesn't exist as the server hasn't created a listener for it`,
                        //     );
                        //     return;
                        // }

                        this.emit("message", {
                            conn: conn,
                            time: message.timeStamp,
                            event: message,
                        });
                    }
                } catch (error) {
                    socket.send(error.message);
                }
            });

            // When the socket calls `.close()`, then do the following
            conn.addEventListener("close", ({ detail }) => {
                // Remove the client
                connections.delete(conn.id);

                // Call the disconnect handler if defined
                const { code, reason } = detail;

                this.emit("disconnect", {
                    conn: conn,
                    time: detail.timeStamp,
                    code: code,
                    reason: reason,
                });
            });

            return response;
        };
    }

    channel(name: string): Channel {
        const pos = name.indexOf("/");

        const createGroupIfNotExistsAndGet = (name: string): Group => {
            return createMapEntryIfNotExistsAndGet<Group>(
                this.groups,
                name,
                new Group(),
            );
        };

        const createChannelIfNotExistsAndGet = (name: string): Channel => {
            return createMapEntryIfNotExistsAndGet<Channel>(
                this.channels,
                name,
                new Channel(),
            );
        };

        if (pos !== -1) {
            const [groupName] = name.split("/", 1);

            return createGroupIfNotExistsAndGet(groupName)
                .channel(name.slice(pos + 1));
        }

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

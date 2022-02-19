import { EventEmitter } from "./deps.ts";
import { WSServerConfig, type WSServerInit } from "./types.ts";

// https://deno.com/blog/v1.12#server-side-websocket-support-in-native-http
// https://stackoverflow.com/questions/71131574/deno-land-ws-module-not-found/71133383#comment125796183_71133383

import { DefaultEvents } from "./DefaultEvents.ts";
import { Events as EventInterface } from "./Events.ts";

export class WSServer //<E extends EventInterface>
 //extends EventEmitter<DefaultEvents & E>
{
    public readonly config: WSServerConfig;

    public listener?: Deno.Listener;

    get listening(): boolean {
        return this.listener !== undefined;
    }

    public connections: Set<WebSocket>;

    constructor(serverInit: WSServerInit) {
        // super();

        const defaulInit: WSServerConfig = {
            host: "localhost",
            port: 8080,
            tls: false,
            autoServe: false,
        };

        this.config = Object.assign(defaulInit, serverInit);

        this.connections = new Set<WebSocket>();

        if (this.config.autoServe) {
            this.serve();
        }
    }

    async serve(): Promise<Deno.Listener> {
        if (this.listener === undefined) {
            const { tls, port, host } = this.config;

            let listener: Deno.Listener;

            if (tls) {
                const { certFile, keyFile } = this.config;

                listener = Deno.listenTls({
                    hostname: host,
                    port: port,
                    certFile: certFile,
                    keyFile: keyFile,
                });
            } else {
                listener = Deno.listen({
                    hostname: host,
                    port: port,
                });

                console.log(listener);
            }

            this.listener = listener;

            for await (const conn of this.listener) {
                this.handleConnection(conn);
            }
        }

        return this.listener;
    }

    async handleConnection(conn: Deno.Conn): Promise<Deno.HttpConn> {
        const httpConn = Deno.serveHttp(conn);

        const event = await httpConn.nextRequest();

        if (event) {
            const upgraded = this.upgradeWebSocket(event.request);

            let response: Response;

            if (upgraded instanceof Response) {
                response = upgraded;
            } else {
                response = upgraded.response;

                this.listenForEvents(upgraded.socket);
            }

            event.respondWith(response);
        }

        // also possible
        // for await (const e of httpConn) {
        //     e.respondWith(this.upgradeWebSocket(e.request));
        // }

        return httpConn;
    }

    listenForEvents(socket: WebSocket): void {
        socket.addEventListener("open", () => {
            console.log("socket opened");
        });

        socket.addEventListener("message", (event) => {
            console.log("socket message:", event.data);

            socket.send(event.data);
        });

        socket.addEventListener("close", (event) => {
            console.info(
                `socket closed. Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`,
            );
            // this.emit("disconnect", { socket: socket });
        });

        socket.addEventListener("error", (event) => {
            console.log("socket errored", event);
        });
    }

    upgradeWebSocket(
        req: Request,
    ): Response | { socket: WebSocket; response: Response } {
        if (req.headers.get("upgrade") != "websocket") {
            return new Response("not trying to upgrade as websocket.");
        }

        // Upgrade the incoming HTTP request to a WebSocket connection
        const { socket, response } = Deno.upgradeWebSocket(req);

        this.connections.add(socket);

        // this.emit("connection", { socket: socket });

        return {
            socket: socket,
            response: response,
        };
    }

    close(): void | undefined {
        return this.listener?.close();
    }
}

export default WSServer;

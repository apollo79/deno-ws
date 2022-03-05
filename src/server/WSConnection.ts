import isJSON from "../util/isJSON.ts";
import { CustomEventMap, EventEmitter, TypedCustomEvent } from "./deps.ts";
import { WSEventDetail } from "./types.ts";

export interface StdEvents extends CustomEventMap {
    open: TypedCustomEvent<"open", WSEventDetail & { event: Event }>;
    close: TypedCustomEvent<"close", WSEventDetail & { event: CloseEvent }>;
    message: TypedCustomEvent<
        "message",
        WSEventDetail & { event: MessageEvent<unknown> }
    >;
    error: TypedCustomEvent<
        "error",
        WSEventDetail & { event: Event | ErrorEvent }
    >;
}

export class WSConnection<E extends CustomEventMap = Record<never, never>>
    extends EventEmitter<E & StdEvents> {
    /**
     * @todo Maybe in future allow WebSocketStreams
     */
    public socket: WebSocket;

    public static readonly CONNECTING: number = WebSocket.CONNECTING;

    public static readonly OPEN: number = WebSocket.OPEN;

    public static readonly CLOSING: number = WebSocket.CLOSING;

    public static readonly CLOSED: number = WebSocket.CLOSED;

    constructor(socketOrUrl: WebSocket | string, protocol?: string | string[]) {
        super();

        const socket: WebSocket = socketOrUrl instanceof WebSocket
            ? socketOrUrl
            : new WebSocket(socketOrUrl, protocol);

        this.socket = socket;

        this.socket.addEventListener("open", (event) => {
            this.emit("open", {
                event: event,
                socket: this.socket,
            });
        });

        this.socket.addEventListener("close", (event) => {
            this.emit("close", {
                event: event,
                socket: this.socket,
            });
        });

        this.socket.addEventListener("error", (event) => {
            this.emit("error", {
                event: event,
                socket: this.socket,
            });
        });

        this.socket.addEventListener("message", (event) => {
            this.emit("message", {
                event: event,
                socket: this.socket,
            });
        });
    }

    /**
     * Get state of the Websocket connection
     * Possible values:
     * 0 (CONNECTING)
     * 1 (OPEN)
     * 2 (CLOSING)
     * 3 (CLOSED)
     * The values can be compared with the constants (WSConnection.CONNECTION for example)
     */
    get readyState() {
        return this.socket.readyState;
    }

    send(data: unknown): void {
        if (!isJSON(data)) {
            data = JSON.stringify(data);
        }

        this.socket.send(data as string);
    }

    close(code?: number, reason?: string): void {
        this.socket.close(code, reason);
    }
}

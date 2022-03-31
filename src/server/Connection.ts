import { isAbv, isJSON } from "../util/index.ts";
import { CustomEventMap, EventEmitter } from "../../deps.ts";

export interface StdEvents extends CustomEventMap {
    open: Pick<Event, "timeStamp">;
    close: Pick<CloseEvent, "code" | "reason" | "wasClean" | "timeStamp">;
    // deno-lint-ignore no-explicit-any
    message: MessageEvent<any>["data"];
    error: Event | ErrorEvent;
    upgraded: WebSocket;
}

export class Connection // <E extends CustomEventMap = Record<never, never>>
    extends EventEmitter</* E & */ StdEvents> {
    /**
     * @todo Maybe in future allow WebSocketStreams
     */
    protected socket: WebSocket;

    public readonly id: number;

    public readonly uuid?: string;

    public static readonly CONNECTING: number = WebSocket.CONNECTING;

    public static readonly OPEN: number = WebSocket.OPEN;

    public static readonly CLOSING: number = WebSocket.CLOSING;

    public static readonly CLOSED: number = WebSocket.CLOSED;

    constructor(
        socket: WebSocket,
        id: number,
        uuid: string = crypto.randomUUID(),
    ) {
        super();

        this.id = id;

        this.uuid = uuid;

        socket.addEventListener("open", ({ timeStamp }) => {
            this.emit("open", { timeStamp });

            socket.addEventListener("message", ({ data, timeStamp }) => {
                this.emit<"message">("message", {
                    data,
                    timeStamp,
                });
            });

            socket.addEventListener(
                "close",
                ({ code, reason, wasClean, timeStamp }) => {
                    this.emit(
                        "close",
                        {
                            code,
                            reason,
                            wasClean,
                            timeStamp,
                        },
                    );
                },
            );
        });

        this.socket = socket;
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
        return this.socket?.readyState;
    }

    send(data: unknown): void {
        const socket = this.socket;

        let sendableData: Parameters<WebSocket["send"]>[0];

        if (
            isAbv(data) ||
            data instanceof ArrayBuffer ||
            data instanceof SharedArrayBuffer ||
            data instanceof Blob ||
            (data instanceof String && isJSON(data))
        ) {
            sendableData = data as Parameters<WebSocket["send"]>[0];
        } else {
            sendableData = JSON.stringify(data);
        }

        if (socket) {
            socket.send(sendableData);
        }
    }

    close(code?: number, reason?: string): void {
        const socket = this.socket;

        socket.close(code, reason);

        this.emit(
            "close",
            {
                code: code || 0,
                reason: reason || "",
                wasClean: true,
                timeStamp: new Date().getTime(),
            },
        );
    }
}

export default Connection;

import { isJSON } from "../util/isJSON.ts";

import { CustomEventMap, EventEmitter, TypedCustomEvent } from "./deps.ts";

interface Events extends CustomEventMap {
    ping: TypedCustomEvent<"ping", undefined>;
    pong: TypedCustomEvent<"pong", undefined>;
}

export class WSJSONConnection<E extends CustomEventMap = Record<never, never>>
    extends EventEmitter<E & Events> {
    /**
     * @todo Maybe in future allow WebSocketStreams
     */
    public socket: WebSocket;

    constructor(socket: WebSocket) {
        super();

        this.socket = socket;
    }

    send(data: unknown): void {
        if (!isJSON(data)) {
            data = JSON.stringify(data);
        }

        this.socket.send(data as string);
    }
}

export default WSJSONConnection;

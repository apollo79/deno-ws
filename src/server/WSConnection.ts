export class WSConnection {
    /**
     * @todo Maybe in future allow WebSocketStreams
     */
    public socket: WebSocket;

    constructor(socket: WebSocket) {
        this.socket = socket;
    }
}

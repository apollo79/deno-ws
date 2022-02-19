import { WSEvent } from "./WsEvent.ts";

export interface DefaultEvents {
    connection: WSEvent;
    disconnect: WSEvent;
}

export default DefaultEvents;

import { WSEvent } from "./types.ts";

export interface DefaultEvents {
    connection: WSEvent;
    disconnect: WSEvent;
}

export default DefaultEvents;

import { WSEvent } from "./WsEvent.ts";

export interface Events extends WSEvent {
    [key: string]: unknown;
}

export default Events;

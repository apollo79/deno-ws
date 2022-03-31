/**
 * @see https://github.com/feathersjs/feathers/blob/dove/packages/transport-commons/src/channels/channel/base.ts
 */

import { Connection } from "./Connection.ts";
import { CustomEventMap, EventEmitter, Fn } from "../../deps.ts";

export interface StdEvents extends CustomEventMap {
    open: undefined;
}

export type SubChannelsArgType = Map<string, Channel> | [string, Channel][];

export class Channel extends EventEmitter<StdEvents> {
    public readonly name?: string;

    public connections: Connection[];

    /**
     * @param connections an array of Connections @see Connection
     * @param subChannels a Map or an array of channels
     */
    constructor(
        name?: string,
        connections: Connection[] = [],
    ) {
        super();

        this.name = name;

        this.connections = connections;
    }

    get length() {
        return this.connections.length;
    }

    join(...connections: Connection[]): this {
        connections.forEach((conn) => {
            if (conn && this.connections.indexOf(conn) !== -1) {
                this.connections.push(conn);
            }
        });

        return this;
    }

    leave(...connections: (Connection | Fn<[Connection], boolean>)[]): this {
        connections.forEach((current) => {
            if (typeof current === "function") {
                const callback = current;

                this.leave(...this.connections.filter(callback));
            } else {
                const index = this.connections.indexOf(current);

                if (index !== -1) {
                    this.connections.splice(index, 1);
                }
            }
        });

        if (this.length === 0) {
            this.emit("empty", undefined);
        }

        return this;
    }

    filter(fn: (conn: Connection) => boolean): Channel {
        return new Channel(this.name, this.connections.filter(fn));
    }

    send(data: unknown): this {
        this.connections.forEach((conn) => {
            conn.send(data);
        });

        return this;
    }
}

export default Channel;

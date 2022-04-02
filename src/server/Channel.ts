/**
 * @see https://github.com/feathersjs/feathers/blob/dove/packages/transport-commons/src/channels/channel/base.ts
 */

import { Connection } from "./Connection.ts";
import { CustomEventMap, EventEmitter, Fn } from "../../deps.ts";
import {
    createMapEntryIfNotExistsAndGet,
    EnhancedMap,
    EnhancedSet,
} from "../util/index.ts";

export interface StdEvents extends CustomEventMap {
    open: undefined;
}

export type SubChannelsArgType = Map<string, Channel> | [string, Channel][];

export class Channel extends EventEmitter<StdEvents> {
    public readonly name?: string;

    public connections: EnhancedSet<Connection>;
    public channels: EnhancedMap<string, Channel>;

    /**
     * @param connections an array of Connections @see Connection
     * @param subChannels a Map or an array of channels
     */
    constructor(
        name?: string,
        connections: Connection[] | Set<Connection> = new Set(),
    ) {
        super();

        this.name = name;

        this.connections = new EnhancedSet(connections);

        this.channels = new EnhancedMap();
    }

    get length() {
        return this.connections.size;
    }

    join(...connections: Connection[]): this {
        connections.forEach((conn) => {
            if (conn && !this.connections.has(conn)) {
                this.connections.add(conn);
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
                this.connections.delete(current);
            }
        });

        if (this.length === 0) {
            this.emit("empty", undefined);
        }

        return this;
    }

    filter(fn: Fn<[Connection], boolean>): Channel {
        return new Channel(this.name, this.connections.filter(fn));
    }

    send(data: unknown): this {
        this.connections.forEach((conn) => {
            conn.send(data);
        });

        return this;
    }

    channel(name: string): Channel {
        const createChannelIfNotExistsAndGet = (name: string): Channel => {
            return createMapEntryIfNotExistsAndGet<Channel>(
                this.channels,
                name,
                new Channel(),
            );
        };

        return createChannelIfNotExistsAndGet(name);
    }
}

export default Channel;

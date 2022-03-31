/**
 * @see https://github.com/feathersjs/feathers/blob/dove/packages/transport-commons/src/channels/channel/base.ts
 */

import { Connection } from "./Connection.ts";
import {
    CustomEventMap,
    EventEmitter,
} from "../../deps.ts";
import { createMapEntryIfNotExistsAndGet } from "./util/index.ts";
import Channel from "./Channel.ts";

export interface StdEvents extends CustomEventMap {
    open: undefined;
}

export type MapArgType<T = unknown> = Map<string, T> | [string, T][];

export type ChannelsArgType = MapArgType<Channel>;

export type SubGroupsArgType = MapArgType<Group>;

export class Group extends EventEmitter<StdEvents> {
    public readonly name?: string;

    public connections: Connection[];

    public channels: Map<string, Channel>;

    public subGroups: Map<string, Group>;

    /**
     * @param connections an array of Connections @see Connection
     * @param channels a Map or an array of channels
     */
    constructor(
        name?: string,
        connections: Connection[] = [],
        channels: ChannelsArgType = [],
        subGroups: SubGroupsArgType = [],
    ) {
        super();

        this.name = name;

        this.connections = connections;

        this.channels = new Map<string, Channel>(channels);

        this.subGroups = new Map<string, Group>(subGroups);

        // subChannels.forEach((channelOrGroup, name) => {
        //     if (channelOrGroup instanceof Group) {
        //         this.subGroups.set(name, channelOrGroup);
        //     } else {
        //         this.channels.set(name, channelOrGroup);
        //     }
        // });
    }

    get length() {
        return this.connections.length;
    }

    filter(fn: (conn: Connection) => boolean): Group {
        return new Group(
            this.name,
            this.connections.filter(fn),
            this.channels,
            this.subGroups,
        );
    }

    send(data: unknown): this {
        this.connections.forEach((conn) => {
            conn.send(data);
        });

        return this;
    }

    channel(name: string): Channel {
        const pos = name.indexOf("/");

        const createGroupIfNotExistsAndGet = (name: string) => {
            return createMapEntryIfNotExistsAndGet<Group>(
                this.subGroups,
                name,
                new Group(),
            );
        };

        const createChannelIfNotExistsAndGet = (name: string) => {
            return createMapEntryIfNotExistsAndGet<Channel>(
                this.channels,
                name,
                new Channel(),
            );
        };

        if (pos !== -1) {
            const firstSubChannelName = name.split("/", 1)[0];

            return createGroupIfNotExistsAndGet(firstSubChannelName)
                .channel(name.slice(pos + 1));
        }

        return createChannelIfNotExistsAndGet(name);
    }
}

export default Group;

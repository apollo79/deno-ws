import { Connection } from "./Connection.ts";

type Fn<
    Params extends readonly unknown[] = readonly unknown[],
    Result = unknown,
> = (...params: Params) => Result;

type WSServerInit = {
    host?: string;
    port?: number;
    tls?: boolean;
    certFile?: string;
    keyFile?: string;
    autoServe?: boolean;
};

type WSServerConfig = {
    host: string;
    port: number;
    autoServe: boolean;
    path?: string;

    certFile?: string;
    keyFile?: string;
};

type WSEventDetail = {
    socket: WebSocket;
    [key: string]: unknown;
};

type WSConnEventDetail = {
    conn: Connection;
    time?: number;
    [key: string]: unknown;
};

export type {
    Fn,
    WSConnEventDetail,
    WSEventDetail,
    WSServerConfig,
    WSServerInit,
};

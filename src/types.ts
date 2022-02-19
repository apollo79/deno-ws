import { type ServerInit as OrigServerInit } from "./deps.ts";

type WSServerInit = {
    host?: string;
    port?: number;
    tls?: boolean;
    certFile?: string;
    keyFile?: string;
    autoServe?: boolean;
};

type WSServerConfig =
    & {
        host: string;
        port: number;
        autoServe: boolean;
    }
    & (
        {
            tls: true;
            certFile: string;
            keyFile: string;
        } | {
            tls: false;
        }
    );

type WSServerEvents = "connection" | "disconnect" | "message";

export type { WSServerConfig, WSServerEvents, WSServerInit };

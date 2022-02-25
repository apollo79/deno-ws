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

type EventCallback = (...args: unknown[]) => void | Promise<void>;

type WSEvent = (data: {
    socket: WebSocket;
    [key: string]: unknown;
}) => void | Promise<void>;

type Event = {
    [key: string]: EventCallback;
};

export type {
    Event,
    EventCallback,
    WSEvent,
    WSServerConfig,
    WSServerEvents,
    WSServerInit,
};

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

type WSEventDetail = {
    socket: WebSocket;
    [key: string]: unknown;
}

export type {
    WSEventDetail,
    WSServerConfig,
    WSServerInit,
};

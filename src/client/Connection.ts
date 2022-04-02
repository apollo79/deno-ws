import { EventEmitter } from "../../deps.ts";

type ConnectionOptions = {
    pingTimeout?: number;
    pingFrequency?: number;
};

type RequireProps<T, TRequired extends keyof T> =
    & T
    & Required<Pick<T, TRequired>>;

export class Connection extends EventEmitter {
    public ws: WebSocket;

    public readonly options: Required<ConnectionOptions>;

    public pingTimeoutTimer?: number;

    get url(): string {
        return this.ws.url;
    }

    constructor(url: string, opts: ConnectionOptions);

    constructor(opts: ConnectionOptions & { url: string });

    constructor(
        urlOrOpts: string | ConnectionOptions & { url: string },
        opts?: ConnectionOptions,
    ) {
        super();

        const defaultOptions: Required<ConnectionOptions> = {
            pingTimeout: 3000,
            pingFrequency: 20000,
        };

        let url: string,
            options: ConnectionOptions;

        if (typeof urlOrOpts === "object") {
            url = urlOrOpts.url;

            options = urlOrOpts;

            this.options = {
                pingTimeout: urlOrOpts.pingTimeout ||
                    defaultOptions.pingTimeout,
                pingFrequency: urlOrOpts.pingFrequency ||
                    defaultOptions.pingFrequency,
            };
        } else if (opts) {
            url = urlOrOpts;

            options = opts;
        } else {
            throw new Error(
                "At least an url or options must get passed to the constructor",
            );
        }

        this.options = {
            pingTimeout: options.pingTimeout ||
                defaultOptions.pingTimeout,
            pingFrequency: options.pingFrequency ||
                defaultOptions.pingFrequency,
        };

        this.ws = new WebSocket(url);
    }

    initPing() {
        const { pingFrequency, pingTimeout } = this.options;

        this.pingTimeoutTimer = setTimeout(() => {
            this.ws.send("");

            this.pull("ping", pingTimeout)
                .then(() => {
                    clearTimeout(this.pingTimeoutTimer);
                })
                .catch(() => {
                    this.emit("error");
                });
        }, pingFrequency);
    }
}

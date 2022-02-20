/**
 * Almost completely from https://deno.land/x/eventemitter@1.2.1
 * @see https://deno.land/x/eventemitter@1.2.1
 */

type Callback = (...args: unknown[]) => void | Promise<void>;

type Listener =
    & Callback
    & { __once__?: true };

type EventName = string | number;

type EventsType = Record<EventName, Listener>;

export class EventEmitter<Events extends EventsType> {
    protected readonly __events__: Events;

    protected listeners: Map<keyof Events, Set<Listener>>;

    constructor(events: Events) {
        this.__events__ = events;

        this.listeners = new Map();

        for (const event of Object.keys(events)) {
            this.listeners.set(event, new Set());
        }
    }

    /**
     * Listen for a typed event
     * @param event the typed event name
     * @param listener the typed listener function
     */
    on<E extends keyof Events>(event: E, listener: Events[E]): this;

    /**
     * Listen for an event
     * @param event the event name
     * @param listener the listener function
     * @returns this
     */
    on(event: keyof Events, listener: Callback): this {
        const oldListeners = this.listeners.get(event)!;

        this.listeners.set(event, oldListeners.add(listener));

        return this;
    }

    /**
     * Listen for a typed event once
     * @param event the typed event name
     * @param listener the typed listener function
     */
    once<E extends keyof Events>(event: E, listener: Events[E]): this;

    /**
     * Listen for an event once
     * @param event the event name
     * @param listener the listener function
     * @returns this
     */
    once(event: keyof Events, listener: Callback): this {
        const l: Listener = listener;

        l.__once__ = true;

        // deno-lint-ignore no-explicit-any
        return this.on(event, l as any);
    }

    /**
     * Emit a typed event and wait for each typed listener to return.
     * @param event the typed event name
     * @param args the arguments to pass to the typed listeners
     */
    async emit<E extends keyof Events>(
        event: E,
        ...args: Parameters<Events[E]>
    ): Promise<this>;

    /**
     * Emit an event and wait for each listener to return
     * @param event the event name
     * @param args the arguments to pass to the listeners
     * @returns this
     */
    async emit(
        event: keyof Events,
        ...args: Parameters<Callback>
    ): Promise<this> {
        const listeners = this.listeners.get(event)!;

        for (const listener of listeners.values()) {
            await listener(...args);

            if (listener.__once__) {
                listeners.delete(listener);
            }
        }

        return this;
    }

    /**
     * Emit a typed event without waiting for all listeners to return
     * @param event the typed event name
     * @param args the arguments to pass to the typed listeners
     */
    emitSync<E extends keyof Events>(
        event: E,
        ...args: Parameters<Events[E]>
    ): this;

    /**
     * Emit an event without waiting for all listener to return
     * @param event the event name
     * @param args the arguments to pass to all listeners
     * @returns this
     */
    emitSync(event: keyof Events, ...args: Parameters<Callback>): this {
        const listeners = this.listeners.get(event)!;

        for (const listener of listeners.values()) {
            listener(...args);

            if (listener.__once__) {
                listeners.delete(listener);
            }
        }

        return this;
    }

    /**
     * remove all listeners
     */
    off(): this;

    /**
     * remove all listeners for a specific event
     * @param event the typed event name
     */
    off(event: keyof Events): this;

    /**
     * remove all listeners for a specific typed event
     * @param event the typed event name
     */
    off<E extends keyof Events>(event: E): this;

    /**
     * remove a specific typed listener from a specific typed event
     * @param event the typed event name
     * @param listener the typed listener
     */
    off<E extends keyof Events>(event: E, listener: Events[E]): this;

    /**
     * remove all listeners if no parameter is given
     * remove all listeners of an event if an event is given
     * remove a specific listener if an event and a listener is given
     * throw error if only a listener is given
     * @param event the typed event name
     * @param listener the listener
     * @returns this
     */
    off(event?: keyof Events, listener?: Callback): this {
        // remove all listeners
        if (!event && !listener) {
            for (const event of this.listeners.keys()) {
                this.listeners.set(event, new Set());
            }
        } else if (!event && listener) {
            throw new Error("Only a listener but no event is given!");
        } // remove listeners for specific event
        else if (event && !listener) {
            this.listeners.set(event, new Set());
        } else if (event && listener) {
            const listeners = this.listeners.get(event)!;

            listeners.delete(listener);
        }

        return this;
    }

    /**
     * The same as emitSync, but wait for each typed listener to
     * return before calling the next typed listener.
     * @param event the typed event name
     * @param args the arguments to pass to the typed listeners
     */
    queue<E extends keyof Events>(
        event: E,
        ...args: Parameters<Events[E]>
    ): this;

    /**
     * The same as emitSync, but wait for each listener to
     * return before calling the next listener.
     * @param event the event name
     * @param args
     * @returns this
     */
    queue(event: keyof Events, ...args: Parameters<Callback>): this {
        const run = async () => {
            // deno-lint-ignore no-explicit-any
            return await this.emit(event, ...args as any);
        };

        run()
            .catch(console.error);

        return this;
    }

    /**
     * wait for a typed event to emit and return the arguments
     * @param event the typed event name
     * @param timeout an optional amount of milliseconds before throwing
     */
    pull<E extends keyof Events>(
        event: E,
        timeout?: number,
    ): Promise<Parameters<Events[E]>>;

    /**
     * wait for an event to emit and return the arguments
     * @param event the event name
     * @param timeout an optional amount of milliseconds before throwing
     * @returns the parameters of the emitted event
     */
    pull(event: keyof Events, timeout?: number): Promise<Parameters<Callback>> {
        return new Promise((resolve, reject) => {
            let timeoutId: number | null;

            const listener = (...args: unknown[]) => {
                timeoutId && clearTimeout(timeoutId);

                resolve(args);
            };

            if (timeout) {
                timeoutId = setTimeout(() => {
                    // deno-lint-ignore no-explicit-any
                    this.off(event, listener as any);

                    clearTimeout();

                    reject("Timed out!");
                });
            }

            // deno-lint-ignore no-explicit-any
            this.once(event, listener as any);
        });
    }
}

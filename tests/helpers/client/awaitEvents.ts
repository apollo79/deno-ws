export const awaitOpen = (connection: WebSocket): Promise<void> => {
    return new Promise((resolve) => {
        connection.addEventListener("open", () => {
            resolve();
        });
    });
};

export const awaitClose = (connection: WebSocket): Promise<void> => {
    return new Promise((resolve) => {
        connection.addEventListener("close", () => {
            resolve();
        });
    });
};

export const awaitResponse = (connection: WebSocket): Promise<string> => {
    return new Promise((resolve) => {
        connection.addEventListener("message", (event) => {
            resolve(String(event.data));
        });
    });
};

export const awaitError = (connection: WebSocket): Promise<Event> => {
    return new Promise((resolve) => {
        connection.addEventListener("error", (event) => {
            resolve(event);
        });
    });
};

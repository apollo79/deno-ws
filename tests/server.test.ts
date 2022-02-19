import { WSServer } from "../mod.ts";

import { assertEquals } from "https://deno.land/std@0.126.0/testing/asserts.ts";

import { awaitOpen, awaitResponse } from "./helpers/WebSocket/awaitEvents.ts";

Deno.test("run server", async () => {
    const serverConfig = {
        autoServe: true,
        host: "localhost",
        port: 3045,
    };

    const server = new WSServer(serverConfig);

    const conn = new WebSocket("ws://localhost:3045");

    await awaitOpen(conn);

    conn.send("hello");

    const response = await awaitResponse(conn);

    if (response) {
        conn.close();

        server.close();
    }

    assertEquals<number>(server.config.port, serverConfig.port);

    assertEquals<boolean>(server.listening, true);
});

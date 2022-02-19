import { WSServer } from "../mod.ts";

import {
    assertEquals
} from "https://deno.land/std@0.126.0/testing/asserts.ts";

Deno.test("run server", async (): Promise<void> => {
    const serverConfig = {
        autoServe: false,
        port: 3045,
    };

    const server = new WSServer(serverConfig);

    console.log(server);

    await server.serve();

    const conn = new WebSocket("ws://localhost:8080");

    console.log(conn);

    server.close();

    assertEquals(serverConfig.port, server.config.port);
});

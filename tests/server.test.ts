import { Server } from "../mod.ts";

import { assertEquals } from "https://deno.land/std@0.132.0/testing/asserts.ts";

Deno.test("run server", async () => {
    const serverConfig = {
        autoServe: true,
        host: "localhost",
        port: 3045,
    };

    const server = new Server(serverConfig);

    assertEquals<number>(server.config.port, serverConfig.port);

    assertEquals<boolean>(server.listening, true);

    const conn = new WebSocket("ws://localhost:3045");

    await server.pull("connect");

    conn.send(JSON.stringify("hello"));

    const msg = await server.pull("message");

    assertEquals<string>(JSON.parse(msg.data), "hello");

    conn.close();

    await server.close();
});

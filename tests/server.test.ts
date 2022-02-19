import WSServer from "../server.ts";

import {
    assert,
    assertEquals,
    fail,
} from "https://deno.land/std@0.126.0/testing/asserts.ts";

Deno.test("run server", () => {
    const serverConfig = {
        autoServe: true,
        port: 8080,
    };

    const server = new WSServer(serverConfig);

    assertEquals(server.config.port, serverConfig.port);

    server.close();
});

import express from "express";
import { createServer as createViteServer } from "vite";

import {
  createDevMiddleware,
  createProxyMiddleware,
  startDevServer,
} from "@olenbetong/appframe-vite";

async function createServer() {
  const app = express();
  const vite = await createViteServer({
    server: { middlewareMode: "ssr" },
  });

  app.use(await createProxyMiddleware());
  app.use(vite.middlewares);
  app.use(await createDevMiddleware(vite));
  startDevServer(app);
}

createServer();

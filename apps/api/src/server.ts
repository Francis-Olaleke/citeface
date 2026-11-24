import { buildApp } from "./app.js";

const app = await buildApp();

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host =
      process.env.HOST ??
      (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");

    await app.listen({
      port,
      host,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();

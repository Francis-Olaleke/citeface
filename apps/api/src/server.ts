import Fastify from "fastify";

const app = Fastify({
  logger: true,
});

// Health-check endpoint
app.get("/health", async () => {
  return {
    status: "ok",
    application: "Citeface API",
   message: "Citeface development server is running.",
  };
});

// Start the server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;

    await app.listen({
      port,
      host: "127.0.0.1",
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
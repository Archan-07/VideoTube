import { app } from "./app.js";
import dotenv from "dotenv";
import { connectDB } from "./db/index.js";
import cluster from "node:cluster";
import os from "node:os";
import Logger from "./utils/logger.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 8001;

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    cluster.fork();
  });
} else {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        Logger.info(`Server is running on Port: ${PORT}`);
      });
    })
    .catch((err) => {
      Logger.error(`MongoDB connection error: ${err}`);
    });
}

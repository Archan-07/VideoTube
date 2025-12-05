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

// Determine how many cores your CPU has
const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  // --- PRIMARY PROCESS (The Manager) ---
  Logger.info(`Primary Manager ${process.pid} is running`);
  Logger.info(`Spinning up ${numCPUs} Workers...`);

  // Fork a worker for every CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // If a worker crashes, restart it immediately (Zero Downtime)
  cluster.on("exit", (worker, code, signal) => {
    Logger.warn(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  // --- WORKER PROCESSES (The Actual Server Instances) ---

  // Each worker connects to the DB and listens on the port
  // They share the workload automatically
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        // Log less to avoid console spam, or keep it to confirm they are running
        Logger.info(`Worker ${process.pid} started on port: ${PORT}`);
      });
    })
    .catch((err) => {
      Logger.error(`MongoDB connection error: ${err}`);
    });
}

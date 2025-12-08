import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
});

app.use(morgan("dev"));

app.use(limiter);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(cookieParser());

app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

app.use(express.static("public"));

import authRouter from "./routes/auth.routes.js";
import videoRouter from "./routes/video.routes.js";
import likeRouter from "./routes/like.routes.js";
import commentRouter from "./routes/comment.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

app.use("/api/v1/users", authRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/dashboard", dashboardRouter);

export { app };

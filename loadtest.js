import http from "k6/http";
import { check, sleep } from "k6";

// Configuration: How many users? How long?
export const options = {
  stages: [
    { duration: "30s", target: 1000 }, // Push to 1000
    { duration: "1m", target: 1000 }, // Hold for 1 minute
    { duration: "30s", target: 0 }, // Cool down
  ],
  thresholds: {
    // Relax expectations slightly for this higher load
    http_req_failed: ["rate<0.05"],
  },
};
// CHANGE THIS to your local server URL
const BASE_URL = "http://localhost:8000/api/v1";

// Test User Credentials (Make sure this user exists in your DB!)
const TEST_USER = {
  email: "testuser@example.com",
  username: "testuser",
  password: "password123",
};

export default function () {
  // --- SCENARIO 1: Public Feed (Read-heavy test) ---
  const feedRes = http.get(`${BASE_URL}/videos?page=1&limit=5`);

  check(feedRes, {
    "Feed status is 200": (r) => r.status === 200,
    "Feed loads fast": (r) => r.timings.duration < 500,
  });

  // Extract a random video ID from the feed for the next step
  let videoId = null;
  const videoData = feedRes.json("data"); // Adjust JSON path if needed
  if (videoData && videoData.length > 0) {
    const randomIndex = Math.floor(Math.random() * videoData.length);
    videoId = videoData[randomIndex]._id;
  }

  // Fail if we can't get a video ID (Need one video in DB)
  check(videoId, {
    "Video ID exists for liking": (id) => id !== null,
  });

  sleep(1); // User pauses

  // --- SCENARIO 2: Login (Auth process) ---
  const loginPayload = JSON.stringify({
    email: TEST_USER.email,
    username: TEST_USER.username, // Add this if your validator needs it
    password: TEST_USER.password,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const loginRes = http.post(`${BASE_URL}/users/login`, loginPayload, params);

  // Check if login worked
  let accessToken = null;
  const loginSuccess = check(loginRes, {
    "Login status is 200": (r) => r.status === 200,
  });

  // If login failed or no video ID, stop this iteration here
  if (!loginSuccess || !videoId) {
    return;
  }

  // Extract token for authenticated requests
  accessToken = loginRes.json("data.accessToken");
  const authParams = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  };

  sleep(1);

  // --- SCENARIO 3: Toggle Like (Write-heavy test / Race condition stress) ---
  const likeRes = http.post(
    `${BASE_URL}/likes/toggle-video-like/${videoId}`,
    null,
    authParams
  );

  // This is the critical test for the atomic/race condition fixes
  check(likeRes, {
    "Like/Unlike status is 200/201": (r) =>
      r.status === 200 || r.status === 201,
  });

  sleep(1);
}

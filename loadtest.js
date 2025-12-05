import http from "k6/http";
import { check, sleep } from "k6";

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

export function setup() {
  // 1. Verify URL: Your screenshot shows /users/login, but script had /login
  // Ensure this URL exactly matches what you use in Bruno
  const loginRes = http.post("http://localhost:8000/api/v1/users/login", {
    email: "testuser@example.com",
    username: "testuser",
    password: "password123",
  });

  // Debugging: If login fails, print why (check your terminal logs)
  if (loginRes.status !== 200) {
    console.error("Login Failed! Status:", loginRes.status);
    console.error("Response:", loginRes.body);
  }

  check(loginRes, { "Login successful": (r) => r.status === 200 });

  // 2. EXTRACTION LOGIC
  // Attempt to get token from JSON first (common backend structure)
  let token = loginRes.json("data.accessToken") || loginRes.json("accessToken");

  // If not in JSON, try to get it from the 'accessToken' cookie (based on your screenshot)
  if (!token && loginRes.cookies.accessToken) {
    token = loginRes.cookies.accessToken[0].value;
  }

  return { token: token };
}

export default function (data) {
  // If setup failed to get a token, stop this iteration
  if (!data.token) {
    console.error("No token found!");
    return;
  }

  const headers = {
    Authorization: `Bearer ${data.token}`,
    "Content-Type": "application/json",
  };

  // 3. FIX: Pass the headers options as the second argument
  const feedRes = http.get(
    `http://localhost:8000/api/v1/videos?page=1&limit=5`,
    { headers: headers }
  );

  if (feedRes.status !== 200) {
    console.warn(`Request Failed. Status: ${feedRes.status}`);

    check(feedRes, {
      "Feed status is 200": (r) => r.status === 200,
    });

    sleep(1);
  }
}

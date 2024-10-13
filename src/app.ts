import express, { Request, Response } from "express";
import axios from "axios";
import { createClient } from "redis"; // Use named import

// Create a Redis client
const redisclient = createClient({
  url: "redis://localhost:6379",
});

// Log any connection errors
redisclient.on("error", (err) => {
  console.error("Redis error:", err);
});

// Connect to Redis
async function connect() {
  try {
    await redisclient.connect();
    console.log("Connected to Redis");
  } catch (err) {
    console.error("Error connecting to Redis:", err);
    process.exit(1);
  }
}

// Call the connect function
connect();

const app = express();
const port = 3000;

// Endpoint to fetch data from JSONPlaceholder
app.get("/data", async (req: Request, res: Response) => {
  try {
    // Check if data is available in Redis
    const cachedData = await redisclient.get("cachedData");
    if (cachedData) {
      console.log("Data fetched from Redis");

      res.status(200).send(JSON.parse(cachedData));
    } else {
      const response = await axios.get(
        "https://jsonplaceholder.typicode.com/posts"
      );
      await redisclient.setEx(
        "cachedData",
        3600,
        JSON.stringify(response.data)
      );
      console.log("Data fetched from JSONPlaceholder and stored in Redis");
      res.status(200).send(response.data);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error fetching data: " + error);
  }
});

// random user data
app.get("/user", async (req: Request, res: Response) => {
  try {
    const cachedData = await redisclient.get("cached_data_user");
    if (cachedData) {
      console.log("User data fetched from Redis");

      res.status(200).send(JSON.parse(cachedData));
    } else {
      let response = await axios.get("https://dog.ceo/api/breeds/image/random");

      console.log(
        "User data fetched from randomuser.me and stored in Redis",
        response.data
      );
      await redisclient.setEx(
        "cached_data_user",
        3600,
        JSON.stringify(response.data)
      );

      res.status(200).send(response.data);
    }
  } catch (err) {
    console.log(err);
  }
});
// Health check endpoint
app.get("/", (req: Request, res: Response) => {
  console.log("Health check endpoint hit");
  res.status(200).json({
    message: "success",
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

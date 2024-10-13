"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const redis_1 = require("redis"); // Use named import
// Create a Redis client
const redisclient = (0, redis_1.createClient)({
    url: "redis://localhost:6379",
});
// Log any connection errors
redisclient.on("error", (err) => {
    console.error("Redis error:", err);
});
// Connect to Redis
function connect() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield redisclient.connect();
            console.log("Connected to Redis");
        }
        catch (err) {
            console.error("Error connecting to Redis:", err);
            process.exit(1);
        }
    });
}
// Call the connect function
connect();
const app = (0, express_1.default)();
const port = 3000;
// Endpoint to fetch data from JSONPlaceholder
app.get("/data", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if data is available in Redis
        const cachedData = yield redisclient.get("cachedData");
        if (cachedData) {
            console.log("Data fetched from Redis");
            res.status(200).send(JSON.parse(cachedData));
        }
        else {
            const response = yield axios_1.default.get("https://jsonplaceholder.typicode.com/posts");
            yield redisclient.setEx("cachedData", 3600, JSON.stringify(response.data));
            console.log("Data fetched from JSONPlaceholder and stored in Redis");
            res.status(200).send(response.data);
        }
    }
    catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Error fetching data: " + error);
    }
}));
// random user data
app.get("/user", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cachedData = yield redisclient.get("cached_data_user");
        if (cachedData) {
            console.log("User data fetched from Redis");
            res.status(200).send(JSON.parse(cachedData));
        }
        else {
            let response = yield axios_1.default.get("https://dog.ceo/api/breeds/image/random");
            console.log("User data fetched from randomuser.me and stored in Redis", response.data);
            yield redisclient.setEx("cached_data_user", 3600, JSON.stringify(response.data));
            res.status(200).send(response.data);
        }
    }
    catch (err) {
        console.log(err);
    }
}));
// Health check endpoint
app.get("/", (req, res) => {
    console.log("Health check endpoint hit");
    res.status(200).json({
        message: "success",
    });
});
// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

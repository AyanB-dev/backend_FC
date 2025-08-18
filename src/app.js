import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials: true, // Allow cookies to be sent with requests
    }
));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" })); // Set a limit for the JSON body size
app.use(express.urlencoded({ extended: true }, { limit: "10mb" })); // Set a limit for URL-encoded body size
app.use(express.static("public")); // Serve static files from the "public" directory


// routes import

import userRouter from './routes/user.routes.js';

// routes declaration

app.use("/api/v1/users", userRouter)
export default app;
    
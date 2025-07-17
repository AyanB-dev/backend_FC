import "dotenv/config";
// import mongoose, { connect, mongo } from "mongoose";
// import { DB_NAME } from "./constants.js";
import app from "./app.js";
import asyncHandler from "./utils/asynchandler.js";

import connectDB from "./db/db.js";

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });

/*
import express from "express";
const app = express();



(async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        app.on("error", (error) => {
            console.error("Connection error:", error);
        });
        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`)
        })

    } catch (error) {
        console.error("Error :", error);
        throw error;
    }
})();

*/

import "dotenv/config";
// import mongoose, { connect, mongo } from "mongoose";
// import { DB_NAME } from "./constants.js";

import connectDB from "../db/db.js";



connectDB();

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

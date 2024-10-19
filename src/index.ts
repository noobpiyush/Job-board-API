import cookieParser from "cookie-parser";
import express from "express";

import { RootRouter } from "./routes";

import cors from  "cors"

const app = express();

app.use(cookieParser());

app.use(express.json());

app.use(cors({
    origin: "https://job-portal-two-gray.vercel.app", // No trailing slash
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
}));

app.get("/health", (req, res) =>{
    res.send("hii there");
})

app.use("/api/v1",RootRouter)

app.listen(3000);
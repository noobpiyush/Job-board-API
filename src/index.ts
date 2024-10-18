import cookieParser from "cookie-parser";
import express from "express";

import { RootRouter } from "./routes";

import cors from  "cors"

const app = express();

app.use(cookieParser());

app.use(express.json());

app.use(cors({
    credentials:true,
    origin:"*",
}))


app.get("/health", (req, res) =>{
    res.send("hii there");
})

app.use("/api/v1",RootRouter)

app.listen(3000);
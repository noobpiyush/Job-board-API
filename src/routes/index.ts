import express from "express";

import {userRouter} from "./user"
import { jobRouter } from "./job";

export const RootRouter = express.Router();

RootRouter.use("/user", userRouter);

RootRouter.use("/job",jobRouter);
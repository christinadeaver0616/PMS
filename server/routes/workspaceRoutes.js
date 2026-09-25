import express from "express";
import { ensureWorkspace, getUserWorkspaces } from "../controllers/workspaceController.js";

const workspaceRouter = express.Router();

workspaceRouter.get("/", getUserWorkspaces);
workspaceRouter.post("/ensure", ensureWorkspace);

export default workspaceRouter;

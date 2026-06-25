import express from "express";
import db from "../db/index.js";
import { usersTable } from "../db/schema.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import {
  ensureAuthenticated,
  ristrictToRole,
} from "../middlewares/auth.middleware.js";

const router = express.Router();
const adminRole = ristrictToRole("admin");
router.use(ensureAuthenticated);
router.use(adminRole);
// public route : access admin data

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
      })
      .from(usersTable);

    return res.json({ users });
  }),
);
export default router;

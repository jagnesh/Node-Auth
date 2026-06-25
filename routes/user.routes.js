import express from "express";
import db from "../db/index.js";
import { userSessions, usersTable } from "../db/schema.js";
import { createHmac, randomBytes } from "node:crypto";
import { eq, name } from "drizzle-orm";
import { error, table } from "node:console";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";
const router = express.Router();

// Protected route: update current user's name
router.patch(
  "/",
  ensureAuthenticated,
  asyncHandler(async (req, res) => {
    const { name } = req.body;

    // Update the user record in the database
    await db.update(usersTable).set({ name }).where(eq(usersTable.id, user.id));

    return res.json({ status: "success", message: "User name updated" });
  }),
);

// Public route: return the authenticated user data
router.get("/", ensureAuthenticated, async (req, res) => {
  const user = req.user;

  return res.json({ user });
});

// Public route: create a new user account
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  // Prevent duplicate emails in the database
  const [existingUser] = await db
    .select({ email: usersTable.email })
    .from(usersTable)
    .where((table) => eq(table.email, email));

  if (existingUser) {
    return res
      .status(400)
      .json({ error: `User with email ${email} already exists!` });
  }

  // Create a new password hash with a unique salt
  const salt = randomBytes(256).toString("hex");
  const hashedPassword = createHmac("sha256", salt)
    .update(password)
    .digest("hex");

  const [user] = await db
    .insert(usersTable)
    .values({ name, email, password: hashedPassword, salt })
    .returning({ id: usersTable.id });

  return res.status(201).json({ status: "success", data: { userId: user.id } });
});

// Public route: login using email and password
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const [existingUser] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        salt: usersTable.salt,
        password: usersTable.password,
        role: usersTable.role,
      })
      .from(usersTable)
      .where((table) => eq(table.email, email));

    if (!existingUser) {
      return res
        .status(404)
        .json({ error: `User with email ${email} does not exists!` });
    }

    const salt = existingUser.salt;
    const existingPassword = existingUser.password;

    // Compare submitted password with stored hashed password
    const newHash = createHmac("sha256", salt).update(password).digest("hex");
    if (newHash !== existingPassword) {
      return res.status(400).json({ error: "Incorrect Password" });
    }

    // Generate JWT access and refresh tokens for the authenticated user
    const payload = {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      role: existingUser.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1m",
    });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "30d",
    });

    return res
      .status(200)
      .json({ status: "Login Success", token, refreshToken });
  }),
);

// Public route: refresh access token using valid refresh token
router.post(
  "/refresh",
  asyncHandler((req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is missing" });
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
      );

      const payload = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1m",
      });

      return res.status(200).json({ status: "Token Updated", token });
    } catch (err) {
      console.log("EEE", err);
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          code: "REFRESH_TOKEN_EXPIRED",
          error: "Refresh token expired",
        });
      }

      return res.status(401).json({
        error: "Invalid refresh token",
      });
    }
  }),
);

export default router;

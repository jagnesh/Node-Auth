import express from "express";
import db from "../db/index.js";
import { userSessions, usersTable } from "../db/schema.js";
import { createHmac, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { error, table } from "node:console";
import { asyncHandler } from "../middlewares/asyncHandler.js";
const router = express.Router();

router.patch(
  "/",
  asyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "You are not logged in" });
    }

    const { name } = req.body;
    await db.update(usersTable).set({ name }).where(eq(usersTable.id, user.id));

    return res.json({ status: "success", message: "user name updated" });
  }),
);
router.get("/", async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: "You are not logged in user" });
  }

  return res.json({ user });
});

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const [existingUser] = await db
    .select({ email: usersTable.email })
    .from(usersTable)
    .where((table) => eq(table.email, email));
  if (existingUser) {
    return res
      .status(400)
      .json({ error: `User with email ${email} already exists!` });
  }
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

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const [existingUser] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      salt: usersTable.salt,
      password: usersTable.password,
    })
    .from(usersTable)
    .where((table) => eq(table.email, email));

  if (!existingUser) {
    //login failed
    return res
      .status(404)
      .json({ error: `User with email ${email} does not exists!` });
  }

  const salt = existingUser.salt;
  const existingPassword = existingUser.password;

  const newHash = createHmac("sha256", salt).update(password).digest("hex");
  if (newHash !== existingPassword) {
    return res.status(400).json({ error: `Incorrect Password` });
  }

  // genrate session
  const [session] = await db
    .insert(userSessions)
    .values({
      userId: existingUser.id,
    })
    .returning({
      sessionId: userSessions.id,
    });
  return res
    .status(200)
    .json({ status: `Login Success`, sessionId: session.sessionId });
});

export default router;

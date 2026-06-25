import express from "express";
import userRouter from "./routes/user.routes.js";
import db from "./db/index.js";
import { userSessions, usersTable } from "./db/schema.js";
import { eq } from "drizzle-orm";
const app = express();
const PORT = process.env.PORT ?? 8000;
app.use(express.json());

app.use(async (req, res, next) => {
  try {
    const sessionId = req.headers["session-id"];

    if (!sessionId) {
      return next();
    }

    const [data] = await db
      .select({
        sessionId: userSessions.id,
        id: usersTable.id,
        userId: userSessions.userId,
        name: usersTable.name,
        email: usersTable.email,
      })
      .from(userSessions)
      .rightJoin(usersTable, eq(usersTable.id, userSessions.userId))
      .where(eq(userSessions.id, sessionId));

    if (data) {
      req.user = data;
    }

    next();
  } catch (err) {
    next(err);
  }
});
app.get("/", (req, res) => {
  return res.json({ status: "Server is running" });
});

app.use("/user", userRouter);
app.use((err, req, res, next) => {
  console.error(err);

  return res.status(500).json({
    error: "Internal Server Error",
  });
});
app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));

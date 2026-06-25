import express from "express";
import userRouter from "./routes/user.routes.js";
import adminRouter from "./routes/admin.routes.js";
import db from "./db/index.js";
import { userSessions, usersTable } from "./db/schema.js";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middlewares/auth.middleware.js";
const app = express();
const PORT = process.env.PORT ?? 8000;
app.use(express.json());

app.use(authMiddleware);
app.get("/", (req, res) => {
  return res.json({ status: "Server is running" });
});

app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use((err, req, res, next) => {
  console.error(err);

  return res.status(500).json({
    error: "Internal Server Error",
  });
});
app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));

import express from "express";
import userRouter from "./routes/user.routes.js";
import db from "./db/index.js";
import { userSessions, usersTable } from "./db/schema.js";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
const app = express();
const PORT = process.env.PORT ?? 8000;
app.use(express.json());

app.use(async (req, res, next) => {
  try {
    const tokenHeader = req.headers["authorization"];

    if (!tokenHeader) {
      return next();
    }

    if (!tokenHeader.startsWith("Bearer")) {
      return res.status(400).json({ error: "Authorization error" });
    }

    const token = tokenHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        code: "TOKEN_EXPIRED",
        error: `Token has expired at ${err.expiredAt}`,
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid token",
      });
    }
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

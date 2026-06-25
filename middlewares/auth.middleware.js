import jwt from "jsonwebtoken";
export const authMiddleware = async (req, res, next) => {
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
};

export const ensureAuthenticated = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "You must be authenticated" });
  }
  next();
};

export const ristrictToRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res
        .status(401)
        .json({ error: "You are not authorized to use this resource " });
    }
    return next();
  };
};

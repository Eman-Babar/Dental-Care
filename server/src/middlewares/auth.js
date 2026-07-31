import { verifyAuthToken } from "../utils/jwt.js";

// Verify JWT Token
export const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: "Not authorized. No token provided.",
    });
  }

  try {
    const decoded = verifyAuthToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.message?.includes("JWT_SECRET")) {
      console.error(error.message);
      return res.status(500).json({
        message: "Server auth is misconfigured.",
      });
    }
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};

// Role Authorization
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    next();
  };
};

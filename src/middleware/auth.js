// import jwt from "jsonwebtoken";
// import User from "../models/User.js";

// export const protect = async (req, res, next) => {
//   try {
//     const header = req.headers.authorization;
//     if (!header || !header.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "Not authorized, no token" });
//     }
//     const token = header.split(" ")[1];
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.id);
//     if (!user) return res.status(401).json({ message: "User no longer exists" });
//     req.user = user;
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "Not authorized, token invalid or expired" });
//   }
// };

// // Attaches req.user if a valid token is present, but never blocks the request.
// export const optionalAuth = async (req, _res, next) => {
//   try {
//     const header = req.headers.authorization;
//     if (header && header.startsWith("Bearer ")) {
//       const token = header.split(" ")[1];
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       req.user = await User.findById(decoded.id);
//     }
//   } catch (_err) {
//     // ignore invalid token for optional auth
//   }
//   next();
// };


import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ===== GUEST TOKEN =====
    if (decoded.role === "guest" || decoded.id === "guest") {
      req.user = {
        _id: "guest",
        id: "guest",
        name: "Guest Reader",
        role: "guest",
        isGuest: true,
        toSafeObject() {
          return {
            id: "guest",
            name: "Guest Reader",
            role: "guest",
            isGuest: true,
          };
        },
      };
      return next();
    }

    // ===== REAL USER =====
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User no longer exists" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token invalid or expired" });
  }
};

export const optionalAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      const token = header.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role === "guest" || decoded.id === "guest") {
        req.user = {
          _id: "guest",
          id: "guest",
          name: "Guest Reader",
          role: "guest",
          isGuest: true,
        };
      } else {
        req.user = await User.findById(decoded.id);
      }
    }
  } catch (_err) {
    // ignore
  }
  next();
};

// middleware/auth.js
export const protectWrite = (req, res, next) => {
  if (req.user?.isGuest || req.user?.role === "guest" || req.user?._id === "guest") {
    return res.status(403).json({
      message: "Guest hanya bisa membaca. Silakan daftar untuk berinteraksi.",
    });
  }
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  if (req.user.role !== "superAdmin") {
    return res.status(403).json({ message: "Access denied. SuperAdmin only." });
  }

  next();
};
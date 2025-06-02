import { parse, serialize } from "cookie";
import axios from "axios";
import mysql from "../../../lib/db";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || "aeoiefjeio@3540IFOFHREIO";

    // Get token from cookies or Authorization header
    const cookies = parse(req.headers.cookie || "");
    let token = cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    let email = null;

    if (typeof token === "string" && token.startsWith("ya29")) {
      // ✅ Google OAuth Token (For Google Sign-In)
      const googleResponse = await axios.get(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
      );
      email = googleResponse.data.email;

      // Create a JWT token with the same email that lasts 30 days
      const jwtToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: "30d" });
      token = jwtToken;

      // Set the new JWT token in cookies
      res.setHeader(
        "Set-Cookie",
        serialize("token", token, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60 // 30 days in seconds
        })
      );
    }

    // ✅ JWT Token (For Manual Sign-In)
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      email = decoded.email;
    } catch (err) {
      console.error("Token verification error:", err);
      
      // Clear invalid token
      res.setHeader(
        "Set-Cookie",
        serialize("token", "", {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 0
        })
      );
      
      return res.status(401).json({ error: "Invalid token" });
    }

    // ✅ Check if user exists in DB
    const connection = await mysql.getConnection();
    const [rows] = await connection.query(
      "SELECT id, name, email, isPayment FROM user WHERE email = ?",
      [email]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Ensure isPayment is returned as a boolean
    const isPayment = Boolean(rows[0].isPayment);

    // If token is close to expiry (less than 7 days), refresh it
    const decoded = jwt.decode(token);
    const sevenDaysInSeconds = 7 * 24 * 60 * 60;
    if (decoded.exp - Math.floor(Date.now() / 1000) < sevenDaysInSeconds) {
      const newToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: "30d" });
      res.setHeader(
        "Set-Cookie",
        serialize("token", newToken, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60 // 30 days in seconds
        })
      );
    }

    res.status(200).json({
      userId: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      isPayment
    });

  } catch (error) {
    console.error("Auth Error:", error.message);
    res.status(500).json({ error: "Authentication failed" });
  }
}


import axios from "axios";
import { serialize } from "cookie";
import { hash } from "bcryptjs"; // Hash password before saving
import mysql from "../../../lib/db"; // Import your MySQL connection file
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Authorization code is missing" });
  }

  try {
    // Step 1: Exchange auth code for access token
    const { data } = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google`,
        grant_type: "authorization_code",
        code,
      })
    );

    // Step 2: Fetch user details from Google
    const userInfo = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${data.access_token}`
    );

    const { email, name, picture } = userInfo.data;

    // Step 3: Check if user already exists in MySQL database
    const connection = await mysql.getConnection();
    const [existingUser] = await connection.query(
      "SELECT * FROM user WHERE email = ?",
      [email]
    );

    let userId;
    if (existingUser.length === 0) {
      // Step 4: If user does not exist, create a new user with a random password
      const hashedPassword = await hash(
        Math.random().toString(36).slice(-8),
        10
      );

      const [insertResult] = await connection.query(
        "INSERT INTO user (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword]
      );

      userId = insertResult.insertId;
    } else {
      userId = existingUser[0].id;
    }

    connection.release();

    // Create a JWT token that lasts for 30 days
    const JWT_SECRET = process.env.JWT_SECRET || "aeoiefjeio@3540IFOFHREIO";
    const token = jwt.sign(
      { 
        email,
        userId,
        name 
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Set auth cookie with proper security options
    res.setHeader(
      "Set-Cookie",
      serialize("token", token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      })
    );

    // Check for state parameter which may contain return URL
    let redirectPath = "/";
    if (req.query.state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(req.query.state));
        if (stateData.returnUrl && stateData.returnUrl.startsWith('/')) {
          redirectPath = stateData.returnUrl;
        }
      } catch (e) {
        console.error("Failed to parse state parameter:", e);
      }
    }

    // Redirect user to appropriate page
    res.writeHead(302, { Location: redirectPath });
    res.end();
  } catch (error) {
    console.error("Google OAuth Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Authentication failed" });
  }
}

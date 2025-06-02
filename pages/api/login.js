import jwt from "jsonwebtoken";
import db from "../../lib/db";
import bcrypt from "bcryptjs";
import validator from "validator";
import rateLimit from 'express-rate-limit';
import cors from 'cors';

// Configure CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  methods: ['POST'],
  credentials: true,
};

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 login attempts per 15 minutes
});

// Input validation function
const validateInput = (email, password) => {
  const errors = [];
  
  if (!email || !validator.isEmail(email)) {
    errors.push("Invalid email address");
  }
  
  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  return errors;
};

export default async function handler(req, res) {
  // Apply CORS
  await new Promise((resolve, reject) => {
    cors(corsOptions)(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  // Apply rate limiting
  await new Promise((resolve, reject) => {
    limiter(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, password } = req.body;
  
  // Validate input
  const validationErrors = validateInput(email, password);
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  let connection;
  try {
    connection = await db.getConnection();
    const [users] = await connection.query("SELECT * FROM user WHERE email = ?", [email]);

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    // Compare password using bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if JWT secret is configured
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not configured");
      return res.status(500).json({ message: "Internal server error" });
    }

    // Generate JWT token with improved security options
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email 
      }, 
      process.env.JWT_SECRET,
      {
        expiresIn: "24h", // Shorter token lifetime
        algorithm: "HS256"
      }
    );

    // Set Cache-Control to prevent 304 status interference
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    res.status(200).json({ 
      message: "Login successful", 
      token,
      userId: user.id 
    });
  } catch (err) {
    console.error("Login Error:", err);
    // Don't expose error details to client
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
}

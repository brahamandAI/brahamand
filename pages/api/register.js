import db from "../../lib/db";
import bcrypt from "bcryptjs";
import validator from "validator";
import rateLimit from 'express-rate-limit';
import cors from 'cors';

// Configure CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true,
};

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Increase file upload size limit to 50MB (or adjust as needed)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb", // Set the size limit (adjust as needed)
    },
    externalResolver: true,
  },
};

// Input validation function
const validateInput = (name, email, mobile, password) => {
  const errors = [];
  
  if (!name || name.length < 2 || name.length > 50) {
    errors.push("Name must be between 2 and 50 characters");
  }
  
  if (!email || !validator.isEmail(email)) {
    errors.push("Invalid email address");
  }
  
  if (!mobile || !validator.isMobilePhone(mobile)) {
    errors.push("Invalid mobile number");
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

  let connection;

  try {
    if (req.method === "POST") {
      connection = await db.getConnection();
      const { name, email, mobile, password } = req.body;

      // Validate input
      const validationErrors = validateInput(name, email, mobile, password);
      if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
      }

      try {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user into the database
        const [result] = await connection.query(
          "INSERT INTO user (name, email, mobileno, password) VALUES (?, ?, ?, ?)",
          [name, email, mobile, hashedPassword]
        );

        res.status(201).json({
          message: "User created successfully",
          userId: result.insertId,
        });
      } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "Email already exists" });
        }
        res.status(500).json({ error: "Internal server error", details: err.message });
      } finally {
        if (connection) connection.release();
      }
    }

    // Handle GET request for fetching users
    else if (req.method === "GET") {
      try {
        connection = await db.getConnection();
        // Query to fetch users
        const [users] = await connection.query("SELECT id, name, email, mobileno FROM user");

        // Check if any users were found
        if (users.length === 0) {
          return res.status(404).json({ error: "No users found" });
        }
        // Set Cache-Control to prevent 304 status interference
        res.setHeader(
          "Cache-Control",
          "no-store, no-cache, must-revalidate, proxy-revalidate"
        );

        // Return the users
        res.status(200).json(users);
      } catch (err) {
        res.status(500).json({ error: "Internal server error", details: err.message });
      } finally {
        if (connection) connection.release();
      }
    }

    // Handle DELETE request for deleting a user
    else if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: "User ID is required" });
      }

      try {
        // Delete user from the database
        const [result] = await db.query("DELETE FROM user WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "User not found" });
        }
        // Set Cache-Control to prevent 304 status interference
        res.setHeader(
          "Cache-Control",
          "no-store, no-cache, must-revalidate, proxy-revalidate"
        );
        res.status(200).json({ message: "User deleted successfully" });
      } catch (err) {
        res.status(500).json({ error: "Internal server error", details: err.message });
      }
    }

    // If the method is not POST, GET, or DELETE, return method not allowed
    else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: err.message });
  } finally {
    if (connection) connection.release();
  }
}

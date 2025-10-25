import { parse, serialize } from "cookie";
import axios from "axios";
import mysql from "../../../lib/db";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  try {
    // Temporarily skip JWT verification and return mock user
    res.status(200).json({
      userId: 1,
      name: "Test User",
      email: "test@example.com",
      isPayment: true
    });

  } catch (error) {
    console.error("Auth Error:", error.message);
    res.status(500).json({ error: "Authentication failed" });
  }
}


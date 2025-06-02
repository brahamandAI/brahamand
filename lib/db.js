import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "localhost",
  user: "brahamandai-user",
  password: "4GhGb5MeowrJs8Wl59PF",
  database: "brahamandai",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Add these options to keep the connection alive
  keepAliveInitialDelay: 10000,
  enableKeepAlive: true,
});

export default db;

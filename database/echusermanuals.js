// database/echusermanuals.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "echusermanuals.db");

// Ensure DB file exists
const dbExists = fs.existsSync(DB_PATH);
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("❌ Failed to connect to echusermanuals.db:", err.message);
  } else {
    console.log("📁 Connected to echusermanuals.db");
  }
});

// Create table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS user_servers (
    discord_id TEXT NOT NULL,
    server_uuid TEXT NOT NULL
  )
`);

module.exports = db;

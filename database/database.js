const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const DB_PATH = path.join(__dirname, "ech_database.db");

// Create the DB instance immediately so other modules can use it
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("❌ Failed to connect to the database:", err.message);
  } else {
    console.log("🗄️ SQLite database connected.");
  }
});


// Function to initialize schema
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL
      );
    `, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

db.run(`
  CREATE TABLE IF NOT EXISTS monitoring (
    guild_id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL
  );
`);


// Function to check database file status
function checkDatabaseStatus() {
  const exists = fs.existsSync(DB_PATH);
  let lastModified = null;

  if (exists) {
    const stats = fs.statSync(DB_PATH);
    lastModified = stats.mtime.toLocaleString();
  }

  return {
    exists,
    path: DB_PATH,
    lastModified
  };
}

// Export both functions AND the db object
module.exports = {
  db,
  initializeDatabase,
  checkDatabaseStatus
};

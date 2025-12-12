import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "urlhaus.db");
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    url TEXT NOT NULL UNIQUE,
    threat TEXT,
    reporter TEXT,
    date_added TEXT,
    status TEXT,
    tags TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );
  
  CREATE INDEX IF NOT EXISTS idx_url ON bookmarks(url);
  CREATE INDEX IF NOT EXISTS idx_created_at ON bookmarks(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_category_id ON bookmarks(category_id);
`);

export default db;

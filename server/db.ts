import fs from 'fs';
import path from 'path';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'justice_schedule.sqlite');

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!SQL) {
    const wasmPath = path.resolve(process.cwd(), 'node_modules', 'sql.js', 'dist');
    SQL = await initSqlJs({
      locateFile: (file) => path.join(wasmPath, file)
    });
  }

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    initSchema(db);
    saveDb();
  }

  // Ensure tables and default admin account exist
  initSchema(db);
  return db;
}

export function saveDb(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export function getDbBuffer(): Buffer {
  if (!db) throw new Error('Database not initialized');
  const data = db.export();
  return Buffer.from(data);
}

export function restoreDbFromBuffer(buffer: Buffer): void {
  if (!SQL) throw new Error('SQL engine not initialized');
  const newDb = new SQL.Database(buffer);
  initSchema(newDb);
  db = newDb;
  saveDb();
}

function initSchema(database: Database): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      userId INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'User',
      securityQuestion TEXT NOT NULL,
      securityAnswerHash TEXT NOT NULL,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdDate TEXT NOT NULL,
      lastLogin TEXT
    );

    CREATE TABLE IF NOT EXISTS schedules (
      scheduleId INTEGER PRIMARY KEY AUTOINCREMENT,
      serialNo INTEGER UNIQUE NOT NULL,
      scheduleDate TEXT NOT NULL,
      scheduleTime TEXT NOT NULL,
      venue TEXT NOT NULL,
      description TEXT NOT NULL,
      remarks TEXT,
      createdBy TEXT NOT NULL,
      createdDate TEXT NOT NULL,
      updatedBy TEXT,
      updatedDate TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(scheduleDate);
    CREATE INDEX IF NOT EXISTS idx_schedules_venue ON schedules(venue);
    CREATE INDEX IF NOT EXISTS idx_schedules_serial ON schedules(serialNo);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);

  // Initialize default settings if missing
  const defaultSettings: Record<string, string> = {
    applicationName: 'Justice Schedule',
    organizationName: 'High Court & District Judiciary',
    reportHeader: 'JUSTICE SCHEDULE - OFFICIAL CAUSE LIST',
    defaultPrintOrientation: 'portrait',
    dateFormat: 'DD-MM-YYYY',
    timeFormat: '24-hour',
    notice1: 'মাননীয় বিচারপতি মহোদয়ের দৈনন্দিন সিডিউল সরাসরি প্রস্তুত ও সংরক্ষণ করা যাবে।',
    notice2: 'মাননীয় বিচারপতি মহোদয়ের দৈনন্দিন কার্যযতালিকা প্রস্তুত ও রিমাইন্টডার ব্যবস্থাপনা(Justice Schedule Platform).'
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    const existing = database.exec(`SELECT value FROM settings WHERE key = '${key}'`);
    if (!existing.length || !existing[0].values.length) {
      database.run(`INSERT INTO settings (key, value) VALUES ('${key}', '${value.replace(/'/g, "''")}')`);
    }
  }

  // Check if default Administrator exists
  const userCheck = database.exec("SELECT COUNT(*) as count FROM users WHERE role = 'Administrator'");
  const adminCount = userCheck[0]?.values[0]?.[0] as number;

  if (!adminCount || adminCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('admin123', salt);
    const answerHash = bcrypt.hashSync('supreme court', salt);
    const now = new Date().toISOString();

    database.run(
      `INSERT INTO users (fullName, username, email, passwordHash, role, securityQuestion, securityAnswerHash, isActive, createdDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        'Court Administrator',
        'admin',
        'admin@justiceschedule.local',
        passwordHash,
        'Administrator',
        'What court institution is this system registered to?',
        answerHash,
        now
      ]
    );
  }
}

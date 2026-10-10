import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import JSZip from 'jszip';
import { getDb, saveDb, getDbBuffer, restoreDbFromBuffer } from './db';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// Helper to format ISO date to YYYY-MM-DD
function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------

router.post('/auth/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Username/Email and Password are required.' });
    }

    const database = await getDb();
    const query = `
      SELECT userId, fullName, username, email, passwordHash, role, isActive 
      FROM users 
      WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?))
    `;
    const stmt = database.prepare(query);
    stmt.bind([usernameOrEmail.trim(), usernameOrEmail.trim()]);

    let user: any = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();

    if (!user) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    if (user.isActive === 0) {
      return res.status(403).json({ error: 'This user account has been deactivated. Please contact an Administrator.' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    // Update last login
    const now = new Date().toISOString();
    database.run('UPDATE users SET lastLogin = ? WHERE userId = ?', [now, user.userId]);
    saveDb();

    return res.json({
      user: {
        userId: user.userId,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

router.post('/auth/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const { fullName, username, email, password, confirmPassword, securityQuestion, securityAnswer } = req.body;

    if (!fullName || !username || !email || !password || !confirmPassword || !securityQuestion || !securityAnswer) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const database = await getDb();

    // Check unique username
    const checkStmt = database.prepare('SELECT userId FROM users WHERE LOWER(username) = LOWER(?)');
    checkStmt.bind([username.trim()]);
    const exists = checkStmt.step();
    checkStmt.free();

    if (exists) {
      return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const securityAnswerHash = bcrypt.hashSync(securityAnswer.trim().toLowerCase(), salt);
    const now = new Date().toISOString();

    database.run(
      `INSERT INTO users (fullName, username, email, passwordHash, role, securityQuestion, securityAnswerHash, isActive, createdDate)
       VALUES (?, ?, ?, ?, 'User', ?, ?, 1, ?)`,
      [fullName.trim(), username.trim(), email.trim(), passwordHash, securityQuestion.trim(), securityAnswerHash, now]
    );
    saveDb();

    // Return created user info
    const lastId = database.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0];

    return res.json({
      message: 'Registration successful! You can now log in.',
      user: {
        userId: lastId,
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        role: 'User'
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

router.get('/auth/security-question', async (req: Request, res: Response): Promise<any> => {
  try {
    const identifier = String(req.query.identifier || '').trim();
    if (!identifier) {
      return res.status(400).json({ error: 'Username or Email is required.' });
    }

    const database = await getDb();
    const stmt = database.prepare('SELECT securityQuestion FROM users WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?))');
    stmt.bind([identifier, identifier]);

    let question = '';
    if (stmt.step()) {
      question = stmt.getAsObject().securityQuestion as string;
    }
    stmt.free();

    if (!question) {
      return res.status(404).json({ error: 'No account found with that username or email.' });
    }

    return res.json({ securityQuestion: question });
  } catch (error: any) {
    return res.status(500).json({ error: 'Error fetching security question.' });
  }
});

router.post('/auth/forgot-password', async (req: Request, res: Response): Promise<any> => {
  try {
    const { identifier, securityAnswer, newPassword, confirmNewPassword } = req.body;
    if (!identifier || !securityAnswer || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: 'New passwords do not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const database = await getDb();
    const stmt = database.prepare('SELECT userId, securityAnswerHash FROM users WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?))');
    stmt.bind([identifier.trim(), identifier.trim()]);

    let user: any = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();

    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const answerMatch = bcrypt.compareSync(securityAnswer.trim().toLowerCase(), user.securityAnswerHash);
    if (!answerMatch) {
      return res.status(400).json({ error: 'Incorrect answer to the security verification question.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newPasswordHash = bcrypt.hashSync(newPassword, salt);

    database.run('UPDATE users SET passwordHash = ? WHERE userId = ?', [newPasswordHash, user.userId]);
    saveDb();

    return res.json({ message: 'Password has been reset successfully. Please log in with your new password.' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

router.post('/auth/change-password', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId, currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!userId || !currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: 'New passwords do not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const database = await getDb();
    const stmt = database.prepare('SELECT passwordHash FROM users WHERE userId = ?');
    stmt.bind([Number(userId)]);

    let user: any = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const currentMatches = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!currentMatches) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    database.run('UPDATE users SET passwordHash = ? WHERE userId = ?', [newHash, Number(userId)]);
    saveDb();

    return res.json({ message: 'Password changed successfully.' });
  } catch (error: any) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Failed to change password.' });
  }
});

// ----------------------------------------------------
// USER MANAGEMENT ROUTES (ADMIN)
// ----------------------------------------------------

router.get('/users', async (req: Request, res: Response): Promise<any> => {
  try {
    const database = await getDb();
    const result = database.exec(`
      SELECT userId, fullName, username, email, role, isActive, createdDate, lastLogin 
      FROM users 
      ORDER BY userId ASC
    `);

    const users: any[] = [];
    if (result.length && result[0].values) {
      const columns = result[0].columns;
      for (const row of result[0].values) {
        const obj: any = {};
        columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        users.push(obj);
      }
    }

    return res.json({ users });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

router.post('/users', async (req: Request, res: Response): Promise<any> => {
  try {
    const { fullName, username, email, password, role, securityQuestion, securityAnswer } = req.body;
    if (!fullName || !username || !email || !password || !role) {
      return res.status(400).json({ error: 'Full name, username, email, role, and password are required.' });
    }

    const database = await getDb();
    const checkStmt = database.prepare('SELECT userId FROM users WHERE LOWER(username) = LOWER(?)');
    checkStmt.bind([username.trim()]);
    const exists = checkStmt.step();
    checkStmt.free();

    if (exists) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const answerHash = bcrypt.hashSync((securityAnswer || 'court').trim().toLowerCase(), salt);
    const now = new Date().toISOString();

    database.run(
      `INSERT INTO users (fullName, username, email, passwordHash, role, securityQuestion, securityAnswerHash, isActive, createdDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        fullName.trim(),
        username.trim(),
        email.trim(),
        passwordHash,
        role === 'Administrator' ? 'Administrator' : 'User',
        securityQuestion || 'Registered institution',
        answerHash,
        now
      ]
    );
    saveDb();

    return res.json({ message: 'User created successfully.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create user.' });
  }
});

router.put('/users/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = Number(req.params.id);
    const { fullName, email, role, isActive } = req.body;

    const database = await getDb();
    database.run(
      `UPDATE users SET fullName = ?, email = ?, role = ?, isActive = ? WHERE userId = ?`,
      [fullName.trim(), email.trim(), role, isActive ? 1 : 0, userId]
    );
    saveDb();

    return res.json({ message: 'User updated successfully.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update user.' });
  }
});

router.put('/users/:id/reset-password', async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = Number(req.params.id);
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    const database = await getDb();
    database.run('UPDATE users SET passwordHash = ? WHERE userId = ?', [newHash, userId]);
    saveDb();

    return res.json({ message: 'User password reset successfully.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

router.delete('/users/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = Number(req.params.id);
    const currentUserId = Number(req.query.currentUserId);

    if (userId === currentUserId) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    const database = await getDb();
    database.run('DELETE FROM users WHERE userId = ?', [userId]);
    saveDb();

    return res.json({ message: 'User deleted successfully.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// ----------------------------------------------------
// SCHEDULE CRUD & STATS ROUTES
// ----------------------------------------------------

router.get('/schedules/next-serial', async (req: Request, res: Response): Promise<any> => {
  try {
    const database = await getDb();
    const result = database.exec('SELECT MAX(serialNo) as maxSerial FROM schedules');
    const max = result[0]?.values[0]?.[0] as number | null;
    const nextSerial = max ? max + 1 : 1001;
    return res.json({ nextSerialNo: nextSerial });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to get next serial number.' });
  }
});

router.get('/schedules/stats', async (req: Request, res: Response): Promise<any> => {
  try {
    const database = await getDb();
    const today = getTodayString();
    const currentMonthPrefix = today.slice(0, 7); // YYYY-MM

    // Total Schedules
    const totalRes = database.exec('SELECT COUNT(*) FROM schedules');
    const totalSchedules = (totalRes[0]?.values[0]?.[0] as number) || 0;

    // Today's Schedules
    const todayRes = database.exec(`SELECT COUNT(*) FROM schedules WHERE scheduleDate = '${today}'`);
    const todaySchedules = (todayRes[0]?.values[0]?.[0] as number) || 0;

    // Upcoming Schedules
    const upcomingRes = database.exec(`SELECT COUNT(*) FROM schedules WHERE scheduleDate > '${today}'`);
    const upcomingSchedules = (upcomingRes[0]?.values[0]?.[0] as number) || 0;

    // This Month's Schedules
    const monthRes = database.exec(`SELECT COUNT(*) FROM schedules WHERE scheduleDate LIKE '${currentMonthPrefix}%'`);
    const thisMonthSchedules = (monthRes[0]?.values[0]?.[0] as number) || 0;

    // Today's schedule list ordered by time
    const todayListRes = database.exec(`
      SELECT scheduleId, serialNo, scheduleDate, scheduleTime, venue, description, remarks 
      FROM schedules 
      WHERE scheduleDate = '${today}' 
      ORDER BY scheduleTime ASC
    `);
    const todayList: any[] = [];
    if (todayListRes.length && todayListRes[0].values) {
      const cols = todayListRes[0].columns;
      for (const row of todayListRes[0].values) {
        const item: any = {};
        cols.forEach((col, i) => item[col] = row[i]);
        todayList.push(item);
      }
    }

    // Next 5 upcoming schedules
    const upcomingListRes = database.exec(`
      SELECT scheduleId, serialNo, scheduleDate, scheduleTime, venue, description, remarks 
      FROM schedules 
      WHERE scheduleDate >= '${today}' 
      ORDER BY scheduleDate ASC, scheduleTime ASC 
      LIMIT 6
    `);
    const upcomingList: any[] = [];
    if (upcomingListRes.length && upcomingListRes[0].values) {
      const cols = upcomingListRes[0].columns;
      for (const row of upcomingListRes[0].values) {
        const item: any = {};
        cols.forEach((col, i) => item[col] = row[i]);
        upcomingList.push(item);
      }
    }

    return res.json({
      totalSchedules,
      todaySchedules,
      upcomingSchedules,
      thisMonthSchedules,
      todayList,
      upcomingList
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics.' });
  }
});

router.post('/schedules/check-duplicate', async (req: Request, res: Response): Promise<any> => {
  try {
    const { scheduleDate, scheduleTime, venue, excludeId } = req.body;
    if (!scheduleDate || !scheduleTime || !venue) {
      return res.json({ isDuplicate: false });
    }

    const database = await getDb();
    let query = `
      SELECT scheduleId, serialNo, scheduleDate, scheduleTime, venue, description 
      FROM schedules 
      WHERE scheduleDate = ? AND scheduleTime = ? AND LOWER(venue) = LOWER(?)
    `;
    const params: any[] = [scheduleDate, scheduleTime, venue.trim()];

    if (excludeId) {
      query += ` AND scheduleId != ?`;
      params.push(Number(excludeId));
    }

    const stmt = database.prepare(query);
    stmt.bind(params);

    let match: any = null;
    if (stmt.step()) {
      match = stmt.getAsObject();
    }
    stmt.free();

    return res.json({
      isDuplicate: !!match,
      existingRecord: match
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to check duplicate.' });
  }
});

router.get('/schedules', async (req: Request, res: Response): Promise<any> => {
  try {
    const database = await getDb();
    const search = String(req.query.search || '').trim();
    const dateFrom = String(req.query.dateFrom || '').trim();
    const dateTo = String(req.query.dateTo || '').trim();
    const venue = String(req.query.venue || '').trim();
    const dateFilter = String(req.query.dateFilter || 'all').trim();
    const sortBy = String(req.query.sortBy || 'scheduleDate');
    const sortOrder = String(req.query.sortOrder || 'asc').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const pageSizeParam = String(req.query.pageSize || '15');
    const isAll = pageSizeParam === 'all';
    const pageSize = isAll ? 999999 : Math.max(1, parseInt(pageSizeParam, 10));

    const today = getTodayString();
    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    // Date filter presets
    if (dateFilter === 'today') {
      conditions.push('scheduleDate = ?');
      params.push(today);
    } else if (dateFilter === 'tomorrow') {
      const tom = new Date();
      tom.setDate(tom.getDate() + 1);
      const tomStr = tom.toISOString().split('T')[0];
      conditions.push('scheduleDate = ?');
      params.push(tomStr);
    } else if (dateFilter === 'thisWeek') {
      const now = new Date();
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      conditions.push('scheduleDate BETWEEN ? AND ?');
      params.push(firstDay.toISOString().split('T')[0], lastDay.toISOString().split('T')[0]);
    } else if (dateFilter === 'thisMonth') {
      conditions.push('scheduleDate LIKE ?');
      params.push(`${today.slice(0, 7)}%`);
    } else if (dateFilter === 'thisYear') {
      conditions.push('scheduleDate LIKE ?');
      params.push(`${today.slice(0, 4)}%`);
    }

    // Custom date range
    if (dateFrom) {
      conditions.push('scheduleDate >= ?');
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push('scheduleDate <= ?');
      params.push(dateTo);
    }

    // Venue filter
    if (venue && venue !== 'ALL') {
      conditions.push('LOWER(venue) = LOWER(?)');
      params.push(venue);
    }

    // Search query partial matching across SerialNo, Date, Time, Venue, Description, Remarks
    if (search) {
      conditions.push(`(
        CAST(serialNo AS TEXT) LIKE ? OR
        scheduleDate LIKE ? OR
        scheduleTime LIKE ? OR
        venue LIKE ? OR
        description LIKE ? OR
        remarks LIKE ?
      )`);
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term);
    }

    const whereClause = conditions.join(' AND ');

    // Total Count
    const countSql = `SELECT COUNT(*) FROM schedules WHERE ${whereClause}`;
    const countStmt = database.prepare(countSql);
    countStmt.bind(params);
    let totalRecords = 0;
    if (countStmt.step()) {
      totalRecords = countStmt.get()[0] as number;
    }
    countStmt.free();

    // Allowed sort columns
    const allowedCols: Record<string, string> = {
      serialNo: 'serialNo',
      scheduleDate: 'scheduleDate',
      scheduleTime: 'scheduleTime',
      venue: 'venue'
    };
    const sortCol = allowedCols[sortBy] || 'scheduleDate';
    // Secondary sort column: if sorting by date, secondary sort by time
    const secondarySort = sortCol === 'scheduleDate' ? `, scheduleTime ${sortOrder}` : '';

    const offset = (page - 1) * pageSize;
    const querySql = `
      SELECT scheduleId, serialNo, scheduleDate, scheduleTime, venue, description, remarks, createdBy, createdDate, updatedBy, updatedDate
      FROM schedules
      WHERE ${whereClause}
      ORDER BY ${sortCol} ${sortOrder} ${secondarySort}
      LIMIT ? OFFSET ?
    `;

    const selectParams = [...params, pageSize, offset];
    const dataStmt = database.prepare(querySql);
    dataStmt.bind(selectParams);

    const schedules: any[] = [];
    while (dataStmt.step()) {
      schedules.push(dataStmt.getAsObject());
    }
    dataStmt.free();

    return res.json({
      schedules,
      totalRecords,
      page,
      pageSize,
      totalPages: Math.ceil(totalRecords / pageSize) || 1
    });
  } catch (error: any) {
    console.error('Fetch schedules error:', error);
    return res.status(500).json({ error: 'Failed to fetch schedules.' });
  }
});

router.post('/schedules', async (req: Request, res: Response): Promise<any> => {
  try {
    const { serialNo, scheduleDate, scheduleTime, venue, description, remarks, createdBy } = req.body;

    if (!scheduleDate) return res.status(400).json({ error: 'Date is required.' });
    if (!scheduleTime) return res.status(400).json({ error: 'Time is required.' });
    if (!venue || !venue.trim()) return res.status(400).json({ error: 'Venue is required.' });
    if (!description || !description.trim()) return res.status(400).json({ error: 'Description is required.' });

    const database = await getDb();

    // Check unique serialNo
    const checkStmt = database.prepare('SELECT scheduleId FROM schedules WHERE serialNo = ?');
    checkStmt.bind([Number(serialNo)]);
    const serialExists = checkStmt.step();
    checkStmt.free();

    if (serialExists) {
      return res.status(400).json({ error: `Serial number ${serialNo} already exists. Serial numbers must be unique.` });
    }

    const now = new Date().toISOString();
    database.run(
      `INSERT INTO schedules (serialNo, scheduleDate, scheduleTime, venue, description, remarks, createdBy, createdDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(serialNo),
        scheduleDate.trim(),
        scheduleTime.trim(),
        venue.trim(),
        description.trim(),
        (remarks || '').trim(),
        createdBy || 'Administrator',
        now
      ]
    );
    saveDb();

    const lastId = database.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0];

    return res.json({
      message: 'Schedule saved successfully.',
      scheduleId: lastId
    });
  } catch (error: any) {
    console.error('Save schedule error:', error);
    return res.status(500).json({ error: 'Unable to save schedule. Please try again.' });
  }
});

router.put('/schedules/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const scheduleId = Number(req.params.id);
    const { scheduleDate, scheduleTime, venue, description, remarks, updatedBy } = req.body;

    if (!scheduleDate) return res.status(400).json({ error: 'Date is required.' });
    if (!scheduleTime) return res.status(400).json({ error: 'Time is required.' });
    if (!venue || !venue.trim()) return res.status(400).json({ error: 'Venue is required.' });
    if (!description || !description.trim()) return res.status(400).json({ error: 'Description is required.' });

    const database = await getDb();
    const now = new Date().toISOString();

    database.run(
      `UPDATE schedules 
       SET scheduleDate = ?, scheduleTime = ?, venue = ?, description = ?, remarks = ?, updatedBy = ?, updatedDate = ?
       WHERE scheduleId = ?`,
      [
        scheduleDate.trim(),
        scheduleTime.trim(),
        venue.trim(),
        description.trim(),
        (remarks || '').trim(),
        updatedBy || 'Administrator',
        now,
        scheduleId
      ]
    );
    saveDb();

    return res.json({ message: 'Schedule updated successfully.' });
  } catch (error: any) {
    console.error('Update schedule error:', error);
    return res.status(500).json({ error: 'Unable to update schedule. Please try again.' });
  }
});

router.delete('/schedules/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const scheduleId = Number(req.params.id);
    const database = await getDb();

    database.run('DELETE FROM schedules WHERE scheduleId = ?', [scheduleId]);
    saveDb();

    return res.json({ message: 'Schedule deleted successfully.' });
  } catch (error: any) {
    console.error('Delete schedule error:', error);
    return res.status(500).json({ error: 'Unable to delete schedule. Please try again.' });
  }
});

// ----------------------------------------------------
// SETTINGS ROUTES
// ----------------------------------------------------

router.get('/settings', async (req: Request, res: Response): Promise<any> => {
  try {
    const database = await getDb();
    const result = database.exec('SELECT key, value FROM settings');
    const settings: Record<string, string> = {};

    if (result.length && result[0].values) {
      for (const row of result[0].values) {
        settings[row[0] as string] = row[1] as string;
      }
    }

    return res.json({ settings });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

router.put('/settings', async (req: Request, res: Response): Promise<any> => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object required.' });
    }

    const database = await getDb();
    for (const [key, value] of Object.entries(settings)) {
      database.run(
        `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [key, String(value)]
      );
    }
    saveDb();

    return res.json({ message: 'Application settings saved successfully.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to save settings.' });
  }
});

// ----------------------------------------------------
// BACKUP & RESTORE ROUTES
// ----------------------------------------------------

router.get('/backup/download', async (req: Request, res: Response): Promise<any> => {
  try {
    const buffer = getDbBuffer();
    const today = getTodayString();
    const filename = `justice_schedule_backup_${today}.sqlite`;

    res.setHeader('Content-Type', 'application/x-sqlite3');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to generate database backup.' });
  }
});

router.get('/backup/export-json', async (req: Request, res: Response): Promise<any> => {
  try {
    const database = await getDb();
    const schedulesRes = database.exec('SELECT * FROM schedules');
    const settingsRes = database.exec('SELECT * FROM settings');

    const formatResult = (resObj: any[]) => {
      if (!resObj.length || !resObj[0].values) return [];
      const cols = resObj[0].columns;
      return resObj[0].values.map((row: any[]) => {
        const item: any = {};
        cols.forEach((col: string, i: number) => item[col] = row[i]);
        return item;
      });
    };

    const dump = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      schedules: formatResult(schedulesRes),
      settings: formatResult(settingsRes)
    };

    const today = getTodayString();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="justice_schedule_data_${today}.json"`);
    return res.json(dump);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to export JSON dump.' });
  }
});

router.post('/backup/restore', upload.single('file'), async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No backup file uploaded.' });
    }

    const fileBuffer = req.file.buffer;

    // Check if it is a JSON file or SQLite binary
    const filename = (req.file.originalname || '').toLowerCase();
    if (filename.endsWith('.json')) {
      const jsonText = fileBuffer.toString('utf-8');
      const dump = JSON.parse(jsonText);
      const database = await getDb();

      if (Array.isArray(dump.schedules)) {
        database.run('DELETE FROM schedules');
        for (const s of dump.schedules) {
          database.run(
            `INSERT INTO schedules (serialNo, scheduleDate, scheduleTime, venue, description, remarks, createdBy, createdDate, updatedBy, updatedDate)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              s.serialNo,
              s.scheduleDate,
              s.scheduleTime,
              s.venue,
              s.description,
              s.remarks || '',
              s.createdBy || 'Administrator',
              s.createdDate || new Date().toISOString(),
              s.updatedBy || null,
              s.updatedDate || null
            ]
          );
        }
        saveDb();
      }
      return res.json({ message: 'Database restored successfully from JSON backup.' });
    }

    // Binary SQLite restore
    restoreDbFromBuffer(fileBuffer);
    return res.json({ message: 'Database restored successfully from SQLite file.' });
  } catch (error: any) {
    console.error('Restore error:', error);
    return res.status(500).json({ error: 'Failed to restore database. Ensure valid SQLite or JSON backup file.' });
  }
});

// ----------------------------------------------------
// WINDOWS .MSC & DESKTOP INSTALLER DOWNLOAD ROUTES
// ----------------------------------------------------

router.get('/download/msc', async (req: Request, res: Response): Promise<any> => {
  try {
    const database = await getDb();
    const result = database.exec('SELECT key, value FROM settings');
    const settingsMap: Record<string, string> = {};
    if (result.length > 0 && result[0].values) {
      for (const row of result[0].values) {
        settingsMap[row[0] as string] = row[1] as string;
      }
    }

    const host = req.get('host') || 'localhost:3000';
    const proto = req.protocol || 'http';
    const appUrl = `${proto}://${host}`;
    const orgName = settingsMap.organizationName || 'High Court & District Judiciary';
    const appName = settingsMap.applicationName || 'Justice Schedule';
    const repHeader = settingsMap.reportHeader || 'Official Cause List & Proceeding Schedule';

    const mscContent = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  =============================================================================
  Justice Schedule - Microsoft Management Console Document (.msc)
  Court Management & Proceeding Schedule System
  Organization: ${orgName}
  Application: ${appName}
  =============================================================================
-->
<MMC_ConsoleFile ConsoleVersion="3.0" ProgramMode="UserMode">
  <FrameState ShowStatusBar="true">
    <WindowPlacement ShowCommand="SW_SHOWMAXIMIZED">
      <Point Left="40" Top="40"/>
      <Size Width="1280" Height="820"/>
    </WindowPlacement>
  </FrameState>
  <Views>
    <View ID="1" ScopeNode="1">
      <WindowPlacement ShowCommand="SW_SHOWMAXIMIZED"/>
    </View>
  </Views>
  <ScopeTree>
    <Nodes>
      <Node ID="1" Name="${appName} - ${orgName}" ImageIndex="0">
        <SnapIn CLSID="{88DF9D60-8B92-11CE-A58D-00AA00669209}" Name="Web Page">
          <Configuration>
            <URL>${appUrl}</URL>
            <Title>${appName} Management Console</Title>
            <Organization>${orgName}</Organization>
            <ReportHeader>${repHeader}</ReportHeader>
            <OfflineMode>Enabled</OfflineMode>
          </Configuration>
        </SnapIn>
      </Node>
    </Nodes>
  </ScopeTree>
</MMC_ConsoleFile>`;

    res.setHeader('Content-Type', 'application/x-mmc; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="JusticeSchedule.msc"');
    return res.send(mscContent);
  } catch (error: any) {
    console.error('MSC generation error:', error);
    return res.status(500).send('Error generating .msc file');
  }
});

router.get('/download/installer-bat', async (req: Request, res: Response): Promise<any> => {
  try {
    const database = await getDb();
    const result = database.exec('SELECT key, value FROM settings');
    const settingsMap: Record<string, string> = {};
    if (result.length > 0 && result[0].values) {
      for (const row of result[0].values) {
        settingsMap[row[0] as string] = row[1] as string;
      }
    }

    const host = req.get('host') || 'localhost:3000';
    const proto = req.protocol || 'http';
    const appUrl = `${proto}://${host}`;
    const orgName = settingsMap.organizationName || 'High Court & District Judiciary';
    const appName = settingsMap.applicationName || 'Justice Schedule';

    const batContent = `@echo off
title ${appName} - Windows Setup & Console Installer
color 1F

echo =======================================================================
echo          ${appName.toUpperCase()} - COURT MANAGEMENT SYSTEM INSTALLER
echo          ${orgName.toUpperCase()}
echo =======================================================================
echo.
echo Installing ${appName} Console (.msc) and creating Desktop Shortcut...
echo.

set "INSTALL_DIR=%LOCALAPPDATA%\\JusticeSchedule"
set "MSC_FILE=%INSTALL_DIR%\\JusticeSchedule.msc"
set "DESKTOP_SHORTCUT=%USERPROFILE%\\Desktop\\${appName}.lnk"
set "START_MENU=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\${appName}"

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo [1/3] Fetching JusticeSchedule.msc...
powershell -Command "Invoke-WebRequest -Uri '${appUrl}/api/download/msc' -OutFile '%MSC_FILE%'"

echo [2/3] Creating Windows Desktop Shortcut...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%DESKTOP_SHORTCUT%'); $s.TargetPath = 'mmc.exe'; $s.Arguments = '\"%MSC_FILE%\"'; $s.Description = '${appName} Judicial Management Console'; $s.IconLocation = 'shell32.dll,261'; $s.Save()"

echo [3/3] Creating Start Menu Entry...
if not exist "%START_MENU%" mkdir "%START_MENU%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%START_MENU%\\${appName} Console.lnk'); $s.TargetPath = 'mmc.exe'; $s.Arguments = '\"%MSC_FILE%\"'; $s.Description = '${appName} Management Console'; $s.IconLocation = 'shell32.dll,261'; $s.Save()"

echo.
echo =======================================================================
echo               INSTALLATION COMPLETED SUCCESSFULLY!
echo =======================================================================
echo.
echo Launching ${appName} Console now...
timeout /t 2 >nul
start "" mmc.exe "%MSC_FILE%"
`;

    res.setHeader('Content-Type', 'application/x-bat; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="Install-JusticeSchedule.bat"');
    return res.send(batContent);
  } catch (error: any) {
    console.error('Batch installer error:', error);
    return res.status(500).send('Error generating batch installer');
  }
});

router.get('/download/full-package-zip', async (req: Request, res: Response): Promise<any> => {
  try {
    const database = await getDb();
    const result = database.exec('SELECT key, value FROM settings');
    const settingsMap: Record<string, string> = {};
    if (result.length > 0 && result[0].values) {
      for (const row of result[0].values) {
        settingsMap[row[0] as string] = row[1] as string;
      }
    }

    const host = req.get('host') || 'localhost:3000';
    const proto = req.protocol || 'http';
    const appUrl = `${proto}://${host}`;
    const orgName = settingsMap.organizationName || 'High Court & District Judiciary';
    const appName = settingsMap.applicationName || 'Justice Schedule';
    const repHeader = settingsMap.reportHeader || 'Official Cause List & Proceeding Schedule';

    const zip = new JSZip();

    // 1. JusticeSchedule.msc
    const mscXml = `<?xml version="1.0" encoding="UTF-8"?>
<MMC_ConsoleFile ConsoleVersion="3.0" ProgramMode="UserMode">
  <FrameState ShowStatusBar="true">
    <WindowPlacement ShowCommand="SW_SHOWMAXIMIZED">
      <Point Left="40" Top="40"/>
      <Size Width="1280" Height="820"/>
    </WindowPlacement>
  </FrameState>
  <Views>
    <View ID="1" ScopeNode="1">
      <WindowPlacement ShowCommand="SW_SHOWMAXIMIZED"/>
    </View>
  </Views>
  <ScopeTree>
    <Nodes>
      <Node ID="1" Name="${appName} - ${orgName}" ImageIndex="0">
        <SnapIn CLSID="{88DF9D60-8B92-11CE-A58D-00AA00669209}" Name="Web Page">
          <Configuration>
            <URL>${appUrl}</URL>
            <Title>${appName} Management Console</Title>
            <Organization>${orgName}</Organization>
            <ReportHeader>${repHeader}</ReportHeader>
            <OfflineMode>Enabled</OfflineMode>
          </Configuration>
        </SnapIn>
      </Node>
    </Nodes>
  </ScopeTree>
</MMC_ConsoleFile>`;
    zip.file('JusticeSchedule.msc', mscXml);

    // 2. Setup.bat
    const setupBat = `@echo off
title ${appName} Setup Launcher
cd /d "%~dp0"
if exist "Install-JusticeSchedule.bat" (
    call "Install-JusticeSchedule.bat"
) else if exist "JusticeSchedule.msc" (
    start "" mmc.exe "%~dp0JusticeSchedule.msc"
) else (
    echo Unable to find installation components in this folder.
    pause
)
`;
    zip.file('Setup.bat', setupBat);

    // 3. Install-JusticeSchedule.bat
    const installBat = `@echo off
title ${appName} - Windows Setup & Console Installer
color 1F

echo =======================================================================
echo          ${appName.toUpperCase()} - COURT MANAGEMENT SYSTEM INSTALLER
echo          ${orgName.toUpperCase()}
echo =======================================================================
echo.
echo Installing ${appName} Console (.msc) and creating Desktop Shortcut...
echo.

set "INSTALL_DIR=%LOCALAPPDATA%\\JusticeSchedule"
set "MSC_FILE=%INSTALL_DIR%\\JusticeSchedule.msc"
set "DESKTOP_SHORTCUT=%USERPROFILE%\\Desktop\\${appName}.lnk"
set "START_MENU=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\${appName}"
set "URL_FILE=%INSTALL_DIR%\\${appName}.url"

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

if exist "%~dp0JusticeSchedule.msc" (
    copy /y "%~dp0JusticeSchedule.msc" "%MSC_FILE%" >nul
    echo [1/4] Copied JusticeSchedule.msc to %INSTALL_DIR%
)

(
echo [InternetShortcut]
echo URL=${appUrl}
echo IconIndex=0
echo IconFile=shell32.dll
) > "%URL_FILE%"

echo [2/4] Creating Windows Desktop Shortcut...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%DESKTOP_SHORTCUT%'); $s.TargetPath = 'mmc.exe'; $s.Arguments = '\"%MSC_FILE%\"'; $s.Description = '${appName} Judicial Management Console'; $s.IconLocation = 'shell32.dll,261'; $s.Save()"

echo [3/4] Creating Start Menu Program Entry...
if not exist "%START_MENU%" mkdir "%START_MENU%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%START_MENU%\\${appName} Console.lnk'); $s.TargetPath = 'mmc.exe'; $s.Arguments = '\"%MSC_FILE%\"'; $s.Description = '${appName} Management Console'; $s.IconLocation = 'shell32.dll,261'; $s.Save()"

echo [4/4] Registering in Administrative Tools...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$adminTools = [Environment]::GetFolderPath('CommonAdminTools'); if (Test-Path $adminTools) { try { $ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut(\"$adminTools\\${appName} Console.lnk\"); $s.TargetPath = 'mmc.exe'; $s.Arguments = '\"%MSC_FILE%\"'; $s.Description = '${appName} Management Console'; $s.Save() } catch {} }"

echo.
echo =======================================================================
echo               INSTALLATION COMPLETED SUCCESSFULLY!
echo =======================================================================
echo.
echo 1. Installed at: %MSC_FILE%
echo 2. Desktop shortcut created: %DESKTOP_SHORTCUT%
echo.
echo Launching ${appName} Console now...
timeout /t 2 >nul
start "" mmc.exe "%MSC_FILE%"
`;
    zip.file('Install-JusticeSchedule.bat', installBat);

    // 4. Install-JusticeSchedule.ps1
    const psScript = `# PowerShell Administrative Installer
$InstallDir = "$env:LOCALAPPDATA\\JusticeSchedule"
$MscPath = "$InstallDir\\JusticeSchedule.msc"
$DesktopShortcut = "$([Environment]::GetFolderPath('Desktop'))\\${appName}.lnk"
if (-not (Test-Path $InstallDir)) { New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null }
@'
${mscXml}
'@ | Out-File -FilePath $MscPath -Encoding utf8 -Force
$ws = New-Object -ComObject WScript.Shell
$s = $ws.CreateShortcut($DesktopShortcut)
$s.TargetPath = "mmc.exe"
$s.Arguments = '"' + $MscPath + '"'
$s.Description = "${appName} Judicial Management Console"
$s.Save()
Start-Process "mmc.exe" -ArgumentList ('"' + $MscPath + '"')
`;
    zip.file('Install-JusticeSchedule.ps1', psScript);

    // 5. Justice Schedule.url
    zip.file('Justice Schedule.url', `[InternetShortcut]\nURL=${appUrl}\nIconIndex=0\nIconFile=shell32.dll\n`);

    // 6. README
    const readme = `===============================================================================
       ${appName.toUpperCase()} - COMPLETE WINDOWS INSTALLATION PACKAGE
       ${orgName.toUpperCase()}
===============================================================================

This package contains all installation packages for ${appName}.

QUICK START:
1. Double-click "Setup.bat" or "Install-JusticeSchedule.bat".
2. The installer will automatically install JusticeSchedule.msc and create desktop shortcuts.
3. You can also double-click "JusticeSchedule.msc" directly to launch with mmc.exe.

Target Server: ${appUrl}
`;
    zip.file('README-INSTALLATION.txt', readme);

    // 7. manifest.json
    zip.file('package_manifest.json', JSON.stringify({
      appName,
      orgName,
      serverUrl: appUrl,
      packagedAt: new Date().toISOString(),
      files: ['Setup.bat', 'Install-JusticeSchedule.bat', 'JusticeSchedule.msc', 'Install-JusticeSchedule.ps1', 'Justice Schedule.url', 'README-INSTALLATION.txt']
    }, null, 2));

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="JusticeSchedule-Complete-Installer.zip"`);
    return res.send(zipBuffer);
  } catch (error: any) {
    console.error('ZIP package generation error:', error);
    return res.status(500).send('Error generating ZIP package');
  }
});

export default router;

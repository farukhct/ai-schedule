# Justice Schedule
### Professional Offline Schedule Management System for Court & Judicial Activities

**Justice Schedule** is a full-featured, offline-first Schedule Management Application tailored for judicial chambers, high courts, district tribunals, and legal registries. It runs completely offline without requiring any cloud databases, external APIs, or internet connectivity.

---

## Key Features

1. **Local Embedded SQLite Database**
   - Stored in `data/justice_schedule.sqlite`
   - Auto-creates tables, indexes, and initial Administrator credentials on first run
   - Fast B-Tree indexed search across Serial No, Date, Time, Venue, and Matters
   - Zero dummy schedules (real data entry required)

2. **One-Page Schedule Dashboard (CRUD)**
   - **Serial No**: Auto-generated numeric ID, strictly unique, read-only during edit
   - **Date**: Standard datepicker with strict **DD-MM-YYYY** display formatting throughout (e.g. `23-09-2026`)
   - **Time**: 24-hour and standard time entry
   - **Venue**: Rapid selection for Court Rooms, Judicial Chambers, and Benches
   - **Description**: Detailed multiline matter information (Parties, Case No, Stage)
   - **Remarks**: Multiline judicial notes & directions
   - **Form Actions**: New, Save, Update, Clear, Cancel
   - **Duplicate Warning Detection**: Identifies conflicts if matter exists on same date/time/venue

3. **Data Grid & Advanced Search**
   - Sort by Serial No, Date, Time, Venue (default: Date ascending → Time ascending)
   - Quick date filters: Today, Tomorrow, This Week, This Month, This Year, Custom Range, All
   - Partial text search across all columns
   - Pagination (10, 15, 25, 50 rows)
   - Responsive table, alternating row striping, sticky headers, total record count

4. **Dynamic Dashboard Statistics**
   - Real SQLite metrics: Total Schedules, Today's Schedule, Upcoming Schedule, This Month
   - Dedicated "Today's Schedule" cause list ordered by time
   - Chronological Upcoming Docket preview

5. **Official Judicial Printing & Export**
   - Official letterhead report formatting ("JUSTICE SCHEDULE")
   - Support for: All Schedules, Today's Cause List, Filtered Selection, Single Proceeding Slip
   - Orientation switcher (Portrait / Landscape)
   - Print-optimized CSS (`@media print`) that suppresses all UI controls and navigation
   - Export to CSV, Excel (`.xls`), and Word (`.doc`)

6. **Offline Security & User Management**
   - Local bcrypt password hashing
   - Local Offline Password Reset using security question verification (no email required)
   - Role-Based Access Control (Administrator / User)
   - User creation, deactivation, password reset, and deletion
   - Audit trail on every record: Created By, Created Date, Updated By, Updated Date

7. **Database Backup & Disaster Recovery**
   - Download standalone SQLite database binary backup (`.sqlite`)
   - Export structured JSON database dump (`.json`)
   - Restore database with confirmation protection

---

## Installation & Offline Deployment (Windows & Any Computer)

### System Requirements
- Operating System: Windows 10/11, Windows Server, Linux, or macOS
- Node.js (v18.0.0 or higher)
- No internet access needed after initial dependency installation

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Build Client Bundle (For Production)
```bash
npm run build
```

### Step 3: Run the Application
#### Windows One-Click:
Double-click `run-justice-schedule.bat` or run:
```cmd
run-justice-schedule.bat
```

#### Command Line:
```bash
npm start
```
The server starts locally on `http://localhost:3000`.

---

## Initial Offline Credentials
When launched for the first time, Justice Schedule initializes the local SQLite database and registers the default Administrator account:

- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `Administrator`

After logging in, you can change your password at any time via **Change Password** or create custom user accounts via **User Management**.

---

## Keyboard Shortcuts
- `Ctrl + N`: Open New Schedule form and focus input
- `Ctrl + S`: Save / Update current schedule record
- `Ctrl + F`: Focus quick search box
- `Ctrl + P`: Open official Print Preview modal
- `Esc`: Close any open dialog or view modal

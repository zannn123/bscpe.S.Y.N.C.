const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts for development
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Initialize SQLite database
const db = new sqlite3.Database('cpe_sync.db');

// Create tables
db.serialize(() => {
  // Students table
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      idNumber TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Events table
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      dateTime DATETIME NOT NULL,
      attendanceCode TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      createdBy TEXT DEFAULT 'admin'
    )
  `);

  // Attendance table
  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventId TEXT NOT NULL,
      studentId INTEGER NOT NULL,
      attendanceCode TEXT NOT NULL,
      proofImage TEXT,
      caption TEXT,
      status TEXT DEFAULT 'pending',
      submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      verifiedAt DATETIME,
      FOREIGN KEY (eventId) REFERENCES events (id),
      FOREIGN KEY (studentId) REFERENCES students (id)
    )
  `);

  // Admin actions log
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Admin code (can be changed)
const ADMIN_CODE = 'CPE-SYNC-ADMIN-2025';

// Helper functions
function generateAttendanceCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function logAdminAction(action, details = '') {
  db.run(
    'INSERT INTO admin_actions (action, details) VALUES (?, ?)',
    [action, details]
  );
}

// API Routes

// Student Registration
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, idNumber, password } = req.body;

    if (!fullName || !idNumber || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if student already exists
    db.get(
      'SELECT id FROM students WHERE idNumber = ?',
      [idNumber],
      async (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (row) {
          return res.status(400).json({ error: 'Student with this ID already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new student
        db.run(
          'INSERT INTO students (fullName, idNumber, password) VALUES (?, ?, ?)',
          [fullName, idNumber, hashedPassword],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to register student' });
            }

            res.json({ 
              message: 'Registration successful',
              studentId: this.lastID
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Student Login
app.post('/api/login', (req, res) => {
  const { idNumber, password } = req.body;

  if (!idNumber || !password) {
    return res.status(400).json({ error: 'ID Number and password are required' });
  }

  db.get(
    'SELECT * FROM students WHERE idNumber = ?',
    [idNumber],
    async (err, student) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!student || !(await bcrypt.compare(password, student.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.json({
        message: 'Login successful',
        user: {
          id: student.id,
          fullName: student.fullName,
          idNumber: student.idNumber,
          role: 'student'
        }
      });
    }
  );
});

// Admin Login
app.post('/api/admin-login', (req, res) => {
  const { adminCode } = req.body;

  if (!adminCode) {
    return res.status(400).json({ error: 'Admin code is required' });
  }

  if (adminCode !== ADMIN_CODE) {
    return res.status(401).json({ error: 'Invalid admin code' });
  }

  logAdminAction('Admin Login', 'Administrator logged in');

  res.json({
    message: 'Admin login successful',
    user: {
      id: 'admin',
      fullName: 'Administrator',
      role: 'admin'
    }
  });
});

// Get Events (for students)
app.get('/api/events', (req, res) => {
  const now = new Date().toISOString();
  
  db.all(
    'SELECT id, title, description, dateTime, createdAt FROM events ORDER BY dateTime ASC',
    [],
    (err, events) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch events' });
      }

      const eventsWithStatus = events.map(event => {
        const eventDate = new Date(event.dateTime);
        const currentDate = new Date();
        
        let status = 'upcoming';
        if (eventDate <= currentDate) {
          const timeDiff = currentDate - eventDate;
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          status = hoursDiff <= 4 ? 'ongoing' : 'ended'; // Consider event ongoing for 4 hours
        }

        return {
          ...event,
          status
        };
      });

      res.json(eventsWithStatus);
    }
  );
});

// Get Events with codes (for admin)
app.get('/api/admin/events', (req, res) => {
  db.all(
    'SELECT * FROM events ORDER BY dateTime DESC',
    [],
    (err, events) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch events' });
      }
      res.json(events);
    }
  );
});

// Create Event (admin only)
app.post('/api/admin/events', (req, res) => {
  const { title, description, dateTime, attendanceCode } = req.body;

  if (!title || !dateTime) {
    return res.status(400).json({ error: 'Title and date/time are required' });
  }

  const eventId = uuidv4();
  const code = attendanceCode || generateAttendanceCode();

  db.run(
    'INSERT INTO events (id, title, description, dateTime, attendanceCode) VALUES (?, ?, ?, ?, ?)',
    [eventId, title, description || '', dateTime, code],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create event' });
      }

      const newEvent = {
        id: eventId,
        title,
        description: description || '',
        dateTime,
        attendanceCode: code,
        createdAt: new Date().toISOString()
      };

      logAdminAction('Event Created', `Event: ${title}`);

      // Emit real-time update to all connected clients
      io.emit('eventCreated', newEvent);

      res.json({
        message: 'Event created successfully',
        event: newEvent
      });
    }
  );
});

// Submit Attendance
app.post('/api/attendance', upload.single('proofImage'), (req, res) => {
  const { eventId, studentId, attendanceCode, caption } = req.body;

  if (!eventId || !studentId || !attendanceCode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if event exists and get its attendance code
  db.get(
    'SELECT attendanceCode, title FROM events WHERE id = ?',
    [eventId],
    (err, event) => {
      if (err || !event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (attendanceCode !== event.attendanceCode) {
        return res.status(400).json({ error: 'Invalid attendance code' });
      }

      // Check if student already submitted for this event
      db.get(
        'SELECT id FROM attendance WHERE eventId = ? AND studentId = ?',
        [eventId, studentId],
        (err, existing) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (existing) {
            return res.status(400).json({ error: 'Attendance already submitted for this event' });
          }

          // Convert image to base64 if provided
          let proofImageData = null;
          if (req.file) {
            proofImageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
          }

          // Insert attendance record
          db.run(
            'INSERT INTO attendance (eventId, studentId, attendanceCode, proofImage, caption) VALUES (?, ?, ?, ?, ?)',
            [eventId, studentId, attendanceCode, proofImageData, caption || ''],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to submit attendance' });
              }

              // Emit real-time update to admin
              io.emit('attendanceSubmitted', {
                eventId,
                eventTitle: event.title,
                studentId,
                submittedAt: new Date().toISOString()
              });

              res.json({
                message: 'Attendance submitted successfully',
                attendanceId: this.lastID
              });
            }
          );
        }
      );
    }
  );
});

// Get Student's Attendance History
app.get('/api/attendance/student/:studentId', (req, res) => {
  const { studentId } = req.params;

  db.all(`
    SELECT a.*, e.title as eventTitle, e.dateTime as eventDateTime
    FROM attendance a
    JOIN events e ON a.eventId = e.id
    WHERE a.studentId = ?
    ORDER BY a.submittedAt DESC
  `, [studentId], (err, records) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch attendance history' });
    }
    res.json(records);
  });
});

// Get Event Attendance (admin)
app.get('/api/admin/attendance/:eventId', (req, res) => {
  const { eventId } = req.params;

  db.all(`
    SELECT a.*, s.fullName, s.idNumber
    FROM attendance a
    JOIN students s ON a.studentId = s.id
    WHERE a.eventId = ?
    ORDER BY a.submittedAt DESC
  `, [eventId], (err, records) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch event attendance' });
    }
    res.json(records);
  });
});

// Update Attendance Status (admin)
app.put('/api/admin/attendance/:attendanceId', (req, res) => {
  const { attendanceId } = req.params;
  const { status } = req.body;

  if (!['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.run(
    'UPDATE attendance SET status = ?, verifiedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [status, attendanceId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update attendance status' });
      }

      logAdminAction('Attendance Status Updated', `Attendance ID: ${attendanceId}, Status: ${status}`);

      // Emit real-time update
      io.emit('attendanceStatusUpdated', {
        attendanceId,
        status,
        verifiedAt: new Date().toISOString()
      });

      res.json({ message: 'Attendance status updated successfully' });
    }
  );
});

// Get All Students (admin)
app.get('/api/admin/students', (req, res) => {
  db.all(
    'SELECT id, fullName, idNumber, createdAt FROM students ORDER BY createdAt DESC',
    [],
    (err, students) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch students' });
      }
      res.json(students);
    }
  );
});

// Delete Student (admin)
app.delete('/api/admin/students/:studentId', (req, res) => {
  const { studentId } = req.params;

  // First get student info for logging
  db.get(
    'SELECT fullName, idNumber FROM students WHERE id = ?',
    [studentId],
    (err, student) => {
      if (err || !student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      // Delete student's attendance records first
      db.run(
        'DELETE FROM attendance WHERE studentId = ?',
        [studentId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to delete student attendance' });
          }

          // Delete student
          db.run(
            'DELETE FROM students WHERE id = ?',
            [studentId],
            (err) => {
              if (err) {
                return res.status(500).json({ error: 'Failed to delete student' });
              }

              logAdminAction('Student Deleted', `${student.fullName} (${student.idNumber})`);

              res.json({ message: 'Student deleted successfully' });
            }
          );
        }
      );
    }
  );
});

// Get Dashboard Stats (admin)
app.get('/api/admin/stats', (req, res) => {
  const stats = {};

  // Get total students
  db.get('SELECT COUNT(*) as count FROM students', [], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    
    stats.totalStudents = result.count;

    // Get total events
    db.get('SELECT COUNT(*) as count FROM events', [], (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      
      stats.totalEvents = result.count;

      // Get pending verifications
      db.get('SELECT COUNT(*) as count FROM attendance WHERE status = "pending"', [], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        stats.pendingVerifications = result.count;

        // Get verified attendance today
        const today = new Date().toISOString().split('T')[0];
        db.get(
          'SELECT COUNT(*) as count FROM attendance WHERE status = "verified" AND DATE(verifiedAt) = ?',
          [today],
          (err, result) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            
            stats.verifiedToday = result.count;

            res.json(stats);
          }
        );
      });
    });
  });
});

// Export Attendance CSV
app.get('/api/admin/export/:eventId', (req, res) => {
  const { eventId } = req.params;

  db.get('SELECT title FROM events WHERE id = ?', [eventId], (err, event) => {
    if (err || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    db.all(`
      SELECT s.fullName, s.idNumber, a.status, a.submittedAt, a.verifiedAt
      FROM attendance a
      JOIN students s ON a.studentId = s.id
      WHERE a.eventId = ?
      ORDER BY s.fullName ASC
    `, [eventId], (err, records) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to export data' });
      }

      // Generate CSV
      let csv = 'Full Name,ID Number,Status,Submitted At,Verified At\n';
      records.forEach(record => {
        csv += `"${record.fullName}","${record.idNumber}","${record.status}","${record.submittedAt || ''}","${record.verifiedAt || ''}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${event.title}_attendance.csv"`);
      res.send(csv);

      logAdminAction('Attendance Exported', `Event: ${event.title}`);
    });
  });
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Join admin room for admin-specific updates
  socket.on('joinAdmin', () => {
    socket.join('admin');
    console.log('Admin joined room');
  });

  // Join student room for student-specific updates
  socket.on('joinStudent', (studentId) => {
    socket.join(`student_${studentId}`);
    console.log(`Student ${studentId} joined room`);
  });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`CPE Sync server running on port ${PORT}`);
  console.log(`Admin Code: ${ADMIN_CODE}`);
});
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Create uploads directory if it doesn't exist
async function ensureUploadsDir() {
  try {
    await fs.mkdir('uploads', { recursive: true });
  } catch (error) {
    console.log('Uploads directory already exists');
  }
}

// In-memory data storage (in production, use a database)
let users = [];
let events = [];
let attendanceRecords = [];
let connectedUsers = new Map(); // Map socket.id to user info

// Admin code
const ADMIN_CODE = "CPE-SYNC-ADMIN-2025";

// Helper functions
function generateAttendanceCode() {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

function findUserById(userId) {
  return users.find(user => user.id === userId);
}

function findUserByIdNumber(idNumber) {
  return users.find(user => user.idNumber === idNumber);
}

function findEventById(eventId) {
  return events.find(event => event.id === eventId);
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('authenticate', (data) => {
    const { userId, role } = data;
    connectedUsers.set(socket.id, { userId, role });
    console.log(`User ${userId} authenticated as ${role}`);
  });

  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
    console.log('User disconnected:', socket.id);
  });
});

// Broadcast functions
function broadcastToStudents(eventName, data) {
  connectedUsers.forEach((userInfo, socketId) => {
    if (userInfo.role === 'student') {
      io.to(socketId).emit(eventName, data);
    }
  });
}

function broadcastToAdmins(eventName, data) {
  connectedUsers.forEach((userInfo, socketId) => {
    if (userInfo.role === 'admin') {
      io.to(socketId).emit(eventName, data);
    }
  });
}

function broadcastToAll(eventName, data) {
  io.emit(eventName, data);
}

// Routes

// Student registration
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, idNumber, password } = req.body;

    if (!fullName || !idNumber || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if ID number already exists
    if (findUserByIdNumber(idNumber)) {
      return res.status(400).json({ error: 'ID number already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      fullName,
      idNumber,
      password: hashedPassword,
      role: 'student',
      registeredAt: new Date().toISOString()
    };

    users.push(user);
    
    res.json({ 
      message: 'Registration successful',
      user: {
        id: user.id,
        fullName: user.fullName,
        idNumber: user.idNumber,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Student login
app.post('/api/login/student', async (req, res) => {
  try {
    const { idNumber, password } = req.body;

    if (!idNumber || !password) {
      return res.status(400).json({ error: 'ID number and password are required' });
    }

    const user = findUserByIdNumber(idNumber);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        fullName: user.fullName,
        idNumber: user.idNumber,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin login
app.post('/api/login/admin', (req, res) => {
  try {
    const { adminCode } = req.body;

    if (!adminCode) {
      return res.status(400).json({ error: 'Admin code is required' });
    }

    if (adminCode !== ADMIN_CODE) {
      return res.status(401).json({ error: 'Invalid admin code' });
    }

    res.json({
      message: 'Admin login successful',
      user: {
        id: 'admin',
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all events (for students)
app.get('/api/events', (req, res) => {
  try {
    const now = new Date();
    const activeEvents = events.filter(event => {
      const eventTime = new Date(event.dateTime);
      // Show events that are within 12 hours of their start time
      const timeDiff = eventTime.getTime() - now.getTime();
      return timeDiff > -12 * 60 * 60 * 1000; // 12 hours in milliseconds
    });

    // Don't send attendance codes to students
    const sanitizedEvents = activeEvents.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      dateTime: event.dateTime,
      createdAt: event.createdAt
    }));

    res.json(sanitizedEvents);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all events (for admin)
app.get('/api/admin/events', (req, res) => {
  try {
    res.json(events);
  } catch (error) {
    console.error('Get admin events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new event (admin only)
app.post('/api/admin/events', (req, res) => {
  try {
    const { title, description, dateTime, attendanceCode } = req.body;

    if (!title || !description || !dateTime) {
      return res.status(400).json({ error: 'Title, description, and date/time are required' });
    }

    const event = {
      id: uuidv4(),
      title,
      description,
      dateTime,
      attendanceCode: attendanceCode || generateAttendanceCode(),
      createdAt: new Date().toISOString()
    };

    events.push(event);

    // Broadcast new event to all students
    broadcastToStudents('newEvent', {
      id: event.id,
      title: event.title,
      description: event.description,
      dateTime: event.dateTime,
      createdAt: event.createdAt
    });

    res.json({ message: 'Event created successfully', event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update event (admin only)
app.put('/api/admin/events/:eventId', (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, description, dateTime, attendanceCode } = req.body;

    const eventIndex = events.findIndex(event => event.id === eventId);
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    events[eventIndex] = {
      ...events[eventIndex],
      title: title || events[eventIndex].title,
      description: description || events[eventIndex].description,
      dateTime: dateTime || events[eventIndex].dateTime,
      attendanceCode: attendanceCode || events[eventIndex].attendanceCode,
      updatedAt: new Date().toISOString()
    };

    // Broadcast updated event to all students
    broadcastToStudents('eventUpdated', {
      id: events[eventIndex].id,
      title: events[eventIndex].title,
      description: events[eventIndex].description,
      dateTime: events[eventIndex].dateTime
    });

    res.json({ message: 'Event updated successfully', event: events[eventIndex] });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete event (admin only)
app.delete('/api/admin/events/:eventId', (req, res) => {
  try {
    const { eventId } = req.params;

    const eventIndex = events.findIndex(event => event.id === eventId);
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    events.splice(eventIndex, 1);
    
    // Remove associated attendance records
    attendanceRecords = attendanceRecords.filter(record => record.eventId !== eventId);

    // Broadcast event deletion to all students
    broadcastToStudents('eventDeleted', { eventId });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit attendance
app.post('/api/attendance', upload.single('proofPhoto'), async (req, res) => {
  try {
    const { eventId, userId, attendanceCode, caption } = req.body;

    if (!eventId || !userId || !attendanceCode) {
      return res.status(400).json({ error: 'Event ID, user ID, and attendance code are required' });
    }

    const event = findEventById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const user = findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if attendance code is correct
    if (attendanceCode !== event.attendanceCode) {
      return res.status(400).json({ error: 'Invalid attendance code' });
    }

    // Check if user already submitted attendance for this event
    const existingRecord = attendanceRecords.find(
      record => record.eventId === eventId && record.userId === userId
    );

    if (existingRecord) {
      return res.status(400).json({ error: 'Attendance already submitted for this event' });
    }

    const attendanceRecord = {
      id: uuidv4(),
      eventId,
      userId,
      userFullName: user.fullName,
      userIdNumber: user.idNumber,
      attendanceCode,
      caption: caption || '',
      proofPhoto: req.file ? req.file.filename : null,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    attendanceRecords.push(attendanceRecord);

    // Broadcast new attendance submission to admins
    broadcastToAdmins('newAttendanceSubmission', {
      ...attendanceRecord,
      eventTitle: event.title
    });

    res.json({ 
      message: 'Attendance submitted successfully',
      record: {
        id: attendanceRecord.id,
        status: attendanceRecord.status,
        submittedAt: attendanceRecord.submittedAt
      }
    });
  } catch (error) {
    console.error('Submit attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's attendance history
app.get('/api/attendance/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const userRecords = attendanceRecords.filter(record => record.userId === userId);
    
    const recordsWithEventInfo = userRecords.map(record => {
      const event = findEventById(record.eventId);
      return {
        id: record.id,
        eventTitle: event ? event.title : 'Unknown Event',
        status: record.status,
        submittedAt: record.submittedAt,
        caption: record.caption
      };
    });

    res.json(recordsWithEventInfo);
  } catch (error) {
    console.error('Get user attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance records for an event (admin only)
app.get('/api/admin/attendance/:eventId', (req, res) => {
  try {
    const { eventId } = req.params;

    const eventRecords = attendanceRecords.filter(record => record.eventId === eventId);
    
    res.json(eventRecords);
  } catch (error) {
    console.error('Get event attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update attendance status (admin only)
app.put('/api/admin/attendance/:recordId', (req, res) => {
  try {
    const { recordId } = req.params;
    const { status } = req.body;

    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const recordIndex = attendanceRecords.findIndex(record => record.id === recordId);
    if (recordIndex === -1) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    attendanceRecords[recordIndex].status = status;
    attendanceRecords[recordIndex].updatedAt = new Date().toISOString();

    // Broadcast status update to the specific student
    const record = attendanceRecords[recordIndex];
    connectedUsers.forEach((userInfo, socketId) => {
      if (userInfo.userId === record.userId) {
        io.to(socketId).emit('attendanceStatusUpdated', {
          recordId: record.id,
          status: record.status,
          eventId: record.eventId
        });
      }
    });

    res.json({ message: 'Attendance status updated successfully', record: attendanceRecords[recordIndex] });
  } catch (error) {
    console.error('Update attendance status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export attendance records as CSV (admin only)
app.get('/api/admin/export/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = findEventById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventRecords = attendanceRecords.filter(record => record.eventId === eventId);

    const csvWriter = createCsvWriter({
      path: `exports/attendance_${eventId}_${Date.now()}.csv`,
      header: [
        { id: 'userFullName', title: 'Full Name' },
        { id: 'userIdNumber', title: 'ID Number' },
        { id: 'status', title: 'Status' },
        { id: 'submittedAt', title: 'Submitted At' },
        { id: 'caption', title: 'Caption' }
      ]
    });

    // Create exports directory if it doesn't exist
    await fs.mkdir('exports', { recursive: true });

    await csvWriter.writeRecords(eventRecords);

    const filename = `attendance_${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const csvData = eventRecords.map(record => 
      `${record.userFullName},${record.userIdNumber},${record.status},${record.submittedAt},"${record.caption}"`
    ).join('\n');

    const header = 'Full Name,ID Number,Status,Submitted At,Caption\n';
    res.send(header + csvData);

  } catch (error) {
    console.error('Export attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all registered users (admin only)
app.get('/api/admin/users', (req, res) => {
  try {
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      fullName: user.fullName,
      idNumber: user.idNumber,
      registeredAt: user.registeredAt
    }));

    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user account (admin only)
app.delete('/api/admin/users/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users.splice(userIndex, 1);
    
    // Remove associated attendance records
    attendanceRecords = attendanceRecords.filter(record => record.userId !== userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize server
async function startServer() {
  await ensureUploadsDir();
  
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`CPE Sync server running on port ${PORT}`);
    console.log(`Admin code: ${ADMIN_CODE}`);
  });
}

startServer();
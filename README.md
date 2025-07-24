# CPE Sync - Centralized Attendance & Event Tracking System

CPE Sync is a modern, responsive web application designed for Computer Engineering students to manage attendance and track events in real-time. The system features a dual-role architecture with student and admin interfaces, powered by Socket.IO for real-time updates.

## 🌟 Features

### 🔒 Authentication System
- **Student Login**: Register using Full Name, ID Number, and Password
- **Admin Login**: Secure access using Admin Code: `CPE-SYNC-ADMIN-2025`
- Session persistence with local storage

### 🎓 Student Dashboard
- **Real-time Event Updates**: Automatically receives new events without page refresh
- **Event Viewing**: See current and upcoming events with live status indicators
- **Attendance Submission**: Submit attendance with code verification and photo proof
- **Personal History**: Track attendance status (Verified, Pending, Rejected)
- **Mobile-Responsive**: Works seamlessly on all devices

### 🛠 Admin Dashboard
- **Event Management**: Create, update, and delete events with auto-generated attendance codes
- **Real-time Statistics**: Live dashboard showing events, students, and attendance metrics
- **Attendance Monitoring**: View and manage all student submissions
- **Photo Verification**: Review submitted proof photos with modal viewer
- **Status Management**: Approve/reject attendance entries with real-time notifications
- **User Management**: View registered students and manage accounts
- **CSV Export**: Download attendance records for events

### ⚡ Real-time Features
- **Live Event Updates**: New events appear instantly on all connected devices
- **Real-time Notifications**: Push notifications for all major actions
- **Status Updates**: Attendance status changes notify students immediately
- **Admin Notifications**: Real-time alerts for new attendance submissions

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Glass Morphism**: Modern glass effect design elements
- **Dark/Light Mode**: Toggle between themes (optional feature)
- **Smooth Animations**: Slide-in effects and transitions
- **Intuitive Navigation**: Clean, user-friendly interface

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd cpe-sync
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   # or for development with auto-restart
   npm run dev
   ```

3. **Access the application**:
   - Open your browser to `http://localhost:3000`
   - Default admin code: `CPE-SYNC-ADMIN-2025`

## 📁 Project Structure

```
cpe-sync/
├── server.js              # Main server file with Socket.IO
├── package.json           # Dependencies and scripts
├── public/                # Frontend files
│   ├── index.html         # Main HTML file
│   └── app.js            # Frontend JavaScript application
├── uploads/              # Student-uploaded proof photos
├── exports/              # CSV export files (auto-created)
└── README.md            # This file
```

## 🔧 Configuration

### Admin Code
The admin authentication code is set in `server.js`:
```javascript
const ADMIN_CODE = "CPE-SYNC-ADMIN-2025";
```

### Port Configuration
Default port is 3000, can be changed via environment variable:
```bash
PORT=8080 npm start
```

## 📱 Usage Guide

### For Students:
1. **Register**: Create account with full name, ID number, and password
2. **Login**: Use your ID number and password
3. **View Events**: See real-time list of current and upcoming events
4. **Submit Attendance**: Click "Submit Attendance" on any active event
5. **Enter Code**: Input the attendance code provided by admin
6. **Upload Photo**: Provide proof photo (required)
7. **Track Status**: Monitor your attendance history and status updates

### For Admins:
1. **Login**: Use admin code `CPE-SYNC-ADMIN-2025`
2. **Create Events**: Use the "Create Event" button to add new events
3. **Monitor**: View real-time statistics on the dashboard
4. **Review Submissions**: Check attendance submissions with photo verification
5. **Approve/Reject**: Update attendance status for students
6. **Export Data**: Download CSV files of attendance records
7. **Manage Users**: View and delete student accounts if needed

## 🌐 API Endpoints

### Authentication
- `POST /api/register` - Student registration
- `POST /api/login/student` - Student login
- `POST /api/login/admin` - Admin login

### Events
- `GET /api/events` - Get events for students
- `GET /api/admin/events` - Get all events for admin
- `POST /api/admin/events` - Create new event
- `PUT /api/admin/events/:id` - Update event
- `DELETE /api/admin/events/:id` - Delete event

### Attendance
- `POST /api/attendance` - Submit attendance
- `GET /api/attendance/user/:userId` - Get user's attendance history
- `GET /api/admin/attendance/:eventId` - Get event attendance records
- `PUT /api/admin/attendance/:recordId` - Update attendance status
- `GET /api/admin/export/:eventId` - Export attendance CSV

### User Management
- `GET /api/admin/users` - Get all registered users
- `DELETE /api/admin/users/:userId` - Delete user account

## 🔌 Real-time Events (Socket.IO)

### Client Events:
- `authenticate` - Authenticate user connection
- `newEvent` - New event created
- `eventUpdated` - Event modified
- `eventDeleted` - Event removed
- `newAttendanceSubmission` - New attendance submitted
- `attendanceStatusUpdated` - Attendance status changed

## 🛡️ Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **File Upload Security**: Image-only file validation
- **Session Management**: Secure local storage with validation
- **Admin Code Protection**: Separate authentication for admin access
- **Input Validation**: Comprehensive server-side validation

## 🎯 Key Requirements Fulfilled

✅ **Two-Role System**: Student and Admin roles with appropriate dashboards  
✅ **Student Registration**: Full name, ID number, password authentication  
✅ **Admin Code Access**: Simple admin code authentication  
✅ **Event Management**: Create, view, update, delete events with attendance codes  
✅ **Real-time Updates**: Socket.IO powered live updates across all devices  
✅ **Photo Verification**: Required proof photo uploads with admin review  
✅ **Attendance Tracking**: Complete workflow from submission to verification  
✅ **Responsive Design**: Mobile-first, works on all screen sizes  
✅ **Export Functionality**: CSV export for attendance records  
✅ **User Management**: Admin can view and manage student accounts  

## 🚀 Deployment

For production deployment:

1. **Environment Variables**:
   ```bash
   export NODE_ENV=production
   export PORT=3000
   ```

2. **Process Manager** (PM2 recommended):
   ```bash
   npm install -g pm2
   pm2 start server.js --name "cpe-sync"
   ```

3. **Reverse Proxy** (Nginx recommended for production)

## 🔄 Real-time Testing

To test real-time functionality:
1. Open multiple browser windows/tabs
2. Login as admin in one, student in another
3. Create an event as admin - observe real-time appearance on student interface
4. Submit attendance as student - see real-time notification for admin
5. Approve/reject attendance - student receives instant status update

## 📞 Support

For questions or issues:
- Check the console for error messages
- Ensure all dependencies are installed correctly
- Verify the server is running on the correct port
- Check network connectivity for real-time features

## 🔮 Future Enhancements

- Database integration (MongoDB/PostgreSQL)
- Email notifications
- Advanced reporting and analytics
- Mobile app (React Native/Flutter)
- Multiple admin roles and permissions
- Event categories and filtering
- Attendance statistics and insights

---

**CPE Sync** - Streamlining attendance tracking with modern real-time technology! 🎓✨

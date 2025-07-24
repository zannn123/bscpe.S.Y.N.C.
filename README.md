# CPE Sync - Centralized Attendance & Event Tracking System

CPE Sync is a modern web-based attendance and event tracking system designed specifically for Computer Engineering students. It features real-time updates, role-based access control, and a responsive design that works across all devices.

## Features

### 🔒 Authentication System
- **Student Registration & Login**: Students register with full name, ID number, and password
- **Admin Access**: Secure admin login using admin code: `CPE-SYNC-ADMIN-2025`

### 🎓 Student Features
- View ongoing and upcoming events
- Submit attendance with attendance codes
- Upload proof photos with optional captions
- Track personal attendance history with verification status
- Real-time updates when events are created or modified
- Dark/light theme toggle

### 🛠 Admin Features
- **Event Management**: Create, view, and manage events with auto-generated or custom attendance codes
- **Attendance Monitoring**: Review and verify/reject student attendance submissions
- **User Management**: View and manage registered student accounts
- **Real-time Dashboard**: Live stats showing total students, events, pending verifications
- **Export Functionality**: Export attendance data as CSV files
- **Admin Action Logging**: Track all admin activities for auditing

### 🌟 Technical Features
- **Real-time Updates**: Socket.IO integration for instant updates across all devices
- **Responsive Design**: Mobile-first design that works on all screen sizes
- **Secure File Upload**: Image upload with validation and size limits
- **SQLite Database**: Lightweight, file-based database for easy deployment
- **Rate Limiting**: Protection against spam and abuse
- **Security Headers**: Helmet.js for enhanced security

## Tech Stack

- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: SQLite3 with bcrypt for password hashing
- **Frontend**: HTML5, CSS3 (Tailwind CSS), Vanilla JavaScript
- **File Upload**: Multer for handling image uploads
- **Real-time**: Socket.IO for live updates
- **Security**: Helmet, CORS, Rate Limiting

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cpe-sync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Access the application**
   - Open your browser and go to `http://localhost:3000`
   - The database will be automatically created on first run

## Default Admin Access

- **Admin Code**: `CPE-SYNC-ADMIN-2025`

## Environment Variables (Optional)

- `PORT`: Server port (default: 3000)

## Database Schema

The application uses SQLite with the following tables:
- `students`: Student account information
- `events`: Event details and attendance codes
- `attendance`: Attendance submissions and verification status
- `admin_actions`: Audit log of admin activities

## Usage

### For Students:
1. Register with your full name, ID number, and password
2. Login to view available events
3. Submit attendance by entering the attendance code and uploading a proof photo
4. Track your attendance history and verification status

### For Admins:
1. Login using the admin code
2. Create events with titles, descriptions, dates, and attendance codes
3. Monitor attendance submissions in real-time
4. Verify or reject student attendance submissions
5. Export attendance data for record-keeping
6. Manage student accounts as needed

## Security Features

- Password hashing with bcrypt
- Rate limiting on API endpoints
- File upload validation and size limits
- SQL injection protection
- XSS protection with security headers
- Admin action logging for accountability

## Real-time Features

The application provides instant updates for:
- New event creation (visible to all students immediately)
- Attendance submissions (notifications to admin)
- Attendance verification status updates
- Dashboard statistics updates

## Mobile Responsive

The application is fully responsive and provides an optimal experience on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## License

MIT License - feel free to use this project for educational purposes.

## Support

For technical support or questions about CPE Sync, please refer to the documentation or contact the development team.

---

**CPE Sync** - Making attendance tracking simple, secure, and efficient for Computer Engineering students.

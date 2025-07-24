import { useEffect, useState } from 'react';
import { Databases, Models } from 'appwrite';
import client from '../services/appwrite';

const AttendanceHistory = () => {
  const [attendance, setAttendance] = useState<Models.Document[]>([]);

  useEffect(() => {
    const databases = new Databases(client);

    const fetchAttendance = async () => {
      try {
        const response = await databases.listDocuments('YOUR_DATABASE_ID', 'YOUR_ATTENDANCE_COLLECTION_ID');
        setAttendance(response.documents);
      } catch (error) {
        console.error(error);
      }
    };

    fetchAttendance();

    const unsubscribe = client.subscribe(`databases.YOUR_DATABASE_ID.collections.YOUR_ATTENDANCE_COLLECTION_ID.documents`, (response) => {
      if (response.events.includes('databases.*.collections.*.documents.*.create')) {
        setAttendance((prevAttendance) => [response.payload, ...prevAttendance]);
      }
      if (response.events.includes('databases.*.collections.*.documents.*.update')) {
        setAttendance((prevAttendance) =>
          prevAttendance.map((item) => (item.$id === response.payload.$id ? response.payload : item))
        );
      }
      if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
        setAttendance((prevAttendance) => prevAttendance.filter((item) => item.$id !== response.payload.$id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div>
      <h2>Attendance History</h2>
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((item) => (
            <tr key={item.$id}>
              <td>{item.eventId}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceHistory;

import { useEffect, useState } from 'react';
import { Databases, Models } from 'appwrite';
import client from '../services/appwrite';
import AttendanceSubmissions from './AttendanceSubmissions';
import RealTimeStats from './RealTimeStats';

const AdminEventList = () => {
  const [events, setEvents] = useState<Models.Document[]>([]);

  useEffect(() => {
    const databases = new Databases(client);

    const fetchEvents = async () => {
      try {
        const response = await databases.listDocuments('YOUR_DATABASE_ID', 'YOUR_EVENTS_COLLECTION_ID');
        setEvents(response.documents);
      } catch (error) {
        console.error(error);
      }
    };

    fetchEvents();

    const unsubscribe = client.subscribe(`databases.YOUR_DATABASE_ID.collections.YOUR_EVENTS_COLLECTION_ID.documents`, (response) => {
      if (response.events.includes('databases.*.collections.*.documents.*.create')) {
        setEvents((prevEvents) => [response.payload, ...prevEvents]);
      }
      if (response.events.includes('databases.*.collections.*.documents.*.update')) {
        setEvents((prevEvents) =>
          prevEvents.map((event) => (event.$id === response.payload.$id ? response.payload : event))
        );
      }
      if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
        setEvents((prevEvents) => prevEvents.filter((event) => event.$id !== response.payload.$id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div>
      <h2>Events</h2>
      {events.map((event) => (
        <div key={event.$id}>
          <h3>{event.title}</h3>
          <p>{event.description}</p>
          <p>{new Date(event.time).toLocaleString()}</p>
          <p>Attendance Code: {event.attendanceCode}</p>
          <RealTimeStats eventId={event.$id} />
          <AttendanceSubmissions eventId={event.$id} />
        </div>
      ))}
    </div>
  );
};

export default AdminEventList;

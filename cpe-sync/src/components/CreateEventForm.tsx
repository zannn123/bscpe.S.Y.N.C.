import { useState } from 'react';
import { Databases, ID } from 'appwrite';
import client from '../services/appwrite';
import { logAdminAction } from '../services/log';

const CreateEventForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [attendanceCode, setAttendanceCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const databases = new Databases(client);

    try {
      const event = {
        title,
        description,
        time,
        attendanceCode,
      };
      await databases.createDocument('YOUR_DATABASE_ID', 'YOUR_EVENTS_COLLECTION_ID', ID.unique(), event);
      await logAdminAction('create_event', event);
      alert('Event created successfully!');
    } catch (error) {
      console.error(error);
      alert('Event creation failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Event</h2>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <input
        type="datetime-local"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Attendance Code"
        value={attendanceCode}
        onChange={(e) => setAttendanceCode(e.target.value)}
        required
      />
      <button type="submit">Create Event</button>
    </form>
  );
};

export default CreateEventForm;

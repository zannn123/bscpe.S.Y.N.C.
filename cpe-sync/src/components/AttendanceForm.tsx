import { useState } from 'react';
import { Databases, Storage, ID } from 'appwrite';
import client from '../services/appwrite';

interface AttendanceFormProps {
  eventId: string;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ eventId }) => {
  const [attendanceCode, setAttendanceCode] = useState('');
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);
  const [caption, setCaption] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const databases = new Databases(client);
    const storage = new Storage(client);

    try {
      let proofPhotoId = '';
      if (proofPhoto) {
        const response = await storage.createFile('YOUR_BUCKET_ID', ID.unique(), proofPhoto);
        proofPhotoId = response.$id;
      }

      await databases.createDocument('YOUR_DATABASE_ID', 'YOUR_ATTENDANCE_COLLECTION_ID', ID.unique(), {
        eventId,
        attendanceCode,
        proofPhotoId,
        caption,
        status: 'Pending',
      });

      alert('Attendance submitted successfully!');
    } catch (error) {
      console.error(error);
      alert('Attendance submission failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Submit Attendance</h3>
      <input
        type="text"
        placeholder="Attendance Code"
        value={attendanceCode}
        onChange={(e) => setAttendanceCode(e.target.value)}
        required
      />
      <input
        type="file"
        accept="image/jpeg, image/png"
        onChange={(e) => setProofPhoto(e.target.files ? e.target.files[0] : null)}
      />
      <input
        type="text"
        placeholder="Caption"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <button type="submit">Submit</button>
    </form>
  );
};

export default AttendanceForm;

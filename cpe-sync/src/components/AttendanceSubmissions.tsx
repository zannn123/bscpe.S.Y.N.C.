import { useEffect, useState } from 'react';
import { Databases, Models, Storage, Query } from 'appwrite';
import client from '../services/appwrite';
import { logAdminAction } from '../services/log';

interface AttendanceSubmissionsProps {
  eventId: string;
}

const AttendanceSubmissions: React.FC<AttendanceSubmissionsProps> = ({ eventId }) => {
  const [submissions, setSubmissions] = useState<Models.Document[]>([]);
  const storage = new Storage(client);

  useEffect(() => {
    const databases = new Databases(client);

    const fetchSubmissions = async () => {
      try {
        const response = await databases.listDocuments(
          'YOUR_DATABASE_ID',
          'YOUR_ATTENDANCE_COLLECTION_ID',
          [Query.equal("eventId", eventId)]
        );
        setSubmissions(response.documents);
      } catch (error) {
        console.error(error);
      }
    };

    fetchSubmissions();

    const unsubscribe = client.subscribe(`databases.YOUR_DATABASE_ID.collections.YOUR_ATTENDANCE_COLLECTION_ID.documents`, (response) => {
      if (response.payload.eventId === eventId) {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          setSubmissions((prevSubmissions) => [response.payload, ...prevSubmissions]);
        }
        if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          setSubmissions((prevSubmissions) =>
            prevSubmissions.map((submission) =>
              submission.$id === response.payload.$id ? response.payload : submission
            )
          );
        }
        if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
          setSubmissions((prevSubmissions) =>
            prevSubmissions.filter((submission) => submission.$id !== response.payload.$id)
          );
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [eventId]);

  const getFilePreview = (fileId: string) => {
    return storage.getFilePreview('YOUR_BUCKET_ID', fileId);
  };

  const handleUpdateStatus = async (submissionId: string, status: string) => {
    const databases = new Databases(client);
    try {
      await databases.updateDocument('YOUR_DATABASE_ID', 'YOUR_ATTENDANCE_COLLECTION_ID', submissionId, {
        status,
      });
      await logAdminAction('update_submission_status', { submissionId, status });
      alert(`Submission ${status.toLowerCase()}!`);
    } catch (error) {
      console.error(error);
      alert('Failed to update submission status.');
    }
  };

  return (
    <div>
      <h3>Attendance Submissions</h3>
      <table>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Proof Photo</th>
            <th>Caption</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission.$id}>
              <td>{submission.userId}</td>
              <td>
                {submission.proofPhotoId && (
                  <img src={getFilePreview(submission.proofPhotoId).href} alt="Proof" width="100" />
                )}
              </td>
              <td>{submission.caption}</td>
              <td>{submission.status}</td>
              <td>
                <button onClick={() => handleUpdateStatus(submission.$id, 'Verified')}>Approve</button>
                <button onClick={() => handleUpdateStatus(submission.$id, 'Rejected')}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceSubmissions;

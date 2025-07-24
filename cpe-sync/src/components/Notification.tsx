import { useEffect, useState } from 'react';
import { Databases, Models, Query } from 'appwrite';
import client from '../services/appwrite';

const Notification = () => {
  const [pendingSubmissions, setPendingSubmissions] = useState(0);

  useEffect(() => {
    const databases = new Databases(client);

    const fetchPendingSubmissions = async () => {
      try {
        const response = await databases.listDocuments(
          'YOUR_DATABASE_ID',
          'YOUR_ATTENDANCE_COLLECTION_ID',
          [Query.equal('status', 'Pending')]
        );
        setPendingSubmissions(response.total);
      } catch (error) {
        console.error(error);
      }
    };

    fetchPendingSubmissions();

    const unsubscribe = client.subscribe(`databases.YOUR_DATABASE_ID.collections.YOUR_ATTENDANCE_COLLECTION_ID.documents`, (response) => {
      if (response.events.includes('databases.*.collections.*.documents.*.create') && response.payload.status === 'Pending') {
        setPendingSubmissions((prev) => prev + 1);
      }
      if (response.events.includes('databases.*.collections.*.documents.*.update') && response.payload.status !== 'Pending') {
        setPendingSubmissions((prev) => prev - 1);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div>
      {pendingSubmissions > 0 && (
        <p>There are {pendingSubmissions} pending submissions.</p>
      )}
    </div>
  );
};

export default Notification;

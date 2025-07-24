import { useEffect, useState } from 'react';
import { Databases, Models, Query } from 'appwrite';
import client from '../services/appwrite';

interface RealTimeStatsProps {
  eventId: string;
}

const RealTimeStats: React.FC<RealTimeStatsProps> = ({ eventId }) => {
  const [verifiedAttendees, setVerifiedAttendees] = useState(0);
  const [totalAttendees, setTotalAttendees] = useState(0);

  useEffect(() => {
    const databases = new Databases(client);

    const fetchStats = async () => {
      try {
        const [verifiedResponse, totalResponse] = await Promise.all([
          databases.listDocuments('YOUR_DATABASE_ID', 'YOUR_ATTENDANCE_COLLECTION_ID', [
            Query.equal('eventId', eventId),
            Query.equal('status', 'Verified'),
          ]),
          databases.listDocuments('YOUR_DATABASE_ID', 'YOUR_ATTENDANCE_COLLECTION_ID', [
            Query.equal('eventId', eventId),
          ]),
        ]);
        setVerifiedAttendees(verifiedResponse.total);
        setTotalAttendees(totalResponse.total);
      } catch (error) {
        console.error(error);
      }
    };

    fetchStats();

    const unsubscribe = client.subscribe(`databases.YOUR_DATABASE_ID.collections.YOUR_ATTENDANCE_COLLECTION_ID.documents`, (response) => {
      if (response.payload.eventId === eventId) {
        fetchStats();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [eventId]);

  return (
    <div>
      <h3>Real-Time Stats</h3>
      <p>Verified Attendees: {verifiedAttendees}</p>
      <p>Total Submissions: {totalAttendees}</p>
    </div>
  );
};

export default RealTimeStats;

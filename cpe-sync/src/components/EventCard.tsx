import { Models } from 'appwrite';
import AttendanceForm from './AttendanceForm';

interface EventCardProps {
  event: Models.Document;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  return (
    <div>
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      <p>{new Date(event.time).toLocaleString()}</p>
      <AttendanceForm eventId={event.$id} />
    </div>
  );
};

export default EventCard;

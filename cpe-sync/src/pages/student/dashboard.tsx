import type { NextPage } from 'next';
import Head from 'next/head';
import EventList from '../../components/EventList';
import AttendanceHistory from '../../components/AttendanceHistory';

const StudentDashboard: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Student Dashboard</title>
        <meta name="description" content="CPE Sync - Student Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Student Dashboard</h1>
        <EventList />
        <AttendanceHistory />
      </main>
    </div>
  );
};

export default StudentDashboard;

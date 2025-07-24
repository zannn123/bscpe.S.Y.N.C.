import type { NextPage } from 'next';
import Head from 'next/head';
import CreateEventForm from '../../components/CreateEventForm';
import AdminEventList from '../../components/AdminEventList';
import UserList from '../../components/UserList';
import Notification from '../../components/Notification';

const AdminDashboard: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Admin Dashboard</title>
        <meta name="description" content="CPE Sync - Admin Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Admin Dashboard</h1>
        <Notification />
        <CreateEventForm />
        <AdminEventList />
        <UserList />
      </main>
    </div>
  );
};

export default AdminDashboard;

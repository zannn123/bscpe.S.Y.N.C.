import type { NextPage } from 'next';
import Head from 'next/head';
import StudentLoginForm from '../components/StudentLoginForm';
import StudentRegisterForm from '../components/StudentRegisterForm';
import AdminLoginForm from '../components/AdminLoginForm';
import ThemeToggleButton from '../components/ThemeToggleButton';

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>CPE Sync</title>
        <meta name="description" content="CPE Sync - Attendance and Event Tracking System" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <ThemeToggleButton />
        <h1>Welcome to CPE Sync</h1>
        <StudentRegisterForm />
        <StudentLoginForm />
        <AdminLoginForm />
      </main>
    </div>
  );
};

export default Home;

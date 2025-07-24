import { useState } from 'react';
import { useRouter } from 'next/router';

const AdminLoginForm = () => {
  const [adminCode, setAdminCode] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (adminCode === 'CPE-SYNC-ADMIN-2025') {
      router.push('/admin/dashboard');
    } else {
      alert('Invalid admin code.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Admin Login</h2>
      <input
        type="password"
        placeholder="Admin Code"
        value={adminCode}
        onChange={(e) => setAdminCode(e.target.value)}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
};

export default AdminLoginForm;

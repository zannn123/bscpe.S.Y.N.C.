import { useEffect, useState } from 'react';
import { Users, Models } from 'appwrite';
import client from '../services/appwrite';
import { logAdminAction } from '../services/log';

const UserList = () => {
  const [users, setUsers] = useState<Models.User[]>([]);

  useEffect(() => {
    const usersApi = new Users(client);

    const fetchUsers = async () => {
      try {
        const response = await usersApi.list();
        setUsers(response.users);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUsers();

    const unsubscribe = client.subscribe('users', (response) => {
      if (response.events.includes('users.*.create')) {
        setUsers((prevUsers) => [response.payload, ...prevUsers]);
      }
      if (response.events.includes('users.*.update')) {
        setUsers((prevUsers) =>
          prevUsers.map((user) => (user.$id === response.payload.$id ? response.payload : user))
        );
      }
      if (response.events.includes('users.*.delete')) {
        setUsers((prevUsers) => prevUsers.filter((user) => user.$id !== response.payload.$id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const usersApi = new Users(client);
      try {
        await usersApi.delete(userId);
        await logAdminAction('delete_user', { userId });
        alert('User deleted successfully!');
      } catch (error) {
        console.error(error);
        alert('Failed to delete user.');
      }
    }
  };

  return (
    <div>
      <h2>Registered Students</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>ID Number</th>
            <th>Registration Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.$id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{new Date(user.$createdAt).toLocaleString()}</td>
              <td>
                <button onClick={() => handleDeleteUser(user.$id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;

import { Databases, ID } from 'appwrite';
import client from './appwrite';

const databases = new Databases(client);

export const logAdminAction = async (action: string, details: object) => {
  try {
    await databases.createDocument(
      'YOUR_DATABASE_ID',
      'YOUR_LOGS_COLLECTION_ID',
      ID.unique(),
      {
        action,
        details: JSON.stringify(details),
        timestamp: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};

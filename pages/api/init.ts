import { NextApiRequest, NextApiResponse } from 'next';
import { initializeDatabase } from '../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await initializeDatabase();
    res.status(200).json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initialize database' 
    });
  }
}
import { Pool } from 'pg';

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default pool;

// Função para inicializar as tabelas
export async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    // Criar tabela de usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'nurse',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Criar tabela de pacientes
    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        sector TEXT NOT NULL,
        bed INTEGER NOT NULL,
        weight FLOAT NOT NULL,
        rate FLOAT NOT NULL,
        round_rate BOOLEAN DEFAULT true,
        hgt_history JSONB DEFAULT '[]'::jsonb,
        start_time TIMESTAMP DEFAULT NOW(),
        status TEXT DEFAULT 'active',
        created_by INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Inserir usuário padrão se não existir
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await client.query(`
      INSERT INTO users (username, password, role) 
      VALUES ('admin', $1, 'admin') 
      ON CONFLICT (username) DO NOTHING
    `, [hashedPassword]);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}
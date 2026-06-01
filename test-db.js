const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10
});

async function test() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected!');

    // List all tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', tables.rows);

    // Check interview_sessions table
    if (tables.rows.some(t => t.table_name === 'interview_sessions')) {
      const sessions = await client.query('SELECT * FROM interview_sessions');
      console.log('Sessions in DB:', sessions.rows.length);
      sessions.rows.forEach(s => {
        console.log('  -', s.id, 'user:', s.user_id, 'role:', s.role, 'score:', s.score);
      });
    } else {
      console.log('interview_sessions table does not exist');
    }

    client.release();
    await pool.end();
    console.log('Done');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

test();

const { Pool } = require('pg');

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test table exists
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'token_usage_logs'
    `);
    
    if (tableResult.rows.length > 0) {
      console.log('✅ token_usage_logs table exists');
    } else {
      console.log('❌ token_usage_logs table not found');
      client.release();
      await pool.end();
      return;
    }
    
    // Test insert
    const testEmail = 'test@example.com';
    const testModel = 'gpt-4';
    const testInputTokens = 100;
    const testOutputTokens = 50;
    
    const insertResult = await client.query(
      'INSERT INTO token_usage_logs (user_email, model_name, input_tokens, output_tokens, request_type) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [testEmail, testModel, testInputTokens, testOutputTokens, 'chat']
    );
    
    console.log('✅ Test token usage logged with ID:', insertResult.rows[0].id);
    
    // Clean up test data
    await client.query('DELETE FROM token_usage_logs WHERE id = $1', [insertResult.rows[0].id]);
    console.log('✅ Test data cleaned up');
    
    client.release();
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabaseConnection(); 
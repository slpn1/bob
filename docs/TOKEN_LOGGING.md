# Token Usage Logging

This feature automatically logs token usage for all chat completions and image generations to a PostgreSQL database.

## Setup

### 1. Database Setup (Heroku Postgres)

Add the Heroku Postgres addon:
```bash
heroku addons:create heroku-postgresql:hobby-dev --app sg-lumina-ai
```

### 2. Environment Variables

Set the following environment variables:
```bash
heroku config:set TOKEN_LOGGING_ENABLED=true --app sg-lumina-ai
heroku config:set TOKEN_LOG_BATCH_SIZE=10 --app sg-lumina-ai
```

The `DATABASE_URL` is automatically set by Heroku Postgres.

### 3. Create Database Table

Run the SQL commands in `sql/simple_token_table.sql` to create the required table:

```sql
CREATE TABLE token_usage_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_email VARCHAR(255) NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  request_type VARCHAR(20) NOT NULL,
  session_id VARCHAR(50),
  cost_estimate DECIMAL(10,6)
);

CREATE INDEX idx_user_timestamp ON token_usage_logs (user_email, timestamp);
CREATE INDEX idx_model_timestamp ON token_usage_logs (model_name, timestamp);
```

### 4. Test the Setup

Run the test script to verify everything is working:
```bash
node scripts/test-token-logging.js
```

## How It Works

### Chat Completions
- Automatically logs when users send messages to AI models
- Records actual token counts from the API response
- Includes input tokens, output tokens, model name, and user email

### Image Generation
- Logs image generation requests (DALL-E, etc.)
- Uses fixed values: 1 input token, 1 output token
- Records model name and user email

### Architecture

1. **Database Layer**: PostgreSQL connection pool managed by `src/server/database/connection.ts`
2. **Logging Service**: Async batching service in `src/server/services/tokenUsageLogger.ts`
3. **Integration Points**: 
   - OpenAI parser: `src/modules/aix/server/dispatch/chatGenerate/parsers/openai.parser.ts`
   - TRPC context: User email extracted from session in `src/modules/aix/server/api/aix.router.ts`

### Performance Features

- **Async Processing**: Token logging doesn't block API responses
- **Batching**: Logs are batched and inserted every 5 seconds or when batch size (10) is reached
- **Error Handling**: Logging failures don't affect the main application
- **Connection Pooling**: Efficient database connection management

## Database Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `timestamp` | TIMESTAMPTZ | When the request was made (auto-set) |
| `user_email` | VARCHAR(255) | User's email address |
| `model_name` | VARCHAR(100) | AI model used (e.g., "gpt-4", "DALL-E-3") |
| `input_tokens` | INTEGER | Number of input tokens |
| `output_tokens` | INTEGER | Number of output tokens |
| `request_type` | VARCHAR(20) | "chat" or "image" |
| `session_id` | VARCHAR(50) | Optional conversation identifier |
| `cost_estimate` | DECIMAL(10,6) | Optional estimated cost in USD |

## Querying Usage Data

### Daily usage per user:
```sql
SELECT 
  user_email,
  DATE(timestamp) as date,
  SUM(input_tokens) as total_input,
  SUM(output_tokens) as total_output,
  COUNT(*) as requests
FROM token_usage_logs 
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY user_email, DATE(timestamp)
ORDER BY date DESC, total_input + total_output DESC;
```

### Most used models:
```sql
SELECT 
  model_name,
  COUNT(*) as requests,
  SUM(input_tokens + output_tokens) as total_tokens
FROM token_usage_logs 
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY model_name
ORDER BY total_tokens DESC;
```

### User activity summary:
```sql
SELECT 
  user_email,
  COUNT(*) as total_requests,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  MIN(timestamp) as first_request,
  MAX(timestamp) as last_request
FROM token_usage_logs 
GROUP BY user_email
ORDER BY total_input_tokens + total_output_tokens DESC;
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TOKEN_LOGGING_ENABLED` | `false` | Enable/disable token logging |
| `TOKEN_LOG_BATCH_SIZE` | `10` | Number of logs to batch before database insert |
| `DATABASE_URL` | - | PostgreSQL connection string (set by Heroku) |

### Disable Logging

To temporarily disable logging without removing the code:
```bash
heroku config:set TOKEN_LOGGING_ENABLED=false --app sg-lumina-ai
```

## Privacy & Compliance

- **No Message Content**: Only metadata is logged (tokens, model, email)
- **User Identification**: Uses email addresses from authenticated sessions
- **Data Retention**: Consider implementing automatic cleanup for old logs
- **GDPR Compliance**: Ensure proper data handling according to your privacy policy 
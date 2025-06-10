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
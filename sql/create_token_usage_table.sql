-- Token Usage Logging Table
-- This table tracks token usage for each user request across different models

CREATE TABLE token_usage_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_email VARCHAR(255) NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('chat', 'image')),
  session_id VARCHAR(50),
  cost_estimate DECIMAL(10,6)
);

-- Create indexes for common query patterns
CREATE INDEX idx_user_timestamp ON token_usage_logs (user_email, timestamp);
CREATE INDEX idx_model_timestamp ON token_usage_logs (model_name, timestamp);
CREATE INDEX idx_request_type ON token_usage_logs (request_type);
CREATE INDEX idx_timestamp ON token_usage_logs (timestamp DESC);

-- Add a comment to the table
COMMENT ON TABLE token_usage_logs IS 'Tracks token usage for all user requests including chat completions and image generation';
COMMENT ON COLUMN token_usage_logs.request_type IS 'Type of request: chat for LLM completions, image for DALL-E etc';
COMMENT ON COLUMN token_usage_logs.cost_estimate IS 'Estimated cost in USD for this request';
COMMENT ON COLUMN token_usage_logs.session_id IS 'Optional session/conversation identifier'; 
-- Create questions table to store user questions
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index on created_at for faster querying by date
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at); 
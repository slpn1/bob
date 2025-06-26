import { getDbPool } from '../database/connection';

export interface QuestionLog {
  question: string;
}

class QuestionLogger {
  private queue: QuestionLog[] = [];
  private batchSize: number;
  private flushInterval: number;
  private isEnabled: boolean;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.batchSize = parseInt(process.env.QUESTION_LOG_BATCH_SIZE || '10');
    this.flushInterval = 5000; // 5 seconds
    this.isEnabled = process.env.QUESTION_LOGGING_ENABLED !== 'false'; // Default to enabled
    
    if (this.isEnabled) {
      this.startFlushTimer();
    }
  }

  public async logQuestion(question: string): Promise<void> {
    if (!this.isEnabled || !question?.trim()) {
      return;
    }

    try {
      // Add to queue
      this.queue.push({
        question: question.trim(),
      });

      // Flush if batch size reached
      if (this.queue.length >= this.batchSize) {
        await this.flush();
      }
    } catch (error) {
      console.error('Error adding question log to queue:', error);
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    const batch = this.queue.splice(0, this.batchSize);
    
    try {
      await this.insertBatch(batch);
    } catch (error) {
      console.error('Error flushing question logs:', error);
      // Re-add failed logs to the front of the queue for retry
      this.queue.unshift(...batch);
    }
  }

  private async insertBatch(logs: QuestionLog[]): Promise<void> {
    if (logs.length === 0) return;

    const pool = getDbPool();
    const client = await pool.connect();

    try {
      // Build bulk insert query
      const values: string[] = [];
      const placeholders: string[] = [];
      
      logs.forEach((log, index) => {
        placeholders.push(`($${index + 1})`);
        values.push(log.question);
      });

      const query = `
        INSERT INTO questions (question)
        VALUES ${placeholders.join(', ')}
      `;

      await client.query(query, values);
      console.log(`Successfully logged ${logs.length} question records`);
    } finally {
      client.release();
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(async () => {
      await this.flush();
    }, this.flushInterval);
  }

  public async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Flush remaining logs
    await this.flush();
  }
}

// Singleton instance
const questionLogger = new QuestionLogger();

export { questionLogger };

// Convenience function for logging
export async function logQuestion(question: string): Promise<void> {
  await questionLogger.logQuestion(question);
} 
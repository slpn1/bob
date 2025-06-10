import { getDbPool } from '../database/connection';

export interface TokenUsageLog {
  userEmail: string;
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  requestType: 'chat' | 'image';
  sessionId?: string;
  costEstimate?: number;
}

class TokenUsageLogger {
  private queue: TokenUsageLog[] = [];
  private batchSize: number;
  private flushInterval: number;
  private isEnabled: boolean;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.batchSize = parseInt(process.env.TOKEN_LOG_BATCH_SIZE || '10');
    this.flushInterval = 5000; // 5 seconds
    this.isEnabled = process.env.TOKEN_LOGGING_ENABLED === 'true';
    
    if (this.isEnabled) {
      this.startFlushTimer();
    }
  }

  public async logTokenUsage(log: TokenUsageLog): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      // Add to queue
      this.queue.push({
        ...log,
        // Ensure reasonable limits
        inputTokens: Math.max(0, Math.floor(log.inputTokens)),
        outputTokens: Math.max(0, Math.floor(log.outputTokens)),
        costEstimate: log.costEstimate ? Math.round(log.costEstimate * 1000000) / 1000000 : undefined,
      });

      // Flush if batch size reached
      if (this.queue.length >= this.batchSize) {
        await this.flush();
      }
    } catch (error) {
      console.error('Error adding token usage log to queue:', error);
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
      console.error('Error flushing token usage logs:', error);
      // Re-add failed logs to the front of the queue for retry
      this.queue.unshift(...batch);
    }
  }

  private async insertBatch(logs: TokenUsageLog[]): Promise<void> {
    if (logs.length === 0) return;

    const pool = getDbPool();
    const client = await pool.connect();

    try {
      // Build bulk insert query
      const values: any[] = [];
      const placeholders: string[] = [];
      
      logs.forEach((log, index) => {
        const baseIndex = index * 7;
        placeholders.push(
          `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7})`
        );
        values.push(
          log.userEmail,
          log.modelName,
          log.inputTokens,
          log.outputTokens,
          log.requestType,
          log.sessionId || null,
          log.costEstimate || null
        );
      });

      const query = `
        INSERT INTO token_usage_logs 
        (user_email, model_name, input_tokens, output_tokens, request_type, session_id, cost_estimate)
        VALUES ${placeholders.join(', ')}
      `;

      await client.query(query, values);
      console.log(`Successfully logged ${logs.length} token usage records`);
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
const tokenUsageLogger = new TokenUsageLogger();

export { tokenUsageLogger };

// Convenience function for logging
export async function logTokenUsage(
  userEmail: string,
  modelName: string,
  inputTokens: number,
  outputTokens: number,
  requestType: 'chat' | 'image' = 'chat',
  sessionId?: string,
  costEstimate?: number
): Promise<void> {
  await tokenUsageLogger.logTokenUsage({
    userEmail,
    modelName,
    inputTokens,
    outputTokens,
    requestType,
    sessionId,
    costEstimate,
  });
} 
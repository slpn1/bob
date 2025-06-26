import { z } from 'zod';
import { TRPCError } from '@trpc/server';

import { createTRPCRouter, publicProcedure } from '~/server/trpc/trpc.server';
import { getDbPool } from '~/server/database/connection';

// Schema for token usage log data
const tokenUsageLogSchema = z.object({
  id: z.number(),
  timestamp: z.string(),
  user_email: z.string(),
  model_name: z.string(),
  input_tokens: z.number(),
  output_tokens: z.number(),
  request_type: z.string(),
  session_id: z.string().nullable(),
  cost_estimate: z.number().nullable(),
});

const rawTokenDataInputSchema = z.object({
  limit: z.number().min(1).max(1000).optional().default(100),
  offset: z.number().min(0).optional().default(0),
});

const userAnalyticsInputSchema = z.object({
  fromDate: z.string().nullable(),
  toDate: z.string().nullable(),
});

const tokenTrendsInputSchema = z.object({
  fromDate: z.string().nullable(),
  toDate: z.string().nullable(),
});

const modelAnalyticsInputSchema = z.object({
  fromDate: z.string().nullable(),
  toDate: z.string().nullable(),
});

export const reportsRouter = createTRPCRouter({

  /* Fetch raw token usage data from postgres */
  getRawTokenData: publicProcedure
    .input(rawTokenDataInputSchema)
    .query(async ({ input, ctx }) => {
      // Check if user is authenticated
      if (!ctx.user?.email) {
        throw new TRPCError({ 
          code: 'UNAUTHORIZED', 
          message: 'Authentication required' 
        });
      }

      try {
        const pool = getDbPool();
        const client = await pool.connect();
        
        // Query token usage logs with pagination
        const query = `
          SELECT 
            id,
            timestamp,
            user_email,
            model_name,
            input_tokens,
            output_tokens,
            request_type,
            session_id,
            cost_estimate
          FROM token_usage_logs 
          ORDER BY timestamp DESC 
          LIMIT $1 OFFSET $2
        `;
        
        const result = await client.query(query, [input.limit, input.offset]);
        
        // Also get total count for pagination
        const countQuery = 'SELECT COUNT(*) as total FROM token_usage_logs';
        const countResult = await client.query(countQuery);
        
        client.release();
        
        return {
          data: result.rows.map(row => ({
            id: row.id,
            timestamp: row.timestamp.toISOString(),
            user_email: row.user_email,
            model_name: row.model_name,
            input_tokens: row.input_tokens,
            output_tokens: row.output_tokens,
            request_type: row.request_type,
            session_id: row.session_id,
            cost_estimate: row.cost_estimate ? parseFloat(row.cost_estimate) : null,
          })),
          pagination: {
            total: parseInt(countResult.rows[0].total),
            limit: input.limit,
            offset: input.offset,
            hasMore: (input.offset + input.limit) < parseInt(countResult.rows[0].total),
          }
        };
        
      } catch (error) {
        console.error('Error fetching token usage data:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to fetch token usage data' 
        });
      }
    }),

  /* Get user analytics for dashboard */
  getUserAnalytics: publicProcedure
    .input(userAnalyticsInputSchema)
    .query(async ({ input, ctx }) => {
      // Check if user is authenticated
      if (!ctx.user?.email) {
        throw new TRPCError({ 
          code: 'UNAUTHORIZED', 
          message: 'Authentication required' 
        });
      }

      try {
        const pool = getDbPool();
        const client = await pool.connect();
        
        // Build WHERE clause for date filtering
        let whereClause = '';
        const queryParams: any[] = [];
        
        if (input.fromDate && input.toDate) {
          whereClause = 'WHERE DATE(timestamp) >= $1 AND DATE(timestamp) <= $2';
          queryParams.push(input.fromDate, input.toDate);
        } else if (input.fromDate) {
          whereClause = 'WHERE DATE(timestamp) >= $1';
          queryParams.push(input.fromDate);
        } else if (input.toDate) {
          whereClause = 'WHERE DATE(timestamp) <= $1';
          queryParams.push(input.toDate);
        }
        
        // Get total unique users count and list of all unique users
        const uniqueUsersQuery = `
          SELECT COUNT(DISTINCT user_email) as total_unique_users
          FROM token_usage_logs 
          ${whereClause}
        `;
        
        const uniqueUsersResult = await client.query(uniqueUsersQuery, queryParams);
        
        // Get list of all unique users in alphabetical order
        const allUsersQuery = `
          SELECT DISTINCT user_email
          FROM token_usage_logs 
          ${whereClause}
          ORDER BY user_email ASC
        `;
        
        const allUsersResult = await client.query(allUsersQuery, queryParams);
        
        // Get top 10 users by query count (number of rows, not tokens)
        const topUsersQuery = `
          SELECT 
            user_email,
            COUNT(*) as query_count
          FROM token_usage_logs 
          ${whereClause}
          GROUP BY user_email 
          ORDER BY query_count DESC 
          LIMIT 10
        `;
        
        const topUsersResult = await client.query(topUsersQuery, queryParams);
        
        client.release();
        
        return {
          totalUniqueUsers: parseInt(uniqueUsersResult.rows[0].total_unique_users),
          allUniqueUsers: allUsersResult.rows.map(row => row.user_email),
          topUsers: topUsersResult.rows.map(row => ({
            userEmail: row.user_email,
            queryCount: parseInt(row.query_count),
          }))
        };
        
      } catch (error) {
        console.error('Error fetching user analytics:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to fetch user analytics' 
        });
      }
    }),

  /* Get token usage trends over time for charts */
  getTokenTrends: publicProcedure
    .input(tokenTrendsInputSchema)
    .query(async ({ input, ctx }) => {
      // Check if user is authenticated
      if (!ctx.user?.email) {
        throw new TRPCError({ 
          code: 'UNAUTHORIZED', 
          message: 'Authentication required' 
        });
      }

      try {
        const pool = getDbPool();
        const client = await pool.connect();
        
        // Build WHERE clause for date filtering
        let whereClause = '';
        const queryParams: any[] = [];
        
        if (input.fromDate && input.toDate) {
          whereClause = 'WHERE DATE(timestamp) >= $1 AND DATE(timestamp) <= $2';
          queryParams.push(input.fromDate, input.toDate);
        } else if (input.fromDate) {
          whereClause = 'WHERE DATE(timestamp) >= $1';
          queryParams.push(input.fromDate);
        } else if (input.toDate) {
          whereClause = 'WHERE DATE(timestamp) <= $1';
          queryParams.push(input.toDate);
        }
        
        // Get token usage aggregated by day
        const trendsQuery = `
          SELECT 
            DATE(timestamp) as date,
            SUM(input_tokens) as total_input_tokens,
            SUM(output_tokens) as total_output_tokens,
            SUM(input_tokens + output_tokens) as total_tokens
          FROM token_usage_logs 
          ${whereClause}
          GROUP BY DATE(timestamp)
          ORDER BY DATE(timestamp) ASC
        `;
        
        const trendsResult = await client.query(trendsQuery, queryParams);
        
        client.release();
        
        return {
          trends: trendsResult.rows.map(row => ({
            date: row.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
            inputTokens: parseInt(row.total_input_tokens),
            outputTokens: parseInt(row.total_output_tokens),
            totalTokens: parseInt(row.total_tokens),
          }))
        };
        
      } catch (error) {
        console.error('Error fetching token trends:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to fetch token trends' 
        });
      }
    }),

  /* Get model usage analytics */
  getModelAnalytics: publicProcedure
    .input(modelAnalyticsInputSchema)
    .query(async ({ input, ctx }) => {
      // Check if user is authenticated
      if (!ctx.user?.email) {
        throw new TRPCError({ 
          code: 'UNAUTHORIZED', 
          message: 'Authentication required' 
        });
      }

      try {
        const pool = getDbPool();
        const client = await pool.connect();
        
        // Build WHERE clause for date filtering
        let whereClause = '';
        const queryParams: any[] = [];
        
        if (input.fromDate && input.toDate) {
          whereClause = 'WHERE DATE(timestamp) >= $1 AND DATE(timestamp) <= $2';
          queryParams.push(input.fromDate, input.toDate);
        } else if (input.fromDate) {
          whereClause = 'WHERE DATE(timestamp) >= $1';
          queryParams.push(input.fromDate);
        } else if (input.toDate) {
          whereClause = 'WHERE DATE(timestamp) <= $1';
          queryParams.push(input.toDate);
        }
        
        // Get model usage statistics
        const modelUsageQuery = `
          SELECT 
            model_name,
            SUM(input_tokens + output_tokens) as total_tokens,
            SUM(input_tokens) as total_input_tokens,
            SUM(output_tokens) as total_output_tokens,
            COUNT(*) as query_count
          FROM token_usage_logs 
          ${whereClause}
          GROUP BY model_name 
          ORDER BY total_tokens DESC
        `;
        
        const modelUsageResult = await client.query(modelUsageQuery, queryParams);
        
        client.release();
        
        return {
          models: modelUsageResult.rows.map(row => ({
            modelName: row.model_name,
            totalTokens: parseInt(row.total_tokens),
            inputTokens: parseInt(row.total_input_tokens),
            outputTokens: parseInt(row.total_output_tokens),
            queryCount: parseInt(row.query_count),
          }))
        };
        
      } catch (error) {
        console.error('Error fetching model analytics:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to fetch model analytics' 
        });
      }
    }),

}); 
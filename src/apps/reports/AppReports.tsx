import * as React from 'react';

import { Alert, Box, Button, Card, List, ListItem, ListItemButton, Sheet, Table, Typography, IconButton, Input, FormControl, FormLabel, ButtonGroup, Divider, Avatar, Tooltip } from '@mui/joy';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DataObjectIcon from '@mui/icons-material/DataObject';
import DashboardIcon from '@mui/icons-material/Dashboard';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import MemoryIcon from '@mui/icons-material/Memory';

import { apiAsyncNode } from '~/common/util/trpc.client';
import { OptimaDrawerIn } from '~/common/layout/optima/portals/OptimaPortalsIn';
import { OptimaDrawerHeader } from '~/common/layout/optima/drawer/OptimaDrawerHeader';
import { OptimaDrawerList } from '~/common/layout/optima/drawer/OptimaDrawerList';
import { useIsAdmin } from '~/common/util/auth-utils';

// Report sections
type ReportSection = 'dashboard' | 'raw-data';

// Date range types
type DateRangePeriod = 'all-time' | 'last-24h' | 'last-week' | 'last-month' | 'custom';

interface DateRange {
  from: string | null;
  to: string | null;
  period: DateRangePeriod;
}

interface UserAnalytics {
  totalUniqueUsers: number;
  allUniqueUsers: string[];
  topUsers: {
    userEmail: string;
    queryCount: number;
  }[];
}

interface TokenTrends {
  trends: {
    date: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  }[];
}

interface ModelAnalytics {
  models: {
    modelName: string;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    queryCount: number;
  }[];
}

type SortField = 'id' | 'timestamp' | 'user_email' | 'model_name' | 'input_tokens' | 'output_tokens';
type SortDirection = 'asc' | 'desc';

interface TokenUsageLog {
  id: number;
  timestamp: string;
  user_email: string;
  model_name: string;
  input_tokens: number;
  output_tokens: number;
  request_type: string;
  session_id: string | null;
  cost_estimate: number | null;
}

interface TokenDataResponse {
  data: TokenUsageLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

function SortableTableHeader({ 
  field, 
  label, 
  currentSortField, 
  currentSortDirection, 
  onSort 
}: { 
  field: SortField; 
  label: string; 
  currentSortField: SortField; 
  currentSortDirection: SortDirection; 
  onSort: (field: SortField) => void; 
}) {
  const isActive = currentSortField === field;
  
  return (
    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => onSort(field)}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {label}
        {isActive && (
          currentSortDirection === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 'sm' }} /> : <ArrowDownwardIcon sx={{ fontSize: 'sm' }} />
        )}
      </Box>
    </th>
  );
}

function ReportsDrawerContent({ activeSection, onSectionChange }: { 
  activeSection: ReportSection; 
  onSectionChange: (section: ReportSection) => void; 
}) {
  return (
    <>
      <OptimaDrawerHeader title='Reports' />
      
      <OptimaDrawerList variant='plain' noTopPadding>
        <Box sx={{ p: 2, pt: 1, mt: 5 }}>
          <ListItem>
            <ListItemButton
              selected={activeSection === 'dashboard'}
              onClick={() => onSectionChange('dashboard')}
              sx={{
                borderRadius: 'sm',
                '&.Mui-selected': {
                  backgroundColor: 'primary.softBg',
                  color: 'primary.softColor',
                },
                '&:hover': {
                  backgroundColor: 'neutral.softHoverBg',
                },
              }}
            >
              <DashboardIcon sx={{ mr: 1.5 }} />
              Dashboard
            </ListItemButton>
          </ListItem>
          
          <ListItem>
            <ListItemButton
              selected={activeSection === 'raw-data'}
              onClick={() => onSectionChange('raw-data')}
              sx={{
                borderRadius: 'sm',
                '&.Mui-selected': {
                  backgroundColor: 'primary.softBg',
                  color: 'primary.softColor',
                },
                '&:hover': {
                  backgroundColor: 'neutral.softHoverBg',
                },
              }}
            >
              <DataObjectIcon sx={{ mr: 1.5, }} />
              Raw Data
            </ListItemButton>
          </ListItem>
        </Box>
      </OptimaDrawerList>
    </>
  );
}

// Users Panel Component
function UsersPanel({ 
  userAnalytics, 
  isLoading, 
  error 
}: { 
  userAnalytics: UserAnalytics | null;
  isLoading: boolean;
  error: string | null;
}) {
  if (error) {
    return (
      <Card variant='outlined' sx={{ height: 'fit-content' }}>
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PeopleIcon sx={{ fontSize: 'lg' }} />
            <Typography level='title-md'>Users</Typography>
          </Box>
          <Alert variant='soft' color='danger'>
            <Typography level='body-sm'>Error loading user data: {error}</Typography>
          </Alert>
        </Box>
      </Card>
    );
  }

  return (
    <Card variant='outlined' sx={{ height: 'fit-content' }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PeopleIcon sx={{ fontSize: 'lg' }} />
          <Typography level='title-md'>Users</Typography>
        </Box>
        
        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
              Loading user analytics...
            </Typography>
          </Box>
        ) : userAnalytics ? (
          <>
            {/* Total Unique Users */}
            <Box sx={{ mb: 3 }}>
              <Tooltip
                title={
                  <Box sx={{ maxHeight: 300, overflowY: 'auto', p: 1 }}>
                    <Typography level='body-sm' sx={{ fontWeight: 'bold', mb: 1 }}>
                      All Unique Users ({userAnalytics.totalUniqueUsers}):
                    </Typography>
                    {userAnalytics.allUniqueUsers.map((email, index) => (
                      <Typography 
                        key={email} 
                        level='body-xs' 
                        sx={{ 
                          display: 'block', 
                          py: 0.25,
                          wordBreak: 'break-all'
                        }}
                      >
                        {index + 1}. {email}
                      </Typography>
                    ))}
                  </Box>
                }
                placement="right"
                variant="outlined"
                sx={{ cursor: 'help' }}
              >
                <Box sx={{ display: 'inline-block', cursor: 'help' }}>
                  <Typography level='h2' sx={{ color: 'primary.500', fontWeight: 'bold' }}>
                    {userAnalytics.totalUniqueUsers.toLocaleString()}
                  </Typography>
                  <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
                    Total unique users
                  </Typography>
                </Box>
              </Tooltip>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Top 10 Users */}
            <Box>
              <Typography level='title-sm' sx={{ mb: 2 }}>
                Top 10 Users by Query Count
              </Typography>
              
              {userAnalytics.topUsers.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {userAnalytics.topUsers.map((user, index) => (
                    <Box 
                      key={user.userEmail}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        p: 1.5,
                        backgroundColor: 'background.level1',
                        borderRadius: 'sm'
                      }}
                    >
                      <Box sx={{ 
                        minWidth: 24, 
                        textAlign: 'center',
                        color: 'text.tertiary',
                        fontWeight: 'normal'
                      }}>
                        #{index + 1}
                      </Box>
                      
                      <Avatar size='sm' sx={{ flexShrink: 0 }}>
                        <PersonIcon />
                      </Avatar>
                      
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          level='body-sm' 
                          sx={{ 
                            fontWeight: 'normal',
                            color: 'text.primary',
                            wordBreak: 'break-all'
                          }}
                        >
                          {user.userEmail}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography 
                          level='title-sm' 
                          sx={{ 
                            fontWeight: 'bold',
                            color: 'text.primary'
                          }}
                        >
                          {user.queryCount.toLocaleString()}
                        </Typography>
                        <Typography level='body-xs' sx={{ color: 'text.tertiary' }}>
                          queries
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Alert variant='soft' color='neutral'>
                  <Typography level='body-sm'>
                    No user data available for the selected date range.
                  </Typography>
                </Alert>
              )}
            </Box>
          </>
        ) : null}
      </Box>
    </Card>
  );
}

// Token Trends Chart Component
function TokenTrendsChart({ 
  tokenTrends, 
  isLoading, 
  error 
}: { 
  tokenTrends: TokenTrends | null;
  isLoading: boolean;
  error: string | null;
}) {
  if (error) {
    return (
      <Card variant='outlined' sx={{ height: 'fit-content' }}>
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ShowChartIcon sx={{ fontSize: 'lg' }} />
            <Typography level='title-md'>Token Usage Trends</Typography>
          </Box>
          <Alert variant='soft' color='danger'>
            <Typography level='body-sm'>Error loading chart data: {error}</Typography>
          </Alert>
        </Box>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card variant='outlined' sx={{ height: 'fit-content' }}>
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ShowChartIcon sx={{ fontSize: 'lg' }} />
            <Typography level='title-md'>Token Usage Trends</Typography>
          </Box>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
              Loading chart data...
            </Typography>
          </Box>
        </Box>
      </Card>
    );
  }

  if (!tokenTrends || tokenTrends.trends.length === 0) {
    return (
      <Card variant='outlined' sx={{ height: 'fit-content' }}>
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ShowChartIcon sx={{ fontSize: 'lg' }} />
            <Typography level='title-md'>Token Usage Trends</Typography>
          </Box>
          <Alert variant='soft' color='neutral'>
            <Typography level='body-sm'>
              No data available for the selected date range.
            </Typography>
          </Alert>
        </Box>
      </Card>
    );
  }

  // Prepare chart data
  const data = tokenTrends.trends;
  const maxValue = Math.max(...data.map(d => Math.max(d.inputTokens, d.outputTokens, d.totalTokens)));
  const chartWidth = 600;
  const chartHeight = 300;
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Create scales
  const xScale = (index: number) => (index / (data.length - 1)) * plotWidth;
  const yScale = (value: number) => plotHeight - (value / maxValue) * plotHeight;

  // Generate path for lines
  const createPath = (values: number[]) => {
    return values.map((value, index) => {
      const x = xScale(index);
      const y = yScale(value);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');
  };

  const inputPath = createPath(data.map(d => d.inputTokens));
  const outputPath = createPath(data.map(d => d.outputTokens));
  const totalPath = createPath(data.map(d => d.totalTokens));

  return (
    <Card variant='outlined' sx={{ height: 'fit-content' }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ShowChartIcon sx={{ fontSize: 'lg' }} />
          <Typography level='title-md'>Token Usage Trends</Typography>
        </Box>

        {/* Chart Legend */}
        <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 2, backgroundColor: '#3b82f6', borderRadius: 1 }} />
            <Typography level='body-sm'>Input Tokens</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 2, backgroundColor: '#ef4444', borderRadius: 1 }} />
            <Typography level='body-sm'>Output Tokens</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 2, backgroundColor: '#10b981', borderRadius: 1 }} />
            <Typography level='body-sm'>Total Tokens</Typography>
          </Box>
        </Box>

        {/* SVG Chart */}
        <Box sx={{ overflowX: 'auto' }}>
          <svg width={chartWidth} height={chartHeight} style={{ background: 'transparent' }}>
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" strokeWidth="1" opacity="0.3"/>
              </pattern>
            </defs>
            <rect 
              x={padding.left} 
              y={padding.top} 
              width={plotWidth} 
              height={plotHeight} 
              fill="url(#grid)" 
            />

            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const y = padding.top + plotHeight - (ratio * plotHeight);
              const value = Math.round(maxValue * ratio);
              return (
                <g key={ratio}>
                  <line 
                    x1={padding.left - 5} 
                    y1={y} 
                    x2={padding.left} 
                    y2={y} 
                    stroke="#64748b" 
                    strokeWidth="1"
                  />
                  <text 
                    x={padding.left - 10} 
                    y={y + 4} 
                    textAnchor="end" 
                    fontSize="12" 
                    fill="#64748b"
                  >
                    {value.toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* X-axis labels */}
            {data.map((d, index) => {
              if (data.length > 10 && index % Math.ceil(data.length / 6) !== 0) return null;
              const x = padding.left + xScale(index);
              return (
                <g key={index}>
                  <line 
                    x1={x} 
                    y1={padding.top + plotHeight} 
                    x2={x} 
                    y2={padding.top + plotHeight + 5} 
                    stroke="#64748b" 
                    strokeWidth="1"
                  />
                  <text 
                    x={x} 
                    y={padding.top + plotHeight + 20} 
                    textAnchor="middle" 
                    fontSize="10" 
                    fill="#64748b"
                  >
                    {new Date(d.date).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </text>
                </g>
              );
            })}

            {/* Chart lines */}
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Input tokens line */}
              <path 
                d={inputPath}
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              
              {/* Output tokens line */}
              <path 
                d={outputPath}
                fill="none" 
                stroke="#ef4444" 
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              
              {/* Total tokens line */}
              <path 
                d={totalPath}
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Data points */}
              {data.map((d, index) => {
                const x = xScale(index);
                return (
                  <g key={index}>
                    <circle cx={x} cy={yScale(d.inputTokens)} r="3" fill="#3b82f6" />
                    <circle cx={x} cy={yScale(d.outputTokens)} r="3" fill="#ef4444" />
                    <circle cx={x} cy={yScale(d.totalTokens)} r="3" fill="#10b981" />
                  </g>
                );
              })}
            </g>
          </svg>
        </Box>

        {/* Summary stats */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                Avg Daily Input
              </Typography>
              <Typography level='title-sm' sx={{ color: '#3b82f6' }}>
                {Math.round(data.reduce((sum, d) => sum + d.inputTokens, 0) / data.length).toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                Avg Daily Output
              </Typography>
              <Typography level='title-sm' sx={{ color: '#ef4444' }}>
                {Math.round(data.reduce((sum, d) => sum + d.outputTokens, 0) / data.length).toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                Avg Daily Total
              </Typography>
              <Typography level='title-sm' sx={{ color: '#10b981' }}>
                {Math.round(data.reduce((sum, d) => sum + d.totalTokens, 0) / data.length).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

// Model Usage Panel Component
function ModelUsagePanel({ 
  modelAnalytics, 
  isLoading, 
  error 
}: { 
  modelAnalytics: ModelAnalytics | null;
  isLoading: boolean;
  error: string | null;
}) {
  if (error) {
    return (
      <Card variant='outlined' sx={{ height: 'fit-content' }}>
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <MemoryIcon sx={{ fontSize: 'lg' }} />
            <Typography level='title-md'>Model Usage</Typography>
          </Box>
          <Alert variant='soft' color='danger'>
            <Typography level='body-sm'>Error loading model data: {error}</Typography>
          </Alert>
        </Box>
      </Card>
    );
  }

  return (
    <Card variant='outlined' sx={{ height: 'fit-content' }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <MemoryIcon sx={{ fontSize: 'lg' }} />
          <Typography level='title-md'>Model Usage</Typography>
        </Box>
        
        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
              Loading model analytics...
            </Typography>
          </Box>
        ) : modelAnalytics?.models && modelAnalytics.models.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {modelAnalytics.models.map((model, index) => (
              <Box
                key={model.modelName}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.5,
                  borderRadius: 'sm',
                  backgroundColor: 'background.level1',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <Typography level='body-sm' sx={{ fontWeight: 'md' }}>
                    {model.modelName}
                  </Typography>
                  <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                    {model.queryCount.toLocaleString()} queries
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography level='body-sm' sx={{ fontWeight: 'md' }}>
                    {model.totalTokens.toLocaleString()}
                  </Typography>
                  <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                    tokens
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
              No model usage data available for the selected period.
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
}

// Date Range Selector Component
function DateRangeSelector({ 
  dateRange, 
  onPeriodChange, 
  onCustomDateChange 
}: { 
  dateRange: DateRange; 
  onPeriodChange: (period: DateRangePeriod) => void;
  onCustomDateChange: (field: 'from' | 'to', value: string) => void;
}) {
  return (
    <Card variant='outlined' sx={{ mb: 3 }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CalendarTodayIcon sx={{ fontSize: 'lg' }} />
          <Typography level='title-md'>Date Range</Typography>
        </Box>
        
        {/* Predefined Period Buttons */}
        <Box sx={{ mb: 2 }}>
          <Typography level='body-sm' sx={{ mb: 1, color: 'text.secondary' }}>
            Quick Selection:
          </Typography>
          <ButtonGroup variant='outlined' spacing={1}>
            <Button
              variant={dateRange.period === 'all-time' ? 'solid' : 'outlined'}
              onClick={() => onPeriodChange('all-time')}
              size='sm'
            >
              All time
            </Button>
            <Button
              variant={dateRange.period === 'last-24h' ? 'solid' : 'outlined'}
              onClick={() => onPeriodChange('last-24h')}
              size='sm'
            >
              Last 24 hours
            </Button>
            <Button
              variant={dateRange.period === 'last-week' ? 'solid' : 'outlined'}
              onClick={() => onPeriodChange('last-week')}
              size='sm'
            >
              Last week
            </Button>
            <Button
              variant={dateRange.period === 'last-month' ? 'solid' : 'outlined'}
              onClick={() => onPeriodChange('last-month')}
              size='sm'
            >
              Last month
            </Button>
          </ButtonGroup>
        </Box>

        {/* Custom Date Range Inputs */}
        <Box sx={{ display: 'flex', alignItems: 'end', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size='sm' sx={{ minWidth: 150 }}>
            <FormLabel>From Date</FormLabel>
            <Input
              type='date'
              value={dateRange.from || ''}
              onChange={(e) => onCustomDateChange('from', e.target.value)}
              placeholder='Start date'
            />
          </FormControl>
          
          <FormControl size='sm' sx={{ minWidth: 150 }}>
            <FormLabel>To Date</FormLabel>
            <Input
              type='date'
              value={dateRange.to || ''}
              onChange={(e) => onCustomDateChange('to', e.target.value)}
              placeholder='End date'
            />
          </FormControl>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
            <Typography level='body-sm'>
              Selected: {formatDateForDisplay(dateRange.period, dateRange.from, dateRange.to)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

// Helper functions for date range calculations
function getDateRangeFromPeriod(period: DateRangePeriod): { from: string | null; to: string | null } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'last-24h':
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return {
        from: twentyFourHoursAgo.toISOString().split('T')[0],
        to: now.toISOString().split('T')[0]
      };
    
    case 'last-week':
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      return {
        from: lastWeek.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0]
      };
    
    case 'last-month':
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return {
        from: lastMonth.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0]
      };
    
    case 'all-time':
    default:
      return { from: null, to: null };
  }
}

function formatDateForDisplay(period: DateRangePeriod, from: string | null, to: string | null): string {
  if (period === 'all-time') return 'All time';
  if (period === 'last-24h') return 'Last 24 hours';
  if (period === 'last-week') return 'Last week';
  if (period === 'last-month') return 'Last month';
  if (period === 'custom' && from && to) {
    return `${new Date(from).toLocaleDateString()} - ${new Date(to).toLocaleDateString()}`;
  }
  return 'Custom range';
}

export function AppReports() {
  // Check if user is admin
  const isAdmin = useIsAdmin();
  
  // Local state
  const [activeSection, setActiveSection] = React.useState<ReportSection>('dashboard');
  const [dateRange, setDateRange] = React.useState<DateRange>({
    from: null,
    to: null,
    period: 'all-time'
  });
  const [rawTokenData, setRawTokenData] = React.useState<TokenDataResponse | null>(null);
  const [isLoadingRawData, setIsLoadingRawData] = React.useState(false);
  const [rawDataError, setRawDataError] = React.useState<string | null>(null);
  const [userAnalytics, setUserAnalytics] = React.useState<UserAnalytics | null>(null);
  const [isLoadingUserAnalytics, setIsLoadingUserAnalytics] = React.useState(false);
  const [userAnalyticsError, setUserAnalyticsError] = React.useState<string | null>(null);
  const [tokenTrends, setTokenTrends] = React.useState<TokenTrends | null>(null);
  const [isLoadingTokenTrends, setIsLoadingTokenTrends] = React.useState(false);
  const [tokenTrendsError, setTokenTrendsError] = React.useState<string | null>(null);
  const [modelAnalytics, setModelAnalytics] = React.useState<ModelAnalytics | null>(null);
  const [isLoadingModelAnalytics, setIsLoadingModelAnalytics] = React.useState(false);
  const [modelAnalyticsError, setModelAnalyticsError] = React.useState<string | null>(null);
  const [sortField, setSortField] = React.useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = React.useState(0);
  const [itemsPerPage, setItemsPerPage] = React.useState(100);

  // Fetch raw token data
  const fetchRawData = React.useCallback(async (page?: number) => {
    if (!isAdmin) return;
    
    const targetPage = page !== undefined ? page : currentPage;
    
    setIsLoadingRawData(true);
    setRawDataError(null);
    
    try {
      const data = await apiAsyncNode.reports.getRawTokenData.query({
        limit: itemsPerPage,
        offset: targetPage * itemsPerPage
      });
      setRawTokenData(data);
      if (page !== undefined) {
        setCurrentPage(page);
      }
    } catch (error: any) {
      setRawDataError(error.message || 'Failed to fetch data');
    } finally {
      setIsLoadingRawData(false);
    }
  }, [isAdmin, currentPage, itemsPerPage]);

  // Fetch user analytics
  const fetchUserAnalytics = React.useCallback(async () => {
    if (!isAdmin) return;
    
    setIsLoadingUserAnalytics(true);
    setUserAnalyticsError(null);
    
    try {
      const data = await apiAsyncNode.reports.getUserAnalytics.query({
        fromDate: dateRange.from,
        toDate: dateRange.to
      });
      setUserAnalytics(data);
    } catch (error: any) {
      setUserAnalyticsError(error.message || 'Failed to fetch user analytics');
    } finally {
      setIsLoadingUserAnalytics(false);
    }
  }, [isAdmin, dateRange.from, dateRange.to]);

  // Fetch token trends
  const fetchTokenTrends = React.useCallback(async () => {
    if (!isAdmin) return;
    
    setIsLoadingTokenTrends(true);
    setTokenTrendsError(null);
    
    try {
      const data = await apiAsyncNode.reports.getTokenTrends.query({
        fromDate: dateRange.from,
        toDate: dateRange.to
      });
      setTokenTrends(data);
    } catch (error: any) {
      setTokenTrendsError(error.message || 'Failed to fetch token trends');
    } finally {
      setIsLoadingTokenTrends(false);
    }
  }, [isAdmin, dateRange.from, dateRange.to]);

  // Fetch model analytics
  const fetchModelAnalytics = React.useCallback(async () => {
    if (!isAdmin) return;
    
    setIsLoadingModelAnalytics(true);
    setModelAnalyticsError(null);
    
    try {
      const data = await apiAsyncNode.reports.getModelAnalytics.query({
        fromDate: dateRange.from,
        toDate: dateRange.to
      });
      setModelAnalytics(data);
    } catch (error: any) {
      setModelAnalyticsError(error.message || 'Failed to fetch model analytics');
    } finally {
      setIsLoadingModelAnalytics(false);
    }
  }, [isAdmin, dateRange.from, dateRange.to]);

  // Load data on mount
  React.useEffect(() => {
    fetchRawData();
  }, [fetchRawData]);

  // Load dashboard data when date range changes
  React.useEffect(() => {
    if (activeSection === 'dashboard') {
      fetchUserAnalytics();
      fetchTokenTrends();
      fetchModelAnalytics();
    }
  }, [activeSection, fetchUserAnalytics, fetchTokenTrends, fetchModelAnalytics]);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!rawTokenData?.data) return [];
    
    return [...rawTokenData.data].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      // Handle different data types
      if (sortField === 'timestamp') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [rawTokenData?.data, sortField, sortDirection]);

  // Handle column sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle date range changes
  const handlePeriodChange = (period: DateRangePeriod) => {
    const range = getDateRangeFromPeriod(period);
    setDateRange({
      from: range.from,
      to: range.to,
      period
    });
  };

  const handleCustomDateChange = (field: 'from' | 'to', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value,
      period: 'custom'
    }));
  };

  // If not admin, show access denied message
  if (!isAdmin) {
    return (
      <Box sx={{ p: 3, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert variant='soft' color='warning' startDecorator={<AssessmentIcon />}>
          <Box>
            <Typography level='title-sm'>Access Denied</Typography>
            <Typography level='body-sm'>
              You need administrator privileges to access the reports section.
              Please contact your system administrator if you believe you should have access.
            </Typography>
          </Box>
        </Alert>
      </Box>
    );
  }

  return (
    <>
      {/* Inject content into the existing drawer */}
      <OptimaDrawerIn>
        <ReportsDrawerContent activeSection={activeSection} onSectionChange={setActiveSection} />
      </OptimaDrawerIn>

      {/* Main content */}
      <Box sx={{ p: 3, height: '100vh', overflow: 'auto' }}>
        {activeSection === 'dashboard' ? (
          <Box>
            <Typography level='h4' sx={{ mb: 3 }}>Dashboard</Typography>
            
            {/* Date Range Selector */}
            <DateRangeSelector
              dateRange={dateRange}
              onPeriodChange={handlePeriodChange}
              onCustomDateChange={handleCustomDateChange}
            />
            
            {/* Dashboard Panels Layout */}
            <Box sx={{ display: 'flex', gap: 3, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
              {/* Left Column - Users Panel */}
              <Box sx={{ flex: { xs: 1, md: 0.5 } }}>
                <UsersPanel
                  userAnalytics={userAnalytics}
                  isLoading={isLoadingUserAnalytics}
                  error={userAnalyticsError}
                />
              </Box>
              
              {/* Right Column - Token Trends Chart and Model Usage Panel */}
              <Box sx={{ flex: { xs: 1, md: 0.5 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Token Trends Chart */}
                <TokenTrendsChart
                  tokenTrends={tokenTrends}
                  isLoading={isLoadingTokenTrends}
                  error={tokenTrendsError}
                />
                
                {/* Model Usage Panel */}
                <ModelUsagePanel
                  modelAnalytics={modelAnalytics}
                  isLoading={isLoadingModelAnalytics}
                  error={modelAnalyticsError}
                />
              </Box>
            </Box>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography level='h4'>Raw Token Usage Data</Typography>
              <Button
                variant='outlined'
                color='neutral'
                startDecorator={<RefreshIcon />}
                onClick={() => fetchRawData()}
                loading={isLoadingRawData}
              >
                Refresh
              </Button>
            </Box>

        {rawDataError && (
          <Alert variant='soft' color='danger' sx={{ mb: 2 }}>
            <Typography level='body-sm'>
              Error loading data: {rawDataError}
            </Typography>
          </Alert>
        )}

        {rawTokenData && (
          <Card variant='outlined'>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
                Showing {currentPage * itemsPerPage + 1}-{Math.min((currentPage + 1) * itemsPerPage, rawTokenData.pagination.total)} of {rawTokenData.pagination.total} total records
              </Typography>
            </Box>

            <Sheet sx={{ overflow: 'auto', maxHeight: '70vh' }}>
              <Table hoverRow stickyHeader>
                <thead>
                  <tr>
                    <SortableTableHeader 
                      field="id" 
                      label="ID" 
                      currentSortField={sortField} 
                      currentSortDirection={sortDirection} 
                      onSort={handleSort} 
                    />
                    <SortableTableHeader 
                      field="timestamp" 
                      label="Timestamp" 
                      currentSortField={sortField} 
                      currentSortDirection={sortDirection} 
                      onSort={handleSort} 
                    />
                    <SortableTableHeader 
                      field="user_email" 
                      label="User Email" 
                      currentSortField={sortField} 
                      currentSortDirection={sortDirection} 
                      onSort={handleSort} 
                    />
                    <SortableTableHeader 
                      field="model_name" 
                      label="Model" 
                      currentSortField={sortField} 
                      currentSortDirection={sortDirection} 
                      onSort={handleSort} 
                    />
                    <SortableTableHeader 
                      field="input_tokens" 
                      label="Input Tokens" 
                      currentSortField={sortField} 
                      currentSortDirection={sortDirection} 
                      onSort={handleSort} 
                    />
                    <SortableTableHeader 
                      field="output_tokens" 
                      label="Output Tokens" 
                      currentSortField={sortField} 
                      currentSortDirection={sortDirection} 
                      onSort={handleSort} 
                    />
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{new Date(row.timestamp).toLocaleString()}</td>
                      <td>{row.user_email}</td>
                      <td>{row.model_name}</td>
                      <td>{row.input_tokens.toLocaleString()}</td>
                      <td>{row.output_tokens.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Sheet>
            
            {/* Pagination Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography level='body-sm'>Items per page:</Typography>
                <Button
                  variant={itemsPerPage === 50 ? 'solid' : 'outlined'}
                  size='sm'
                  onClick={() => {
                    setItemsPerPage(50);
                    setCurrentPage(0);
                    fetchRawData(0);
                  }}
                >
                  50
                </Button>
                <Button
                  variant={itemsPerPage === 100 ? 'solid' : 'outlined'}
                  size='sm'
                  onClick={() => {
                    setItemsPerPage(100);
                    setCurrentPage(0);
                    fetchRawData(0);
                  }}
                >
                  100
                </Button>
                <Button
                  variant={itemsPerPage === 200 ? 'solid' : 'outlined'}
                  size='sm'
                  onClick={() => {
                    setItemsPerPage(200);
                    setCurrentPage(0);
                    fetchRawData(0);
                  }}
                >
                  200
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  variant='outlined'
                  size='sm'
                  disabled={currentPage === 0}
                  onClick={() => fetchRawData(0)}
                >
                  <FirstPageIcon />
                </IconButton>
                <IconButton
                  variant='outlined'
                  size='sm'
                  disabled={currentPage === 0}
                  onClick={() => fetchRawData(currentPage - 1)}
                >
                  <NavigateBeforeIcon />
                </IconButton>
                
                <Typography level='body-sm' sx={{ mx: 2 }}>
                  Page {currentPage + 1} of {Math.ceil(rawTokenData.pagination.total / itemsPerPage)}
                </Typography>
                
                <IconButton
                  variant='outlined'
                  size='sm'
                  disabled={!rawTokenData.pagination.hasMore}
                  onClick={() => fetchRawData(currentPage + 1)}
                >
                  <NavigateNextIcon />
                </IconButton>
                <IconButton
                  variant='outlined'
                  size='sm'
                  disabled={!rawTokenData.pagination.hasMore}
                  onClick={() => fetchRawData(Math.ceil(rawTokenData.pagination.total / itemsPerPage) - 1)}
                >
                  <LastPageIcon />
                </IconButton>
              </Box>
            </Box>
          </Card>
        )}

        {isLoadingRawData && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <Typography level='body-sm'>Loading token usage data...</Typography>
          </Box>
        )}

        {rawTokenData && rawTokenData.data.length === 0 && (
          <Alert variant='soft' color='neutral' sx={{ mt: 2 }}>
            <Typography level='body-sm'>
              No token usage data found. Data will appear here as users interact with AI models.
            </Typography>
          </Alert>
        )}
          </>
        )}
      </Box>
    </>
  );
} 
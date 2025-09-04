import '~/server/polyfills';
import { createTRPCRouter } from './trpc.server';

import { aixRouter } from '~/modules/aix/server/api/aix.router';
import { browseRouter } from '~/modules/browse/browse.router';
import { reportsRouter } from '~/modules/reports/reports.router';
import { tradeRouter } from '~/modules/trade/server/trade.router';

/**
 * Cloud rooter, which is geolocated in 1 location and separate from the other routers.
 * NOTE: at the time of writing, the location is aws|us-east-1
 */
export const appRouterCloud = createTRPCRouter({
  aix: aixRouter,
  browse: browseRouter,
  reports: reportsRouter,
  trade: tradeRouter,
});

// export type definition of API
export type AppRouterCloud = typeof appRouterCloud;
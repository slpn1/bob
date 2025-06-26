import * as React from 'react';

import { AppReports } from '../src/apps/reports/AppReports';

import { withNextJSPerPageLayout } from '~/common/layout/withLayout';


export default withNextJSPerPageLayout({ type: 'optima' }, () => <AppReports />); 
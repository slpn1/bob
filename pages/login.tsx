import * as React from 'react';

import { withNextJSPerPageLayout } from '~/common/layout/withLayout';
import {AppLogin} from "../src/apps/login/AppLogin";


export default withNextJSPerPageLayout({ type: 'optima' }, () => {
    return <AppLogin />
});

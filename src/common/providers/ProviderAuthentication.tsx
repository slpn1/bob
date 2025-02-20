import * as React from "react";

import { useAuthenticationChecker } from "~/common/components/useAuthenticationChecker";
import {AppLogin} from "../../apps/login/AppLogin";
export const ProviderAuthentication = (props: { children: React.ReactNode }) => {
    const isAuthenticated = useAuthenticationChecker();

    return (
        <AppLogin></AppLogin>
    );
}

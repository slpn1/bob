import * as React from "react";

export function useAuthenticationChecker(): boolean | null {
    const [isAlone, setIsAlone] = React.useState<boolean | null>(null);

    // React.useEffect(() => {
    //     const tabManager = new AloneDetector(channelName, setIsAlone);
    //     tabManager.checkIfAlone();
    //     return () => {
    //         tabManager.onUnmount();
    //     };
    // }, [channelName]);

    return true;
}

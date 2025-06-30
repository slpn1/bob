import {Box, Link, Typography} from "@mui/joy";
import { SessionProvider, useSession } from "next-auth/react";
import * as React from "react";

export function LogoutButton() {
    const { data: session } = useSession();

    return <Box sx={{
        width: 300,
        height: 44,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'start',
    }}>
        <Box sx={{ position: 'absolute', mx: 0.75, mt: 0 }}>
            <Typography sx={{
                fontSize: 14,
                color: '#291A2D',
                mb: -0.5,
            }}>Welcome {session?.user?.name}.</Typography> <Link sx={{
                fontSize: 12,
                color: '#291A2D',
                textDecoration: 'underline',
        }} href="/api/auth/signout">Sign out</Link>
        </Box>
    </Box>
}

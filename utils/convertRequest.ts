import type { NextRequest } from 'next/server';

export function convertFetchRequestToNextRequest(req: Request): Partial<NextRequest> {
    const cookies = Object.fromEntries(
        (req.headers.get('cookie') || '')
            .split('; ')
            .map(cookie => cookie.split('=').map(decodeURIComponent))
    );

    return {
        referrerPolicy: undefined,
        cookies, // Extract cookies from the request headers
        headers: req.headers, // Headers object
        method: req.method, // HTTP method
        url: req.url // Full URL
    };
}

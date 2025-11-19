import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Common Azure AD built-in role IDs that represent admin roles
 */
const ADMIN_ROLE_IDS = [
  '62e90394-69f5-4237-9190-012177145e10', // Global Administrator
  'c4e39bd9-1100-46d3-8c65-fb160da0071f', // Application Administrator
  '9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3', // Application Developer
  '158c047a-c907-4556-b7ef-446551a6b5f7', // Cloud Application Administrator
  '7be44c8a-adaf-4e2a-84d6-ab2649e08a13', // Privileged Role Administrator
  // Add any other admin role IDs that should have access
];

/**
 * Temporary list of admin emails for fallback
 * Remove this once proper role checking is implemented
 */
const ADMIN_EMAILS = [
  'simon.newman@asandk.com',
  // Add other admin emails here
];

/**
 * Decodes a JWT token and returns the payload as an object
 */
export function decodeJwtToken(token: string): any {
  try {
    // The token is in three parts: header.payload.signature
    // We need the payload part which is the second part (index 1)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return null;
    
    // Base64 decode the payload
    const payload = tokenParts[1];
    // Add padding if needed
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    const jsonPayload = atob(base64 + padding);
    
    // Parse the JSON payload
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

/**
 * Hook to check if the current user is an admin
 * Includes ability to override with query parameter for testing
 */
export function useIsAdmin(): boolean {
  const { data: session } = useSession();
  const [queryOverride, setQueryOverride] = useState<boolean | null>(null);
  
  // Check URL for admin override query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const noAdminParam = urlParams.get('noadmin');
      
      if (noAdminParam === 'true') {
        setQueryOverride(false);
      } else {
        // Reset override if parameter is removed
        setQueryOverride(null);
      }
    }
  }, []);
  
  // Check if the user has an admin role in their token
  const isAdmin = useMemo(() => {
    // If query parameter override is set, use that value
    if (queryOverride !== null) {
      return queryOverride;
    }

    console.log('No admin role found in token', session?.user?.email);
    // Temporary fallback: check if user's email is in admin list
    if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
      return true;
    }
    
    if (!session?.accessToken) return false;
    
    try {
      const tokenData = decodeJwtToken(session.accessToken);
      if (!tokenData) return false;
      
      // Check for admin role in wids (Well-known IDs)
      if (tokenData.wids && Array.isArray(tokenData.wids)) {
        // Check if any of the user's wids match our admin role IDs
        const hasAdminRole = tokenData.wids.some((wid: string) => ADMIN_ROLE_IDS.includes(wid));
        
        if (hasAdminRole) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }, [session, queryOverride]);
  
  return isAdmin;
}

/**
 * Function to check if a user is an admin based on their session
 * For use in server-side or non-hook contexts
 */
export function isUserAdmin(session: any): boolean {
  if (!session?.accessToken) return false;
  
  try {
    const tokenData = decodeJwtToken(session.accessToken);
    if (!tokenData) return false;
    
    // Check for admin role in wids (Well-known IDs)
    if (tokenData.wids && Array.isArray(tokenData.wids)) {
      // Check if any of the user's wids match our admin role IDs
      const hasAdminRole = tokenData.wids.some((wid: string) => ADMIN_ROLE_IDS.includes(wid));
      
      if (hasAdminRole) {
        return true;
      }
    }
    
    // Temporary fallback: check if user's email is in admin list
    if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
} 

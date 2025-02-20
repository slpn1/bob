// msalConfig.js
const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID, // Your Azure AD App's Client ID
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`, // Tenant ID or 'common'
    redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3000/api/auth/callback",
  },
  cache: {
    cacheLocation: "sessionStorage", // Can also use "localStorage"
    storeAuthStateInCookie: false, // Set to true for IE11/Edge compatibility
  },
};

const loginRequest = {
  scopes: ["User.Read"], // Permissions your app will request
};

module.exports = { msalConfig, loginRequest };

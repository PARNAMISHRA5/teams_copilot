import React, { useEffect, useState } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

// Load .env variables
require('dotenv').config();

const enableSso = process.env.REACT_APP_ENABLE_SSO;
console.log(`ESSO - ${enableSso}`)

const tenantId = process.env.REACT_APP_TENANT_ID
const clientId = process.env.REACT_APP_CLIENT_ID
const webappInstance = process.env.REACT_APP_WEBAPP_INSTANCE  
console.log(`Client ID - ${clientId}`)
console.log(`TEnant ID - ${tenantId}`)
console.log(`webapp ID - ${webappInstance}`)

const App = () => {
  const { instance, inProgress, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const account = instance.getAllAccounts()[0];
    if (account) {
      instance.setActiveAccount(account);
      setUsername(account.name);
    }
  }, [accounts, instance]);

  useEffect(() => {
    if (enableSso === "true") {
      const activeAccount = instance.getActiveAccount();
      if (!activeAccount && inProgress === InteractionStatus.None) {
        console.log("ENABLE_SSO is true — triggering login redirect...");
        instance.loginRedirect().catch((e) =>
          console.error("Login redirect error:", e)
        );
      }
    } else {
      console.log("ENABLE_SSO is false — skipping login");
      setUsername("Guest User");
    }
  }, [inProgress, instance]);

  const logout = () => {
    instance.logoutRedirect();
  };

  return (
    <div>
      {enableSso === "true" && isAuthenticated ? (
        <>
          <h2>Welcome, {username}</h2>
          <button onClick={logout}>Logout</button>
        </>
      ) : enableSso === "false" ? (
        <>
          <h2>Welcome, {username}</h2>
          <p>SSO is disabled — Guest Mode</p>
        </>
      ) : (
        <p>Checking login status...</p>
      )}
    </div>
  );
};

export default App;

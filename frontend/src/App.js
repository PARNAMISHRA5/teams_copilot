import React, { useEffect, useState } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import ChatApp from "./components/ChatApp"; // or "./Newchatapp" if renamed

const enableSso = process.env.REACT_APP_ENABLE_SSO;

const App = () => {
  const { instance, inProgress, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [username, setUsername] = useState(null);

  // Set active account after login
  useEffect(() => {
    const account = instance.getAllAccounts()[0];
    if (account) {
      instance.setActiveAccount(account);
      setUsername(account.name);
    }
  }, [accounts, instance]);

  // Trigger login if not already logged in
  useEffect(() => {
    const activeAccount = instance.getActiveAccount();

    if (enableSso === "true" && !activeAccount && inProgress === InteractionStatus.None) {
      console.log("🔁 Triggering loginRedirect...");
      instance.loginRedirect().catch((e) => {
        console.error("Login redirect error:", e);
      });
    }
  }, [inProgress, instance]);

  // Logout function to pass to ChatApp
  const handleLogout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: "http://localhost:3000/",
    });
  };

  // Render nothing while login is happening
  if (enableSso === "true" && !isAuthenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }



// Get Access Token
const windowStorage = instance?.browserStorage?.browserStorage?.windowStorage;
let accessTokenSecret = null;

if (windowStorage) {
  for (const key in windowStorage) {
    // Look specifically for a key that includes 'accesstoken'
    if (key.toLowerCase().includes('accesstoken')) {
      const value = windowStorage[key];

      if (typeof value === 'string') {
        try {
          const tokenObj = JSON.parse(value);
          accessTokenSecret = tokenObj.secret;
          break; // stop after first match
        } catch (err) {
          console.error('Invalid JSON format in value:', value);
        }
      }
    }
  }
}

// if (accessTokenSecret) {
//   console.log('✅ Access Token Secret:\n', accessTokenSecret);
//   console.log(accessTokenSecret)
// } else {
//   console.warn('❌ Access token secret not found.');
// }


  return (
    <ChatApp
      accesstoken={accessTokenSecret}
      account={instance.getActiveAccount()}
      logout={handleLogout}
      username={username}
    />
  );
};

export default App;

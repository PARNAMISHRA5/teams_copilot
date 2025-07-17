import React, { useEffect, useState } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import ChatApp from "./components/ChatApp";

const enableSso = process.env.REACT_APP_ENABLE_SSO === "true";
const redirectUrl = process.env.REACT_APP_REDIRECT_URI;

// Function to detect the platform (Teams or Web Browser)
const detectPlatform = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  // Check if the application is running within Microsoft Teams
  const isInTeams = window.location.href.includes('teams.microsoft.com') ||
                   window.parent !== window || // Checks if it's in an iframe
                   userAgent.includes('teams');

  if (isInTeams) {
    return {
      source: 'Microsoft Teams',
      platform: 'Teams',
      icon: 'teams',
      isTeams: true
    };
  }

  // Detect the browser if not in Teams
  let browser = 'Unknown';
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('edg')) {
    browser = 'Edge';
  }

  return {
    source: 'Web Browser',
    platform: browser,
    icon: 'web',
    isTeams: false
  };
};

const App = () => {
  const { instance, inProgress, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [username, setUsername] = useState(null);
  const [accessTokenSecret, setAccessTokenSecret] = useState(null);
  const [refreshTokenSecret, setRefreshTokenSecret] = useState(null);
  const [showPopupBlockerMessage, setShowPopupBlockerMessage] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [platformInfo, setPlatformInfo] = useState(null);

  // Detect platform on component mount
  useEffect(() => {
    setPlatformInfo(detectPlatform());
  }, []);

  // Set active account and username
  useEffect(() => {
    const account = instance.getAllAccounts()[0];
    if (account) {
      instance.setActiveAccount(account);
      setUsername(account.name);
    }
  }, [accounts, instance]);

  // Trigger login based on platform
  useEffect(() => {
    const activeAccount = instance.getActiveAccount();

    // Only proceed if SSO is enabled, no active account, no MSAL interaction in progress
    if (enableSso && !activeAccount && inProgress === InteractionStatus.None && platformInfo) {
      if (platformInfo.isTeams) {
        // Login for Microsoft Teams (using loginPopup)
        if (!loginAttempted) { 
          // console.log("🔁 Triggering login (Teams - Popup)...");
          setLoginAttempted(true);
          instance.loginPopup()
            .then(response => {
              setShowPopupBlockerMessage(false);
              if (response && response.account) {
                instance.setActiveAccount(response.account);
                setUsername(response.account.name);
              }
            })
            .catch((e) => {
              console.error("Login error (Teams - Popup):", e);
              if (e.errorCode === "popup_window_error" || (e.name === "BrowserAuthError" && e.errorMessage.includes("popup_window_error"))) {
                setShowPopupBlockerMessage(true);
              } else {
                setShowPopupBlockerMessage(false);
              }
            });
        }
      } else {
        // Login for Web Browser (using loginRedirect)
        // console.log("🔁 Triggering login (Web - Redirect)...");
        instance.loginRedirect().catch((e) => {
          console.error("Login redirect error (Web):", e);
        });
      }
    }
    // If authenticated, reset loginAttempted and hide message
    if (isAuthenticated) {
        setLoginAttempted(false);
        setShowPopupBlockerMessage(false);
    }
  }, [inProgress, instance, isAuthenticated, loginAttempted, platformInfo]); // Added platformInfo to dependencies

  // Extract tokens from browser storage
  useEffect(() => {
    const extractTokens = async () => {
      if (isAuthenticated) {
        try {
          const account = instance.getActiveAccount();
          if (account) {
            const request = {
              account: account,
              scopes: ["User.Read", "offline_access"]
            };
            const response = await instance.acquireTokenSilent(request);
            setAccessTokenSecret(response.accessToken);
            setRefreshTokenSecret(response.refreshToken || null);
          }
        } catch (error) {
          console.error("Token extraction failed:", error);
        }
      }
    };
    extractTokens();
  }, [instance, accounts, isAuthenticated]);

  const handleLogout = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: redirectUrl });
  };

  const handleTryAgain = () => {
    setShowPopupBlockerMessage(false);
    setLoginAttempted(false); // Allow a new login attempt
  };

  // Display loading or pop-up blocker message based on platform
  if (enableSso && !isAuthenticated) {
    // Show loading only after platform is detected
    if (!platformInfo) {
      return (
        <div className="h-screen w-screen flex items-center justify-center text-gray-500">
          Loading platform info...
        </div>
      );
    }

    if (platformInfo.isTeams && showPopupBlockerMessage) {
      return (
        <div className="h-screen w-screen flex items-center justify-center text-gray-500">
          <div className="text-center p-6 bg-white rounded-lg shadow-xl max-w-sm mx-auto">
            <p className="text-xl font-semibold text-gray-800 mb-3">Login Required</p>
            <p className="text-gray-600 mb-4">
              Please enable pop-ups for this site to proceed.
            </p>
            <button
              onClick={handleTryAgain}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    } else {
      // For web browsers, or if in Teams but no popup blocker message
      return (
        <div className="h-screen w-screen flex items-center justify-center text-gray-500">
          Loading...
        </div>
      );
    }
  }

  return (
    <ChatApp
      token={accessTokenSecret}
      setToken={setAccessTokenSecret}
      account={instance.getActiveAccount()}
      logout={handleLogout}
      refreshtoken={refreshTokenSecret}
      msalinstance={instance}
    />
  );
};

export default App;

import React, { useRef, useEffect, useState } from "react";
import { LogOut, Settings, User, ChevronUp } from "lucide-react";

export default function ProfileMenu({ 
  account, 
  logout, 
  isCollapsed = false, 
  isMobile = false, 
  showUsername = false, 
  platformInfo = { isTeams: false } 
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get avatar size based on platform and mobile/desktop
const getAvatarSize = () => {
  return isMobile || isCollapsed ? 'w-9 h-9 text-sm' : 'w-10 h-10 text-sm';
};

  // Mobile version - always show username when showUsername is true
  if (isMobile) {
    return (
      <div className="relative w-full py-2" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className={`focus:outline-none w-full flex items-center gap-3 px-2 py-1.5 hover:bg-gray-100 rounded-xl transition-all duration-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
        <div
          className={`bg-gradient-to-tr from-indigo-600 to-purple-500 text-white font-semibold shadow-md hover:scale-105 transition-transform duration-200 flex items-center justify-center rounded-full aspect-square ${
            isCollapsed || isMobile ? 'w-9 text-sm' : 'w-10 text-sm'
          }`}
        >
          {account?.name?.[0] || 'U'}
        </div>

          {(showUsername || !isCollapsed) && (
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm text-gray-800 font-semibold truncate">
                {account?.name || "User"}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {account?.username || "user@example.com"}
              </p>
            </div>
          )}
          {!isCollapsed && (
            <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          )}
        </button>


        {dropdownOpen && (
          <div className="absolute bottom-full left-2 right-2 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 animate-fadeIn">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-sm text-gray-700 font-semibold">
                {account?.name || "User"}
              </p>
              <p className="text-xs text-gray-400 break-words">
                {account?.username || "user@example.com"}
              </p>
            </div>
            <div className="py-1">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  // Handle settings if needed
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop version
 return (
  <div className="relative py-1" ref={dropdownRef}>
    <button
      onClick={() => setDropdownOpen((prev) => !prev)}
      className={`w-full rounded-full transition-colors focus:outline-none ${
        isCollapsed ? 'flex justify-center p-0' : 'flex items-center gap-3 px-2 py-1.5 hover:bg-gray-100 rounded-xl'
      }`}
    >
    <div
      className={`bg-gradient-to-tr from-indigo-600 to-purple-500 text-white font-semibold shadow-md hover:scale-105 transition-transform duration-200 flex items-center justify-center rounded-full aspect-square ${
        isCollapsed || isMobile ? 'w-9 text-sm' : 'w-10 text-sm'
      }`}
    >
      {account?.name?.[0] || 'U'}
    </div>

      {!isCollapsed && (
        <>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm text-gray-800 font-semibold truncate">
              {account?.name || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {account?.username}
            </p>
          </div>
          <ChevronUp
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              dropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </>
      )}
    </button>

    {dropdownOpen && (
      <div
        className={`absolute z-50 bottom-full mb-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 animate-fadeIn ${
          isCollapsed ? 'left-full ml-2' : 'left-0'
        }`}
        style={{ maxHeight: 'calc(100vh - 5rem)' }} // prevent clipping near top edge
      >

        <div className="px-3 py-2 border-b border-gray-100">
          <p className="text-sm text-gray-800 font-semibold">
            {account?.name || 'User'}
          </p>
          <p className="text-xs text-gray-400 break-words max-w-[11rem]">
            {account?.username}
          </p>
        </div>
        <div className="py-1">
          <button
            onClick={() => {
              setDropdownOpen(false);
              // Add settings logic if needed
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={() => {
              setDropdownOpen(false);
              logout();
            }}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    )}
  </div>
);

}
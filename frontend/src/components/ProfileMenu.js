import React, { useRef, useEffect, useState } from "react";
import { LogOut, Settings, User } from "lucide-react";

export default function ProfileMenu({ account, logout, isCollapsed = false, isMobile = false }) {
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

  // Mobile version (unchanged positioning)
  if (isMobile) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="focus:outline-none"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center font-semibold text-sm shadow-lg hover:scale-105 transition-all duration-200">
            {account?.name?.[0] || "U"}
          </div>
        </button>

        {dropdownOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 animate-fadeIn">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm text-gray-700 font-semibold">
                {account?.name || "User"}
              </p>
              <p className="text-xs text-gray-400 break-words max-w-[11rem]">
                {account?.username}
              </p>
            </div>
            <div className="py-2">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  // Handle settings if needed
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className={`focus:outline-none w-full ${
          isCollapsed ? 'flex justify-center' : 'flex items-center gap-3'
        }`}
      >
        <div className={`rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center font-semibold shadow-lg hover:scale-105 transition-all duration-200 ${
          isCollapsed ? 'w-8 h-8 text-sm' : 'w-8 h-8 text-sm'
        }`}>
          {account?.name?.[0] || "U"}
        </div>
        {!isCollapsed && (
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm text-gray-700 font-semibold truncate">
              {account?.name || "User"}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {account?.username}
            </p>
          </div>
        )}
      </button>

      {dropdownOpen && (
        <div 
          className={`absolute bottom-full mb-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 animate-fadeIn ${
            isCollapsed ? 'left-full ml-2' : 'left-0'
          }`}
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm text-gray-700 font-semibold">
              {account?.name || "User"}
            </p>
            <p className="text-xs text-gray-400 break-words max-w-[11rem]">
              {account?.username}
            </p>
          </div>
          <div className="py-2">
            <button
              onClick={() => {
                setDropdownOpen(false);
                // Handle settings if needed
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={() => {
                setDropdownOpen(false);
                logout();
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
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
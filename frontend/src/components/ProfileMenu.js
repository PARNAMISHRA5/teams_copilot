import React, { useRef, useEffect, useState } from "react";
import { LogOut, Settings, User } from "lucide-react";

export default function ProfileMenu({ account, logout }) {
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

  return (
    <div className="absolute top-4 right-4 z-50" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="focus:outline-none"
      >
        <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center font-semibold text-sm shadow-lg hover:scale-105 transition-all duration-200">
          {account?.name?.[0] || "U"}
        </div>
      </button>

      {dropdownOpen && (
        <div
          className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 animate-fadeIn"
        >

            <div className="px-4 py-3 border-b border-gray-100">
  <p className="text-sm text-gray-700 font-semibold">
    {account?.name || "User"}
  </p>
  <p className="text-xs text-gray-400 break-words max-w-[11rem]">
    {account?.username}
  </p>
</div>

          <ul className="py-1 text-sm text-gray-700">
            <li className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition-all cursor-pointer">
              <User className="w-4 h-4 text-gray-500" />
              Account
            </li>
            <li className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition-all cursor-pointer">
              <Settings className="w-4 h-4 text-gray-500" />
              Settings
            </li>
            <li
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 cursor-pointer transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

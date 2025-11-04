"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useUser } from "../hooks/useUser";
import { useAuth } from "../context/AuthContext";

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useUser();
  const { logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);


  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  
  if (isLoading) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Link href="/registration-type">
        <button className="text-gray-600 hover:text-green-900 p-2 hover:bg-gray-100 rounded-full transition-all duration-200">
          
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>
      </Link>
    );
  }

  const getInitials = () => {
    if (!user) return "?";
    const first = user.firstName?.charAt(0)?.toUpperCase() || "";
    const last = user.lastName?.charAt(0)?.toUpperCase() || "";
    
    if (first && last) {
      return first + last;
    }
    
    return first || user.email?.charAt(0)?.toUpperCase() || "?";
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full transition-all duration-200 shadow-md hover:shadow-lg"
        title={`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email}
      >
        {getInitials()}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
          <Link href={user?.accountType === "farmer" ? "/dashboard/farmer" : "/dashboard"} onClick={() => setIsOpen(false)}>
            <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            </div>
          </Link>

          <Link href={user?.accountType === "farmer" ? "/dashboard/farmer" : "/dashboard"}>
            <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
              Dashboard
            </div>
          </Link>

          <Link href={user?.accountType === "farmer" ? "/dashboard/farmer/settings" : "/dashboard/profile"}>
            <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
              {user?.accountType === "farmer" ? "Account Settings" : "Profile & Settings"}
            </div>
          </Link>

          {user?.accountType === "individual" && (
            <>
              <Link href="/dashboard/orders">
                <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                  Orders
                </div>
              </Link>
              <Link href="/dashboard/subscriptions">
                <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                  Subscriptions
                </div>
              </Link>
            </>
          )}

          {user?.accountType === "farmer" && (
            <>
              <Link href="/dashboard/farmer/products">
                <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                  Manage Products
                </div>
              </Link>
              <Link href="/dashboard/farmer/orders">
                <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                  Orders & Subscriptions
                </div>
              </Link>
              <Link href="/dashboard/farmer/packages">
                <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                  My Packages
                </div>
              </Link>
            </>
          )}

          <div
            className="px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer border-t border-gray-200"
            onClick={handleLogout}
          >
            Sign Out
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;

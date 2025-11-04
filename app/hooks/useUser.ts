"use client";

import { useAuth } from "../context/AuthContext";

export function useUser() {
  const { user, isLoading, isAuthenticated, token } = useAuth();

  return {
    user,
    isLoading,
    isAuthenticated,
    token,
    
    isCustomer: true,
    isFarmer: false,
    isAdmin: false,
  };
}

export function createAuthFetch(token: string) {
  return async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  };
}

import { useCallback } from 'react';

/**
 * Shared hook for handling login redirects
 * Replaces duplicate handleLogin functions across 8 files
 */
export function useLogin() {
  const handleLogin = useCallback(() => {
    window.location.href = '/api/login';
  }, []);

  return { handleLogin };
}
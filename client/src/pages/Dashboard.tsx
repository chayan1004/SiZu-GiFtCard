import { useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Redirect based on user role
      if (user.role === 'admin') {
        setLocation('/dashboard/admin');
      } else {
        setLocation('/dashboard/user');
      }
    } else if (!isLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      setLocation('/login');
    }
  }, [user, isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
  );
}
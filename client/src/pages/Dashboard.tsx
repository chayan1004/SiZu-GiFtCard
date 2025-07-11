import { useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { PageContainer, LoadingSpinner } from "@/components/DesignSystem";

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
      <PageContainer>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  // Show loading while redirecting
  return (
    <PageContainer>
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    </PageContainer>
  );
}
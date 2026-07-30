import React from 'react';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { LoginView } from './features/auth/LoginView';

import { DashboardView } from './features/dashboard/DashboardView';

const MainApp = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-finpilot-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-finpilot-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return <DashboardView />;
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;

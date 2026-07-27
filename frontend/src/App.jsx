import React from 'react';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { LoginView } from './features/auth/LoginView';

const MainApp = () => {
  const { isAuthenticated, isLoading, logout } = useAuth();

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

  return (
    <div className="min-h-screen bg-finpilot-dark text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold">FinPilot Dashboard</h1>
          <button 
            onClick={logout}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
        
        <div className="bg-finpilot-card border border-slate-700 p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-finpilot-primary">Welcome to Sprint 1!</h2>
          <p className="text-finpilot-muted leading-relaxed">
            You are successfully authenticated. Your JWT is stored and your requests are intercepting it properly.
            The foundation is set for building the Safe to Spend dashboard and AI Chat in the upcoming sprints.
          </p>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;

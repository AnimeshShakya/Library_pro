import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'sonner';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import CustomerPortal from './pages/CustomerPortal';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer"
              element={
                <ProtectedRoute>
                  <CustomerPortal />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'white',
                border: '2px solid #0A0A0A',
                borderRadius: '0',
                boxShadow: '4px 4px 0px 0px rgba(10, 10, 10, 1)',
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontWeight: 600,
              },
            }}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

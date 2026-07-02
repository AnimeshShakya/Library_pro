import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen } from '@phosphor-icons/react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user !== false) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/customer');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      // Navigation will be handled by useEffect after user state updates
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#0055FF] border-2 border-[#0A0A0A] hard-shadow mb-4">
            <BookOpen size={48} weight="bold" color="white" />
          </div>
          <h1 className="text-4xl font-black font-outfit uppercase tracking-tighter text-[#0A0A0A]">
            Library Pro
          </h1>
          <p className="mt-2 text-base font-medium text-[#52525B]">Professional Library Management</p>
        </div>

        <div className="bg-white border-2 border-[#0A0A0A] hard-shadow p-8">
          <h2 className="text-2xl font-bold font-outfit mb-6 text-[#0A0A0A]">Login</h2>
          
          {error && (
            <div data-testid="login-error" className="mb-4 p-4 bg-[#FF3B30] border-2 border-[#0A0A0A] text-white font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} data-testid="login-form">
            <div className="mb-4">
              <label className="block text-sm font-semibold uppercase tracking-widest mb-2 text-[#0A0A0A]">
                Email
              </label>
              <input
                type="email"
                data-testid="login-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 neo-brutal-input font-medium"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold uppercase tracking-widest mb-2 text-[#0A0A0A]">
                Password
              </label>
              <input
                type="password"
                data-testid="login-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 neo-brutal-input font-medium"
                required
              />
            </div>

            <button
              type="submit"
              data-testid="login-submit-button"
              disabled={loading}
              className="w-full py-3 bg-[#0055FF] text-white neo-brutal-btn disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-medium text-[#52525B]">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-[#0055FF] font-semibold hover:underline" data-testid="register-link">
              Register here
            </Link>
          </p>
        </div>

        <div className="mt-6 p-4 bg-[#FFD600] border-2 border-[#0A0A0A] hard-shadow">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0A0A0A] mb-2">Demo Credentials:</p>
          <p className="text-sm font-medium text-[#0A0A0A]">Admin: admin@library.com / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

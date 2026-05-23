import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('admin@siem.com');
  const [password, setPassword] = useState('Admin@1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(email, password);
      setAuth(res.data.accessToken, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <form onSubmit={handleSubmit} className="w-full max-w-md surface-card p-8 shadow-3">
        <h1 className="text-2xl font-bold text-gray-50 mb-1 tracking-tight">SIEMlite</h1>
        <p className="text-secondary mb-8">Security Operations Center</p>
        {error && <p className="text-severity-critical text-sm mb-4">{error}</p>}
        <label className="label-caps block mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="surface-input w-full mb-4 px-3 py-2"
        />
        <label className="label-caps block mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="surface-input w-full mb-6 px-3 py-2"
        />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

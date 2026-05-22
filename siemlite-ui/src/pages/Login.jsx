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
    <div className="min-h-screen flex items-center justify-center bg-soc-bg">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-soc-panel border border-soc-border rounded-xl p-8 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-white mb-2">SIEMlite</h1>
        <p className="text-slate-400 text-sm mb-6">Security Operations Center</p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <label className="block text-sm text-slate-300 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded bg-soc-bg border border-soc-border text-white"
        />
        <label className="block text-sm text-slate-300 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-3 py-2 rounded bg-soc-bg border border-soc-border text-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/auth/admin/login', { email, password });
      login(res.data);
      navigate('/admin');
    } catch (err) {
      setError(err?.response?.data || 'Đăng nhập admin thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050813] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-cyan-300/20 bg-[#0f1730]/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">Admin Portal</p>
        <h1 className="mt-3 text-3xl font-black">Đăng nhập quản trị</h1>
        <p className="mt-2 text-sm text-slate-400">Dành cho tài khoản có quyền kiểm duyệt và vận hành hệ thống.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            className="w-full rounded-xl border border-blue-300/20 bg-[#0b1228] px-4 py-3 text-sm focus:border-cyan-300/50 focus:outline-none"
            placeholder="Email admin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="w-full rounded-xl border border-blue-300/20 bg-[#0b1228] px-4 py-3 text-sm focus:border-cyan-300/50 focus:outline-none"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-3 text-sm font-black text-[#101b35] disabled:opacity-60"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập Admin'}
          </button>
        </form>

        <div className="mt-6 text-xs text-slate-400">
          <Link to="/login" className="text-cyan-300 hover:underline">Về đăng nhập người dùng</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

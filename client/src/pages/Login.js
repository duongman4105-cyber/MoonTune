import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { FaEnvelope, FaLock, FaMusic, FaArrowRight, FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', { email, password });
      login(res.data);
      sessionStorage.setItem(
        'moontune:welcome-message',
        `Welcome ${res.data?.username || ''}, chào mừng đã đến MoonTune!`
      );
      navigate('/');
    } catch (err) {
      setError(err.response?.data || 'Không thể đăng nhập. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <Link to="/" className="absolute left-6 top-6 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20">
        <FaTimes className="text-sm" />
      </Link>

      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_30px_90px_rgba(4,8,20,0.55)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden overflow-hidden border-r border-white/10 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(33,212,253,0.28),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(122,92,255,0.28),transparent_38%),linear-gradient(145deg,rgba(9,14,31,0.96),rgba(16,20,45,0.92))]" />
          <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl animate-float-slow" />
          <div className="absolute -right-24 bottom-8 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl animate-float-slow" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
            <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-cyan-100">
              <FaMusic />
              MOONTUNE
            </div>

            <div className="max-w-md space-y-6">
              <h1 className="text-5xl font-black leading-tight tracking-tight text-white">
                Đăng nhập để tiếp tục nghe nhạc theo cách của bạn.
              </h1>
              <p className="text-lg leading-8 text-slate-300">
                Giao diện mới, nhịp điệu mượt hơn, và mọi thứ bạn cần đều nằm ngay trong tầm tay.
              </p>
              <div className="grid gap-3 text-sm text-slate-200">
                <div className="glass-panel rounded-2xl px-4 py-3">Danh sách phát cá nhân hóa</div>
                <div className="glass-panel rounded-2xl px-4 py-3">Lưu lịch sử nghe và bài hát yêu thích</div>
                <div className="glass-panel rounded-2xl px-4 py-3">Thiết kế tối giản, tập trung vào âm nhạc</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(33,212,253,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(122,92,255,0.16),transparent_36%)]" />
          <div className="relative z-10 w-full max-w-md animate-fade-in-up">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-200 shadow-[0_0_30px_rgba(33,212,253,0.2)]">
                <FaMusic className="text-2xl" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Chào mừng trở lại</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                Đăng nhập để nghe nhạc, tiếp tục theo dõi lịch sử và quản lý thư viện của bạn.
              </p>
            </div>

            <form onSubmit={handleLogin} className="glass-panel space-y-5 rounded-[1.75rem] p-6 sm:p-7">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Email</label>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1730]/90 px-4 py-3 transition focus-within:border-cyan-300/50 focus-within:ring-2 focus-within:ring-cyan-300/20">
                  <FaEnvelope className="text-cyan-300/80" />
                  <input
                    type="email"
                    className="w-full bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Mật khẩu</label>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1730]/90 px-4 py-3 transition focus-within:border-cyan-300/50 focus-within:ring-2 focus-within:ring-cyan-300/20">
                  <FaLock className="text-cyan-300/80" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-cyan-300/80 transition hover:text-cyan-300"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 px-5 py-3.5 text-base font-bold text-slate-950 shadow-[0_18px_40px_rgba(33,212,253,0.28)] transition hover:scale-[1.01] hover:shadow-[0_24px_55px_rgba(122,92,255,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                {!loading && <FaArrowRight className="transition group-hover:translate-x-0.5" />}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-300">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-semibold text-cyan-200 underline decoration-cyan-200/40 underline-offset-4 hover:text-white">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

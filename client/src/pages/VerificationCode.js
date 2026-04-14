import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft } from 'react-icons/fa';

const VerificationCode = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const { email, userId } = location.state || {};
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Countdown timer cho resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900 px-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">Vui lòng quay lại và đăng ký/đăng nhập lại.</p>
          <button
            onClick={() => navigate('/register')}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition"
          >
            Quay lại đăng ký
          </button>
        </div>
      </div>
    );
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('Vui lòng nhập mã xác nhận.');
      return;
    }

    if (code.length !== 6) {
      setError('Mã xác nhận phải có 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data || 'Xác nhận thất bại.');
        return;
      }

      // Đăng nhập thành công
      login(data);
      navigate('/');
    } catch (err) {
      setError('Có lỗi xảy ra. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMessage('');
    setError('');
    setResendLoading(true);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data || 'Gửi lại mã thất bại.');
      } else {
        setResendMessage('✅ Mã xác nhận mới đã được gửi. Vui lòng kiểm tra email.');
        setCode('');
        setCountdown(60); // 60 giây cooldown
      }
    } catch (err) {
      setError('Có lỗi xảy ra. ' + err.message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition mb-8"
        >
          <FaArrowLeft size={18} />
          Quay lại
        </button>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[2%] backdrop-blur-xl p-8 shadow-2xl">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-500 mb-4">
              <span className="text-2xl">✉️</span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Xác nhận email</h1>
            <p className="text-slate-400 text-sm">
              Chúng tôi đã gửi mã xác nhận đến<br />
              <strong className="text-cyan-300">{email}</strong>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            {/* Code Input */}
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-3">
                Mã xác nhận (6 ký tự)
              </label>
              <input
                type="text"
                maxLength="6"
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setCode(val);
                }}
                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-center text-2xl font-bold tracking-widest text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
              />
              <p className="text-xs text-slate-400 mt-2">
                Mã này có hiệu lực trong <strong>5 phút</strong>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-lg border border-red-400/20 bg-red-500/10 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {resendMessage && (
              <div className="p-4 rounded-lg border border-emerald-400/20 bg-emerald-500/10 text-emerald-300 text-sm">
                {resendMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Đang xác nhận...' : 'Xác nhận'}
            </button>
          </form>

          {/* Resend Button */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-center text-slate-400 text-sm mb-4">
              Chưa nhận được mã?
            </p>
            <button
              onClick={handleResend}
              disabled={resendLoading || countdown > 0}
              className="w-full py-2 px-4 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-slate-100 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {resendLoading ? 'Đang gửi...' : countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã'}
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-slate-400 text-center">
              💡 Kiểm tra thư mục <strong>Spam</strong> nếu không thấy email trong hộp thư chính
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationCode;

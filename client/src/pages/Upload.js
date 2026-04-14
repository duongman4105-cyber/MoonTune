import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { FaCloudUploadAlt, FaMusic, FaImage, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [audio, setAudio] = useState(null);
  const [cover, setCover] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const canUpload = useMemo(() => Boolean(title.trim() && artist.trim() && audio), [title, artist, audio]);

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [audioPreviewUrl, coverPreviewUrl]);

  const handleAudioChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);

    setAudio(file);
    const url = URL.createObjectURL(file);
    setAudioPreviewUrl(url);
    const audioEl = new Audio(url);

    audioEl.onloadedmetadata = () => {
      setDuration(audioEl.duration || 0);
    };
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0] || null;
    setCover(file);

    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    if (file) {
      setCoverPreviewUrl(URL.createObjectURL(file));
    } else {
      setCoverPreviewUrl('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Vui lòng đăng nhập trước khi tải bài hát.');
      return;
    }
    if (!canUpload) return;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('audio', audio);
    if (cover) formData.append('cover', cover);
    formData.append('duration', String(duration || 0));

    setUploading(true);
    setError('');
    setSuccessMessage('');

    try {
      await api.post('/api/songs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          token: `Bearer ${user.token}`,
        },
      });

      window.dispatchEvent(new CustomEvent('moontune:notifications-updated'));
      setSuccessMessage('Upload thành công! Bài hát đã gửi cho admin kiểm duyệt. Đang chuyển về trang chủ...');
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Tải bài hát thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-220px)] w-full max-w-4xl items-center text-white">
      <div className="w-full">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black sm:text-4xl">Tải bài hát mới</h1>
            <p className="mt-2 text-slate-300">Đưa âm nhạc của bạn lên MOONTUNE chỉ trong vài bước.</p>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
            <FaArrowLeft /> Quay lại
          </Link>
        </div>

        <div className="glass-panel rounded-3xl p-6 sm:p-8">
          <form onSubmit={handleUpload} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">Tên bài hát</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tên bài hát"
                className="w-full rounded-2xl border border-white/10 bg-[#0d1730]/90 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-300/50"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">Nghệ sĩ</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Tên nghệ sĩ"
                className="w-full rounded-2xl border border-white/10 bg-[#0d1730]/90 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-300/50"
                required
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                <FaMusic className="text-cyan-300" /> File nhạc
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                className="w-full rounded-2xl border border-white/10 bg-[#0d1730]/90 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-bold file:text-slate-900"
                required
              />
              {audio && <p className="mt-2 text-xs text-cyan-200">Đã chọn: {audio.name}</p>}
              {audioPreviewUrl && (
                <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-[#0a1330] p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Nghe thử trước khi upload</p>
                  <audio controls src={audioPreviewUrl} className="w-full" preload="metadata" />
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                <FaImage className="text-violet-300" /> Ảnh bìa (tuỳ chọn)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="w-full rounded-2xl border border-white/10 bg-[#0d1730]/90 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-violet-400 file:px-4 file:py-2 file:text-sm file:font-bold file:text-slate-900"
              />
              {cover && <p className="mt-2 text-xs text-violet-200">Đã chọn: {cover.name}</p>}
              {coverPreviewUrl && (
                <img src={coverPreviewUrl} alt="cover preview" className="mt-3 h-28 w-28 rounded-xl border border-white/15 object-cover" />
              )}
            </div>
          </div>

          {duration > 0 && (
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
              <FaCheckCircle className="mr-2 inline" />
              Đã nhận diện thời lượng: {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
              {successMessage}
            </div>
          )}

            <button
              type="submit"
              disabled={uploading || !canUpload}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-3.5 text-base font-black text-slate-900 shadow-[0_20px_40px_rgba(33,212,253,0.25)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaCloudUploadAlt />
              {uploading ? 'Đang tải lên...' : 'Tải bài hát'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Upload;

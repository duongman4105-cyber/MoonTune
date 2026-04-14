import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadAdminImage, getImagePreview } from '../utils/imageUpload';
import {
  createAdminAd,
  createAdminNotification,
  deleteAdminNotification,
  deleteAdminAd,
  deleteAdminUser,
  fetchAdminCore,
  fetchAdminUserSongs,
  moderateAdminSong,
  toggleAdminBlock,
  toggleAdminRole,
  updateAdminBadges,
} from '../utils/adminActions';

const BADGE_OPTIONS = [
  { value: 'nha-sang-tao', label: 'Nhà sáng tạo' },
  { value: 'nguoi-noi-tieng', label: 'Người nổi tiếng' },
  { value: 'nghe-si-xac-thuc', label: 'Nghệ sĩ xác thực' },
  { value: 'tai-khoan-noi-bat', label: 'Tài khoản nổi bật' },
];

const fmtNumber = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

const Admin = () => {
  const { user } = useAuth();
  const token = user?.token;
  const headers = useMemo(() => ({ token: `Bearer ${token}` }), [token]);

  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserSongs, setSelectedUserSongs] = useState([]);
  const [pendingSongs, setPendingSongs] = useState([]);
  const [ads, setAds] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState({ plays: [], growth: [], engagement: [] });

  const [newAd, setNewAd] = useState({ type: 'banner', title: '', imageUrl: '', audioUrl: '', linkUrl: '' });
  const [newNotification, setNewNotification] = useState({ title: '', message: '', linkUrl: '' });
  const [previewSongId, setPreviewSongId] = useState('');
  const [adImageFile, setAdImageFile] = useState(null);
  const [adImagePreview, setAdImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchCore = useCallback(async () => {
    const core = await fetchAdminCore(headers);
    setDashboard(core.dashboard);
    setUsers(core.users);
    setPendingSongs(core.pendingSongs);
    setAds(core.ads);
    setNotifications(core.notifications);
    setAnalytics(core.analytics);
  }, [headers]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        await fetchCore();
      } catch (err) {
        setError('Không thể tải dữ liệu admin.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [fetchCore]);

  const selectedUser = useMemo(
    () => users.find((item) => item._id === selectedUserId) || null,
    [users, selectedUserId]
  );

  const filteredUsers = useMemo(() => {
    const keyword = userSearch.trim().toLowerCase();
    if (!keyword) return users;

    return users.filter((item) => {
      const username = (item.username || '').toLowerCase();
      const email = (item.email || '').toLowerCase();
      return username.includes(keyword) || email.includes(keyword);
    });
  }, [users, userSearch]);

  const handleToggleAdmin = async (targetUser) => {
    try {
      const updatedUser = await toggleAdminRole({ userId: targetUser._id, isAdmin: !targetUser.isAdmin, headers });
      setUsers((prev) => prev.map((item) => (item._id === targetUser._id ? updatedUser : item)));
    } catch {
      setError('Không thể cập nhật quyền admin.');
    }
  };

  const handleToggleBlock = async (targetUser) => {
    const blockedReason = targetUser.isBlocked ? '' : window.prompt('Lý do khóa tài khoản:', 'Vi phạm tiêu chuẩn cộng đồng') || '';
    try {
      const updatedUser = await toggleAdminBlock({
        userId: targetUser._id,
        isBlocked: !targetUser.isBlocked,
        blockedReason,
        headers,
      });
      setUsers((prev) => prev.map((item) => (item._id === targetUser._id ? updatedUser : item)));
    } catch {
      setError('Không thể khóa/mở khóa tài khoản.');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Xóa tài khoản ${targetUser.username}?`)) return;
    try {
      await deleteAdminUser({ userId: targetUser._id, headers });
      setUsers((prev) => prev.filter((item) => item._id !== targetUser._id));
      if (selectedUserId === targetUser._id) {
        setSelectedUserId('');
        setSelectedUserSongs([]);
      }
    } catch {
      setError('Không thể xóa tài khoản.');
    }
  };

  const handleChangeBadge = async (targetUser, badgeValue, checked) => {
    const nextBadges = checked
      ? [...(targetUser.badges || []), badgeValue]
      : (targetUser.badges || []).filter((item) => item !== badgeValue);

    try {
      const updatedUser = await updateAdminBadges({ userId: targetUser._id, badges: nextBadges, headers });
      setUsers((prev) => prev.map((item) => (item._id === targetUser._id ? updatedUser : item)));
    } catch {
      setError('Không thể cập nhật huy hiệu.');
    }
  };

  const fetchUserSongs = async (userId) => {
    setSelectedUserId(userId);
    try {
      setSelectedUserSongs(await fetchAdminUserSongs(userId, headers));
    } catch {
      setError('Không thể tải danh sách bài hát của tài khoản này.');
      setSelectedUserSongs([]);
    }
  };

  const moderateSong = async (songId, action) => {
    const moderationNotes = window.prompt('Ghi chú kiểm duyệt:', action === 'approved' ? 'Âm thanh đạt chất lượng' : 'Nội dung cần chỉnh sửa') || '';
    const qualityScore = window.prompt('Điểm chất lượng âm thanh (0-100):', action === 'approved' ? '85' : '50') || '';
    const copyrightStatus = window.prompt('Tình trạng bản quyền (unknown/clear/flagged):', action === 'approved' ? 'clear' : 'flagged') || 'unknown';

    try {
      await moderateAdminSong({ songId, action, moderationNotes, qualityScore, copyrightStatus, headers });
      setPendingSongs((prev) => prev.filter((song) => song._id !== songId));
      await fetchCore();
    } catch {
      setError('Không thể kiểm duyệt bài hát.');
    }
  };

  const handleCreateAd = async (e) => {
    e.preventDefault();
      setUploadingImage(true);
      try {
        let imageUrl = newAd.imageUrl;
        if (adImageFile) {
          imageUrl = await uploadAdminImage({ file: adImageFile, token, folder: 'ads' });
        }
        if (!imageUrl.trim()) {
          setError('Vui lòng tải lên ảnh banner hoặc nhập URL.');
          setUploadingImage(false);
          return;
        }
        const ad = await createAdminAd({ payload: { ...newAd, imageUrl }, headers });
        setAds((prev) => [ad, ...prev]);
        setNewAd({ type: 'banner', title: '', imageUrl: '', audioUrl: '', linkUrl: '' });
        setAdImageFile(null);
        setAdImagePreview('');
        setUploadingImage(false);
      } catch (err) {
        setError('Không thể tạo quảng cáo: ' + err.message);
        setUploadingImage(false);
      }
  };

  const handleDeleteAd = async (id) => {
    try {
      await deleteAdminAd({ adId: id, headers });
      setAds((prev) => prev.filter((item) => item._id !== id));
    } catch {
      setError('Không thể xóa quảng cáo.');
    }
  };

  const handleAdImageChange = async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        setAdImageFile(file);
        try {
          const preview = await getImagePreview(file);
          setAdImagePreview(preview);
        } catch (err) {
          setError('Không thể tải xem trước ảnh.');
        }
      }
    };

  const handleCreateNotification = async (e) => {
    e.preventDefault();
    try {
      const notification = await createAdminNotification({ payload: { ...newNotification, audience: 'all' }, headers });
      setNotifications((prev) => [notification, ...prev]);
      setNewNotification({ title: '', message: '', linkUrl: '' });
    } catch {
      setError('Không thể gửi thông báo.');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm('Bạn có chắc muốn xóa thông báo này?')) return;
    try {
      await deleteAdminNotification({ notificationId, headers });
      setNotifications((prev) => prev.filter((item) => item._id !== notificationId));
    } catch {
      setError('Không thể xóa thông báo.');
    }
  };

  if (loading) return <div className="text-slate-300">Đang tải trang quản trị...</div>;

  return (
    <div className="space-y-8 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <div>
          <p className="text-base uppercase tracking-[0.3em] font-semibold text-cyan-300">Admin Center</p>
          <h1 className="mt-3 text-5xl font-black leading-tight">Điều hành MOONTUNE</h1>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-6 py-4 text-base text-red-200">{error}</div>}

      <div className="flex flex-wrap gap-3">
        {[
          ['overview', 'Tổng quan'],
          ['users', 'Thành viên'],
          ['moderation', 'Duyệt nội dung'],
          ['ads', 'Quảng cáo'],
          ['notifications', 'Thông báo'],
          ['analytics', 'Analytics'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-full px-6 py-3 text-base font-bold transition ${tab === value ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30' : 'bg-white/10 text-slate-200 hover:bg-white/15'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <div className="glass-panel rounded-3xl border border-white/10 p-8 shadow-xl hover:shadow-2xl transition"><p className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Người dùng</p><p className="mt-4 text-4xl font-black text-cyan-300">{fmtNumber(dashboard?.totalUsers)}</p></div>
          <div className="glass-panel rounded-3xl border border-white/10 p-8 shadow-xl hover:shadow-2xl transition"><p className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Bài hát</p><p className="mt-4 text-4xl font-black text-emerald-300">{fmtNumber(dashboard?.totalSongs)}</p></div>
          <div className="glass-panel rounded-3xl border border-white/10 p-8 shadow-xl hover:shadow-2xl transition"><p className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Chờ duyệt</p><p className="mt-4 text-4xl font-black text-yellow-300">{fmtNumber(dashboard?.pendingSongs)}</p></div>
          <div className="glass-panel rounded-3xl border border-white/10 p-8 shadow-xl hover:shadow-2xl transition"><p className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Bị khóa</p><p className="mt-4 text-4xl font-black text-red-300">{fmtNumber(dashboard?.blockedUsers)}</p></div>
        </section>
      )}

      {tab === 'users' && (
        <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="glass-panel rounded-3xl border border-white/10 p-6 overflow-x-auto shadow-xl">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h3 className="text-2xl font-bold">Danh sách thành viên</h3>
              <div className="flex w-full max-w-md items-center gap-3">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Tìm theo tên hoặc email..."
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300/50 focus:outline-none"
                />
                <span className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-slate-300 whitespace-nowrap">
                  {filteredUsers.length}/{users.length}
                </span>
              </div>
            </div>
            <table className="min-w-full text-base">
              <thead>
                <tr className="border-b-2 border-cyan-400/30 text-left bg-white/5">
                  <th className="px-4 py-4 font-bold text-slate-100">Tài khoản</th>
                  <th className="px-4 py-4 font-bold text-slate-100">Ngày đăng ký</th>
                  <th className="px-4 py-4 font-bold text-slate-100">Lịch sử</th>
                  <th className="px-4 py-4 font-bold text-slate-100">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((item) => (
                  <tr key={item._id} className="border-b border-white/10 align-top hover:bg-white/5 transition">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-100 text-lg">{item.username}</p>
                      <p className="text-sm text-slate-400 mt-1">{item.email}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(item.badges || []).map((badge) => (
                          <span key={badge} className="rounded-full bg-cyan-400/20 px-3 py-1 text-sm font-semibold text-cyan-200 border border-cyan-400/30">{badge}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-base text-slate-300 font-semibold">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-base text-slate-300 font-semibold">{item.history?.length || 0} bài</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => fetchUserSongs(item._id)} className="rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-semibold transition border border-white/20">Thông tin</button>
                        <button type="button" onClick={() => handleToggleAdmin(item)} className="rounded-lg bg-blue-500/20 hover:bg-blue-500/30 px-4 py-2 text-sm font-semibold text-blue-200 transition border border-blue-400/20">{item.isAdmin ? 'Gỡ ADMIN' : 'Cấp ADMIN'}</button>
                        <button type="button" onClick={() => handleToggleBlock(item)} className="rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 px-4 py-2 text-sm font-semibold text-yellow-200 transition border border-yellow-400/20">{item.isBlocked ? 'Mở TÀI KHOẢN' : 'Khóa TÀI KHOẢN'}</button>
                        <button type="button" onClick={() => handleDeleteUser(item)} className="rounded-lg bg-red-500/20 hover:bg-red-500/30 px-4 py-2 text-sm font-semibold text-red-200 transition border border-red-400/20">Xóa</button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3">
                        {BADGE_OPTIONS.map((badgeOption) => (
                          <label key={badgeOption.value} className="inline-flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white transition">
                            <input
                              type="checkbox"
                              checked={(item.badges || []).includes(badgeOption.value)}
                              onChange={(e) => handleChangeBadge(item, badgeOption.value, e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span className="font-semibold">{badgeOption.label}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-slate-400">
                      Không tìm thấy người dùng phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="glass-panel rounded-3xl border border-white/10 p-6 shadow-xl">
            <h3 className="text-2xl font-bold mb-4">Chi tiết tài khoản</h3>
            {!selectedUser && <p className="mt-4 text-base text-slate-400">Chọn một tài khoản để xem chi tiết.</p>}
            {selectedUser && (
              <div className="mt-4 space-y-5">
                <div className="border-b border-white/10 pb-4">
                  <p className="text-sm text-slate-400 uppercase tracking-wide font-semibold">Tài khoản</p>
                  <p className="text-2xl font-bold mt-2 text-cyan-300">{selectedUser.username}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 uppercase tracking-wide font-semibold mb-3">Lịch sử nghe gần đây</p>
                  <div className="space-y-2">
                    {(selectedUser.history || []).slice(0, 8).map((historySong) => (
                      <div key={historySong._id} className="rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm font-medium hover:bg-white/10 transition">{historySong.title} - {historySong.artist}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-400 uppercase tracking-wide font-semibold mb-3">Bài hát đã đăng</p>
                  <div className="space-y-2">
                    {selectedUserSongs.map((song) => (
                      <div key={song._id} className="rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm font-medium hover:bg-white/10 transition"><span>{song.title}</span> <span className="text-xs text-slate-400">({song.moderationStatus})</span></div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'moderation' && (
        <section className="glass-panel rounded-3xl border border-white/10 p-6 space-y-5 shadow-xl">
          <h3 className="text-3xl font-bold">Duyệt nhạc trước khi hiển thị</h3>
          {pendingSongs.length === 0 && <p className="text-base text-slate-400">Không có bài hát chờ duyệt.</p>}
          {pendingSongs.map((song) => (
            <div key={song._id} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition">
              <p className="font-bold text-lg text-slate-100">{song.title} - {song.artist}</p>
              <p className="text-sm text-slate-400 mt-2">Uploader: <span className="font-semibold text-slate-300">{song.uploader?.username}</span> ({song.uploader?.email})</p>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-300">Nghe thử để kiểm duyệt chất lượng âm thanh</p>
                  {previewSongId === song._id && <span className="text-sm font-bold text-cyan-300">🔊 Đang phát</span>}
                </div>
                <audio
                  controls
                  preload="none"
                  src={song.audioUrl}
                  className="w-full"
                  onPlay={() => setPreviewSongId(song._id)}
                  onPause={() => setPreviewSongId((prev) => (prev === song._id ? '' : prev))}
                  onEnded={() => setPreviewSongId((prev) => (prev === song._id ? '' : prev))}
                />
              </div>
              <div className="mt-4 flex gap-3">
                <button type="button" onClick={() => moderateSong(song._id, 'approved')} className="rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 px-5 py-2 text-base font-bold text-emerald-200 transition border border-emerald-400/20">✓ Duyệt</button>
                <button type="button" onClick={() => moderateSong(song._id, 'rejected')} className="rounded-lg bg-red-500/20 hover:bg-red-500/30 px-5 py-2 text-base font-bold text-red-200 transition border border-red-400/20">✕ Từ chối</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'ads' && (
        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <form onSubmit={handleCreateAd} className="glass-panel rounded-3xl border border-white/10 p-6 space-y-4 shadow-xl">
            <h3 className="text-2xl font-bold">Tạo quảng cáo</h3>
            <select className="w-full rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-base font-medium text-white" value={newAd.type} onChange={(e) => setNewAd((prev) => ({ ...prev, type: e.target.value }))}>
              <option value="banner">Banner</option>
              <option value="audio">Audio Ads</option>
            </select>
            <input className="w-full rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-base font-medium text-white placeholder:text-slate-400" placeholder="Tiêu đề" value={newAd.title} onChange={(e) => setNewAd((prev) => ({ ...prev, title: e.target.value }))} required />
            <input type="file" accept="image/*" onChange={handleAdImageChange} className="w-full rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-base font-medium text-white placeholder:text-slate-400 file:text-slate-100 file:bg-white/10 file:border-0 file:px-3 file:py-2 file:rounded-lg file:cursor-pointer" />
            {adImagePreview && <img src={adImagePreview} alt="preview" className="w-full rounded-lg my-2 h-32 object-cover border border-white/10" />}
            {uploadingImage && <p className="text-sm text-cyan-400 font-semibold">Đang tải lên...</p>}
            <input className="w-full rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-base font-medium text-white placeholder:text-slate-400" placeholder="Audio URL" value={newAd.audioUrl} onChange={(e) => setNewAd((prev) => ({ ...prev, audioUrl: e.target.value }))} />
            <input className="w-full rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-base font-medium text-white placeholder:text-slate-400" placeholder="Link URL" value={newAd.linkUrl} onChange={(e) => setNewAd((prev) => ({ ...prev, linkUrl: e.target.value }))} />
            <button className="rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 px-6 py-3 text-base font-black text-slate-950 hover:shadow-lg hover:shadow-cyan-500/30 transition w-full">Tạo quảng cáo</button>
          </form>

          <div className="glass-panel rounded-3xl border border-white/10 p-6 space-y-3 shadow-xl">
            <h3 className="text-2xl font-bold">Danh sách quảng cáo</h3>
            {ads.map((ad) => (
              <div key={ad._id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base hover:bg-white/10 transition">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-100">{ad.title} <span className="text-sm text-slate-400 font-normal">({ad.type})</span></p>
                  <button type="button" onClick={() => handleDeleteAd(ad._id)} className="text-sm font-bold text-red-300 hover:text-red-100 transition">Xóa</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'notifications' && (
        <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <form onSubmit={handleCreateNotification} className="glass-panel rounded-3xl border border-white/10 p-6 space-y-4 shadow-xl">
            <h3 className="text-2xl font-bold">Gửi thông báo</h3>
            <p className="text-sm text-slate-300">Thông báo sẽ được gửi đến tất cả người dùng qua chuông thông báo.</p>
            <input className="w-full rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-base font-medium text-white placeholder:text-slate-400" placeholder="Tiêu đề" value={newNotification.title} onChange={(e) => setNewNotification((prev) => ({ ...prev, title: e.target.value }))} required />
            <textarea className="w-full rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-base font-medium text-white placeholder:text-slate-400 resize-none" placeholder="Nội dung" value={newNotification.message} onChange={(e) => setNewNotification((prev) => ({ ...prev, message: e.target.value }))} required />
            <input className="w-full rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-base font-medium text-white placeholder:text-slate-400" placeholder="Link" value={newNotification.linkUrl} onChange={(e) => setNewNotification((prev) => ({ ...prev, linkUrl: e.target.value }))} />
            <button className="rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 px-6 py-3 text-base font-black text-slate-950 hover:shadow-lg hover:shadow-cyan-500/30 transition w-full">Gửi thông báo</button>
          </form>

          <div className="glass-panel rounded-3xl border border-white/10 p-6 space-y-3 shadow-xl">
            <h3 className="text-2xl font-bold">Lịch sử thông báo</h3>
            {notifications.map((item) => (
              <div key={item._id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 hover:bg-white/10 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-base text-slate-100">{item.title}</p>
                    <p className="mt-2 text-sm text-slate-300 leading-relaxed">{item.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteNotification(item._id)}
                    className="rounded-md border border-red-400/30 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/25"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'analytics' && (
        <section className="space-y-8">
          {/* Top Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-panel rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-8 shadow-xl hover:shadow-2xl transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Tổng lượt nghe</p>
                  <p className="mt-4 text-3xl font-black text-cyan-300">{fmtNumber(analytics.plays?.reduce((sum, item) => sum + (item.plays || 0), 0))}</p>
                </div>
                <div className="text-5xl opacity-20">🎵</div>
              </div>
            </div>
            <div className="glass-panel rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-8 shadow-xl hover:shadow-2xl transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-300 uppercase tracking-wide">User mới</p>
                  <p className="mt-4 text-3xl font-black text-emerald-300">{fmtNumber(analytics.growth?.reduce((sum, item) => sum + (item.count || 0), 0))}</p>
                </div>
                <div className="text-5xl opacity-20">👤</div>
              </div>
            </div>
            <div className="glass-panel rounded-3xl border border-red-400/20 bg-gradient-to-br from-red-500/10 to-red-600/5 p-8 shadow-xl hover:shadow-2xl transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Tổng lượt thích</p>
                  <p className="mt-4 text-3xl font-black text-red-300">{fmtNumber(analytics.engagement?.reduce((sum, item) => sum + (item.likes || 0), 0))}</p>
                </div>
                <div className="text-5xl opacity-20">❤️</div>
              </div>
            </div>
            <div className="glass-panel rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-8 shadow-xl hover:shadow-2xl transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Tổng bình luận</p>
                  <p className="mt-4 text-3xl font-black text-blue-300">{fmtNumber(analytics.engagement?.reduce((sum, item) => sum + (item.comments || 0), 0))}</p>
                </div>
                <div className="text-5xl opacity-20">💬</div>
              </div>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Top Plays */}
            <div className="glass-panel rounded-3xl border border-white/10 p-8 shadow-xl backdrop-blur-sm">
              <div className="mb-6 flex items-center gap-3">
                <span className="text-3xl">🎵</span>
                <div>
                  <h3 className="text-2xl font-bold text-white">Top lượt nghe</h3>
                  <p className="text-sm text-slate-400 mt-1">Bài hát được nghe nhiều nhất</p>
                </div>
              </div>
              <div className="space-y-3">
                {analytics.plays?.slice(0, 8).map((item, idx) => {
                  const maxPlays = Math.max(...(analytics.plays?.map(p => p.plays || 0) || [1]));
                  const percentage = (item.plays / maxPlays) * 100;
                  return (
                    <div key={item._id} className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <p className="text-sm font-medium text-slate-200 truncate flex-1">{idx + 1}. {item.title}</p>
                        <span className="text-cyan-300 font-bold text-lg ml-2 whitespace-nowrap">{fmtNumber(item.plays)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {(!analytics.plays || analytics.plays.length === 0) && (
                  <p className="text-slate-400 text-center py-8">Chưa có dữ liệu</p>
                )}
              </div>
            </div>

            {/* Growth */}
            <div className="glass-panel rounded-3xl border border-white/10 p-8 shadow-xl backdrop-blur-sm">
              <div className="mb-6 flex items-center gap-3">
                <span className="text-3xl">📈</span>
                <div>
                  <h3 className="text-2xl font-bold text-white">Tăng trưởng</h3>
                  <p className="text-sm text-slate-400 mt-1">Người dùng đăng ký mới</p>
                </div>
              </div>
              <div className="space-y-3">
                {analytics.growth?.slice(0, 8).map((item, idx) => {
                  const maxGrowth = Math.max(...(analytics.growth?.map(g => g.count || 0) || [1]));
                  const percentage = (item.count / maxGrowth) * 100;
                  return (
                    <div key={`${item._id?.day}-${idx}`} className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <p className="text-sm font-medium text-slate-200">
                          <span className="text-emerald-300 font-bold">{item._id?.day}/{item._id?.month}</span>
                        </p>
                        <span className="text-emerald-300 font-bold text-lg">{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {(!analytics.growth || analytics.growth.length === 0) && (
                  <p className="text-slate-400 text-center py-8">Chưa có dữ liệu</p>
                )}
              </div>
            </div>

            {/* Engagement */}
            <div className="glass-panel rounded-3xl border border-white/10 p-8 shadow-xl backdrop-blur-sm">
              <div className="mb-6 flex items-center gap-3">
                <span className="text-3xl">💬</span>
                <div>
                  <h3 className="text-2xl font-bold text-white">Tương tác</h3>
                  <p className="text-sm text-slate-400 mt-1">Thích & bình luận</p>
                </div>
              </div>
              <div className="space-y-4">
                {analytics.engagement?.slice(0, 6).map((item) => {
                  const maxEngagement = Math.max(
                    ...analytics.engagement?.map(e => Math.max(e.likes || 0, e.comments || 0)) || [1]
                  );
                  return (
                    <div key={item._id} className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition">
                      <p className="text-sm font-medium text-slate-100 truncate mb-3">{item.title}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-red-300">❤️ Thích</span>
                          <span className="font-bold text-red-300">{fmtNumber(item.likes)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-500"
                            style={{ width: `${Math.min((item.likes / maxEngagement) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs mt-3">
                          <span className="text-blue-300">💬 Bình luận</span>
                          <span className="font-bold text-blue-300">{fmtNumber(item.comments)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500"
                            style={{ width: `${Math.min((item.comments / maxEngagement) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!analytics.engagement || analytics.engagement.length === 0) && (
                  <p className="text-slate-400 text-center py-8">Chưa có dữ liệu</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Admin;

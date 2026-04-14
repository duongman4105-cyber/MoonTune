import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../utils/api';
import { DEFAULT_USER_AVATAR } from '../utils/defaults';
import {
  FaCheck,
  FaCamera,
  FaCompactDisc,
  FaHeart,
  FaHistory,
  FaLock,
  FaMusic,
  FaPlay,
  FaPlus,
  FaSave,
  FaSearch,
  FaTrash,
  FaUpload,
  FaUserEdit,
  FaUsers,
  FaUserPlus,
  FaUserTimes,
  FaTimes,
} from 'react-icons/fa';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?auto=format&fit=crop&w=1600&q=80';

const getModerationState = (song) => {
  if (song?.moderationStatus === 'pending') return 'pending';
  if (song?.moderationStatus === 'rejected') return 'rejected';
  return 'approved';
};

const StatCard = ({ label, value, accent }) => (
  <div className="group relative rounded-xl border border-white/15 bg-gradient-to-b from-[#101c42]/72 to-[#0b1536]/68 px-4 py-3 backdrop-blur-xl shadow-[0_10px_24px_rgba(5,10,30,0.2)] transition hover:border-cyan-300/30">
    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-200/75">{label}</p>
    <p className={`mt-1 text-3xl font-extrabold leading-none sm:text-[32px] ${accent}`}>{value}</p>
  </div>
);

const SocialStatCard = ({ label, value, accent, onClick, disabled, note }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`group relative rounded-xl border border-white/15 bg-gradient-to-b from-[#101c42]/72 to-[#0b1536]/68 px-4 py-3 text-left backdrop-blur-xl shadow-[0_10px_24px_rgba(5,10,30,0.2)] transition ${
      disabled ? 'cursor-not-allowed opacity-70' : 'hover:border-cyan-300/45'
    }`}
  >
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-200/75">{label}</p>
        <p className={`mt-1 text-3xl font-extrabold leading-none sm:text-[32px] ${accent}`}>{value}</p>
      </div>
      <p className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300/85">{note}</p>
    </div>
  </button>
);

const TrackItem = ({ song, index, songs, onPlay, showStatus = false, showDelete = false, onDelete }) => (
  <div className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:border-cyan-300/40 hover:bg-white/10">
    <span className="w-6 text-center text-xs font-semibold text-slate-400">{index + 1}</span>
    <Link to={`/song/${song._id}`} className="relative h-11 w-11 overflow-hidden rounded-lg border border-white/10">
      <img
        src={song.coverImage || song.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title || 'Song')}&background=1f2a44&color=fff`}
        alt={song.title}
        className="h-11 w-11 rounded-lg object-cover"
      />
    </Link>
    <div className="min-w-0 flex-1">
      <Link to={`/song/${song._id}`} className="block truncate text-sm font-semibold text-white group-hover:text-cyan-200 hover:underline">
        {song.title}
      </Link>
      <p className="truncate text-xs text-slate-400">{song.artist || 'Unknown artist'}</p>
      <Link to={`/song/${song._id}`} className="text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 hover:underline">
        Mở profile nhạc
      </Link>
    </div>
    {showStatus && (
      <span
        className={`rounded-full px-3 py-1.5 text-sm font-bold uppercase tracking-[0.08em] ${
          getModerationState(song) === 'approved'
            ? 'border border-emerald-300/40 bg-emerald-400/15 text-emerald-200'
            : getModerationState(song) === 'pending'
              ? 'border border-amber-300/40 bg-amber-400/15 text-amber-200'
              : 'border border-rose-300/40 bg-rose-400/15 text-rose-200'
        }`}
      >
        {getModerationState(song) === 'approved'
          ? 'Đã duyệt'
          : getModerationState(song) === 'pending'
            ? 'Đang duyệt'
            : 'Từ chối'}
      </span>
    )}
    <button
      onClick={() => onPlay(song, songs)}
      className="rounded-full border border-white/15 bg-white/5 p-2 text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200"
      title="Phát bài hát"
    >
      <FaPlay className="text-sm" />
    </button>
    {showDelete && (
      <button
        onClick={() => onDelete?.(song)}
        className="rounded-full border border-rose-300/35 bg-rose-500/10 p-2 text-rose-200 transition hover:border-rose-300/60 hover:bg-rose-500/20"
        title="Xóa bài hát"
      >
        <FaTrash className="text-sm" />
      </button>
    )}
  </div>
);

const Profile = () => {
  const { id: routeUserId } = useParams();
  const { user, updateUser } = useAuth();
  const { playSong } = usePlayer();

  const [profileData, setProfileData] = useState(null);
  const [mySongs, setMySongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followLoading, setFollowLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [about, setAbout] = useState('');
  const [isFollowingPrivate, setIsFollowingPrivate] = useState(false);

  const [relationshipListTitle, setRelationshipListTitle] = useState('');
  const [relationshipUsers, setRelationshipUsers] = useState([]);
  const [relationshipLoading, setRelationshipLoading] = useState(false);
  const [relationshipError, setRelationshipError] = useState('');
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [activeTab, setActiveTab] = useState('uploaded');
  const [uploadedFilter, setUploadedFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  const [albumName, setAlbumName] = useState('');
  const [selectedAlbumSongs, setSelectedAlbumSongs] = useState([]);
  const [creatingAlbum, setCreatingAlbum] = useState(false);

  const profileId = routeUserId || user?._id;
  const isOwnerProfile = !!user?._id && !!profileId && user._id === profileId;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!profileId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const authConfig = user?.token ? { headers: { token: `Bearer ${user.token}` } } : {};
        const [userRes, songsRes] = await Promise.all([
          api.get(`/api/users/${profileId}`),
          api.get(`/api/songs?uploader=${profileId}`, authConfig),
        ]);

        const fetchedSongs = songsRes.data || [];
        setProfileData(userRes.data);
        setMySongs(
          isOwnerProfile
            ? fetchedSongs
            : fetchedSongs.filter((song) => getModerationState(song) === 'approved')
        );
        setEditName(userRes.data?.username || user?.username || '');
        setAbout(userRes.data?.about || 'Music lover, beat maker, and sound explorer.');
        setIsFollowingPrivate(!!userRes.data?.isFollowingPrivate);
        setError('');
      } catch (err) {
        setError('Không thể tải dữ liệu hồ sơ.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [profileId, user?.token, user?.username, isOwnerProfile]);

  useEffect(() => {
    if (!isOwnerProfile && activeTab !== 'uploaded') {
      setActiveTab('uploaded');
    }
  }, [activeTab, isOwnerProfile]);

  const isFollowingCurrentProfile = useMemo(() => {
    if (!profileData?.followers || !user?._id || isOwnerProfile) return false;
    return profileData.followers.some((followerId) => followerId?.toString?.() === user._id || followerId === user._id);
  }, [profileData?.followers, user?._id, isOwnerProfile]);

  const handleMediaUpload = async (fieldName, file) => {
    if (!file || !user?._id) return;

    const formData = new FormData();
    formData.append(fieldName, file);

    if (fieldName === 'avatar') setUploadingAvatar(true);
    if (fieldName === 'coverImage') setUploadingCover(true);

    try {
      const res = await api.put(`/api/users/${user._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          token: `Bearer ${user.token}`,
        },
      });
      updateUser(res.data);
      setProfileData((prev) => ({ ...prev, ...res.data }));
    } catch {
      setError('Cập nhật hình ảnh thất bại.');
    } finally {
      if (fieldName === 'avatar') setUploadingAvatar(false);
      if (fieldName === 'coverImage') setUploadingCover(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || !user?._id || !isOwnerProfile) return;

    const formData = new FormData();
    formData.append('username', editName.trim());
    formData.append('about', about);
    formData.append('isFollowingPrivate', String(isFollowingPrivate));

    try {
      const res = await api.put(`/api/users/${user._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          token: `Bearer ${user.token}`,
        },
      });
      updateUser(res.data);
      setProfileData((prev) => ({ ...prev, ...res.data }));
      setIsEditing(false);
    } catch {
      setError('Cập nhật hồ sơ thất bại.');
    }
  };

  const handleToggleFollow = async () => {
    if (!user?.token || !profileId || isOwnerProfile) return;

    try {
      setFollowLoading(true);
      const res = await api.put(
        `/api/users/${profileId}/follow`,
        {},
        { headers: { token: `Bearer ${user.token}` } }
      );

      const shouldFollow = !!res.data?.following;
      setProfileData((prev) => {
        if (!prev) return prev;
        const followers = Array.isArray(prev.followers) ? [...prev.followers] : [];
        const alreadyFollowed = followers.some((followerId) => followerId?.toString?.() === user._id || followerId === user._id);

        if (shouldFollow && !alreadyFollowed) {
          followers.push(user._id);
        }

        if (!shouldFollow && alreadyFollowed) {
          return {
            ...prev,
            followers: followers.filter((followerId) => followerId?.toString?.() !== user._id && followerId !== user._id),
          };
        }

        return { ...prev, followers };
      });
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data || 'Không thể cập nhật trạng thái theo dõi.');
    } finally {
      setFollowLoading(false);
    }
  };

  const openRelationshipModal = async (type) => {
    if (!user?.token || !profileId) return;

    setShowRelationshipModal(true);
    setRelationshipUsers([]);
    setRelationshipError('');
    setRelationshipLoading(true);
    setRelationshipListTitle(type === 'followers' ? 'Người theo dõi' : 'Đang theo dõi');

    try {
      const res = await api.get(`/api/users/${profileId}/${type}`, {
        headers: { token: `Bearer ${user.token}` },
      });
      setRelationshipUsers(res.data?.users || []);
      setRelationshipError('');
    } catch (err) {
      setRelationshipError(err?.response?.data?.message || err?.response?.data || 'Không thể tải danh sách.');
    } finally {
      setRelationshipLoading(false);
    }
  };

  const availableAlbumSongs = useMemo(() => {
    const map = new Map();
    [...mySongs, ...(profileData?.likedSongs || [])].forEach((song) => {
      if (song?._id && !map.has(song._id)) map.set(song._id, song);
    });
    return Array.from(map.values());
  }, [mySongs, profileData?.likedSongs]);

  const handleToggleAlbumSong = (songId) => {
    setSelectedAlbumSongs((prev) => (
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    ));
  };

  const handleCreateAlbum = async () => {
    if (!albumName.trim() || selectedAlbumSongs.length === 0 || !user?._id) return;

    setCreatingAlbum(true);
    try {
      const res = await api.post(
        `/api/users/${user._id}/albums`,
        { name: albumName.trim(), songIds: selectedAlbumSongs },
        { headers: { token: `Bearer ${user.token}` } }
      );
      setProfileData(res.data);
      setAlbumName('');
      setSelectedAlbumSongs([]);
      setActiveTab('albums');
    } catch (err) {
      setError(err?.response?.data?.message || 'Tạo album thất bại.');
    } finally {
      setCreatingAlbum(false);
    }
  };

  const handleDeleteSong = async (song) => {
    if (!song?._id || !user?.token || !isOwnerProfile) return;

    const shouldDelete = window.confirm(`Bạn có chắc muốn xóa bài "${song.title}" không?`);
    if (!shouldDelete) return;

    try {
      await api.delete(`/api/songs/${song._id}`, {
        headers: { token: `Bearer ${user.token}` },
      });

      setMySongs((prev) => prev.filter((item) => item._id !== song._id));
      setProfileData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          likedSongs: (prev.likedSongs || []).filter((item) => item?._id !== song._id),
          history: (prev.history || []).filter((item) => item?._id !== song._id),
          albums: (prev.albums || []).map((album) => ({
            ...album,
            songIds: (album.songIds || []).filter((item) => item?._id !== song._id),
          })),
        };
      });
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data || 'Không thể xóa bài hát.');
    }
  };

  const stats = useMemo(() => ({
    uploaded: mySongs.length,
    liked: profileData?.likedSongs?.length || 0,
    history: profileData?.history?.length || 0,
    albums: profileData?.albums?.length || 0,
    followers: profileData?.followers?.length || 0,
    following: profileData?.following?.length || 0,
  }), [
    mySongs.length,
    profileData?.likedSongs?.length,
    profileData?.history?.length,
    profileData?.albums?.length,
    profileData?.followers?.length,
    profileData?.following?.length,
  ]);

  const tabData = useMemo(() => ({
    uploaded: mySongs,
    liked: profileData?.likedSongs || [],
    history: profileData?.history || [],
  }), [mySongs, profileData?.likedSongs, profileData?.history]);

  const visibleSongs = useMemo(() => {
    let source = tabData[activeTab] || [];

    if (activeTab === 'uploaded') {
      source = source.filter((song) => {
        const state = getModerationState(song);
        if (uploadedFilter === 'approved') return state === 'approved';
        if (uploadedFilter === 'pending') return state === 'pending';
        if (uploadedFilter === 'rejected') return state === 'rejected';
        return true;
      });
    }

    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return source;
    return source.filter((song) => {
      const title = (song?.title || '').toLowerCase();
      const artist = (song?.artist || '').toLowerCase();
      return title.includes(keyword) || artist.includes(keyword);
    });
  }, [activeTab, searchText, tabData, uploadedFilter]);

  const uploadedStats = useMemo(() => ({
    all: mySongs.length,
    approved: mySongs.filter((song) => getModerationState(song) === 'approved').length,
    pending: mySongs.filter((song) => getModerationState(song) === 'pending').length,
    rejected: mySongs.filter((song) => getModerationState(song) === 'rejected').length,
  }), [mySongs]);

  const tabMeta = isOwnerProfile
    ? {
      uploaded: { label: 'Bài nhạc đã đăng', icon: <FaUpload />, count: stats.uploaded },
      history: { label: 'Lịch sử nghe', icon: <FaHistory />, count: stats.history },
      liked: { label: 'Nhạc đã thích', icon: <FaHeart />, count: stats.liked },
      albums: { label: 'Album', icon: <FaCompactDisc />, count: stats.albums },
    }
    : {
      uploaded: { label: 'Bài nhạc đã đăng', icon: <FaUpload />, count: stats.uploaded },
    };

  if (!user) {
    return <div className="py-16 text-center text-slate-300">Vui lòng đăng nhập để xem hồ sơ.</div>;
  }

  if (loading) {
    return <div className="py-16 text-center text-slate-300">Đang tải hồ sơ...</div>;
  }

  const profileAvatar = profileData?.avatar || user?.avatar || DEFAULT_USER_AVATAR;
  const profileCover = profileData?.coverImage || DEFAULT_COVER;

  return (
    <div className="space-y-6 text-white">
      <section className="glass-panel relative overflow-hidden rounded-3xl border border-white/10 p-0">
        <div className="relative h-56 sm:h-72">
          <img src={profileCover} alt="cover" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1020] via-[#0b1020]/50 to-[#0b1020]/15" />
          {isOwnerProfile && (
            <label className="absolute right-4 top-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/35 bg-black/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white">
              <FaCamera /> {uploadingCover ? 'Đang tải...' : 'Đổi ảnh bìa'}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleMediaUpload('coverImage', e.target.files?.[0])}
              />
            </label>
          )}
        </div>

        <div className="relative z-10 -mt-16 px-6 pb-6 sm:px-8">
          <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-[#0d1a3d]/82 via-[#0a1533]/78 to-[#0a1430]/76 p-5 backdrop-blur-xl shadow-[0_20px_60px_rgba(8,14,36,0.3)] sm:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
              <div className="group relative h-24 w-24 sm:h-32 sm:w-32">
                <img src={profileAvatar} alt="avatar" className="h-full w-full rounded-3xl border-2 border-white/35 object-cover shadow-[0_14px_30px_rgba(2,8,26,0.35)]" />
                {isOwnerProfile && (
                  <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-3xl bg-black/50 opacity-0 transition group-hover:opacity-100">
                    <span className="text-center text-sm font-bold uppercase tracking-[0.08em]">
                      <FaCamera className="mx-auto mb-1" />
                      {uploadingAvatar ? 'Đang tải...' : 'Đổi AVT'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleMediaUpload('avatar', e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>

              <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-white/35 bg-black/35 px-4 py-2 text-2xl font-black text-white outline-none"
                />
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="min-h-[96px] w-full rounded-xl border border-white/35 bg-black/35 px-4 py-3 text-sm text-slate-100 outline-none"
                />
                <label className="inline-flex items-start gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={isFollowingPrivate}
                    onChange={(e) => setIsFollowingPrivate(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-white/30 bg-transparent"
                  />
                  <span>
                    <span className="block font-semibold text-white">Để riêng tư danh sách đang theo dõi</span>
                    <span className="text-xs text-slate-200/80">
                      Khi bật, người khác vẫn thấy số lượng đang theo dõi nhưng không mở được danh sách.
                    </span>
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleSaveProfile} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-2 text-sm font-bold text-slate-900">
                    <FaSave /> Lưu
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(profileData?.username || user.username || '');
                      setAbout(profileData?.about || '');
                    }}
                    className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-slate-200"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm uppercase tracking-[0.14em] text-cyan-300">MOONTUNE PROFILE</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black sm:text-4xl">{profileData?.username || user.username}</h1>
                  {isOwnerProfile ? (
                    <>
                      <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-cyan-100">
                        <FaUserEdit /> Chỉnh sửa
                      </button>
                      <Link to="/upload" className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-cyan-100">
                        <FaUpload /> Tải nhạc mới
                      </Link>
                    </>
                  ) : (
                    <button
                      onClick={handleToggleFollow}
                      disabled={followLoading}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] ${
                        isFollowingCurrentProfile
                          ? 'border border-emerald-300/35 bg-emerald-400/15 text-emerald-100'
                          : 'border border-cyan-300/35 bg-cyan-300/15 text-cyan-100'
                      }`}
                    >
                      {followLoading ? (
                        'Đang xử lý...'
                      ) : isFollowingCurrentProfile ? (
                        <><FaUserTimes /> Bỏ theo dõi</>
                      ) : (
                        <><FaUserPlus /> Theo dõi</>
                      )}
                    </button>
                  )}
                </div>
                <p className="mt-3 max-w-3xl text-base text-slate-100/90 sm:text-lg">
                  {profileData?.about || about || 'Music lover, beat maker, and sound explorer.'}
                </p>
              </>
            )}
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Đã đăng" value={stats.uploaded} accent="text-cyan-300" />
                <StatCard label="Đã thích" value={stats.liked} accent="text-rose-300" />
                <StatCard label="Lịch sử" value={stats.history} accent="text-amber-300" />
                <StatCard label="Album" value={stats.albums} accent="text-violet-300" />
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <SocialStatCard
                  label="Followers"
                  value={stats.followers}
                  accent="text-emerald-300"
                  note="Bấm để xem"
                  onClick={() => openRelationshipModal('followers')}
                />
                <SocialStatCard
                  label="Đang theo dõi"
                  value={stats.following}
                  accent="text-sky-300"
                  note={profileData?.isFollowingPrivate && !isOwnerProfile ? 'Riêng tư' : 'Bấm để xem'}
                  onClick={() => openRelationshipModal('following')}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">{error}</div>}

      <section className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(tabMeta).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                  activeTab === key
                    ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-900'
                    : 'border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {meta.icon}
                {meta.label}
                <span className={`rounded-full px-2 py-0.5 text-sm ${activeTab === key ? 'bg-black/20 text-slate-100' : 'bg-white/10 text-cyan-200'}`}>
                  {meta.count}
                </span>
              </button>
            ))}
          </div>

          {activeTab !== 'albums' && (
            <label className="flex w-full max-w-xs items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-300">
              <FaSearch className="text-slate-400" />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Tìm bài hát..."
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
              />
            </label>
          )}
        </div>

        {activeTab === 'uploaded' && isOwnerProfile && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {[
              ['all', `Tất cả (${uploadedStats.all})`],
              ['approved', `Đã duyệt (${uploadedStats.approved})`],
              ['pending', `Đang duyệt (${uploadedStats.pending})`],
              ['rejected', `Từ chối (${uploadedStats.rejected})`],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setUploadedFilter(value)}
                className={`rounded-full px-3 py-1.5 text-sm font-bold uppercase tracking-[0.08em] transition ${
                  uploadedFilter === value
                    ? 'bg-cyan-400 text-slate-900'
                    : 'border border-white/20 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'albums' ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-lg font-bold text-white">Tạo album mới</h3>
              <p className="mt-1 text-sm text-slate-400">Chọn bài từ Nhạc đã thích và Bài nhạc đã đăng để đưa vào album.</p>

              <div className="mt-4 grid gap-4 lg:grid-cols-[280px_1fr]">
                <div className="space-y-3">
                  <input
                    value={albumName}
                    onChange={(e) => setAlbumName(e.target.value)}
                    placeholder="Tên album..."
                    className="w-full rounded-xl border border-white/15 bg-[#0d1730]/90 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                  <button
                    onClick={handleCreateAlbum}
                    disabled={creatingAlbum || !albumName.trim() || selectedAlbumSongs.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-bold text-slate-900 disabled:opacity-60"
                  >
                    <FaPlus /> {creatingAlbum ? 'Đang tạo...' : 'Tạo album'}
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#0b1228]/70 p-3">
                  {availableAlbumSongs.length === 0 ? (
                    <p className="text-sm text-slate-400">Chưa có bài để thêm vào album.</p>
                  ) : (
                    <div className="space-y-2">
                      {availableAlbumSongs.map((song) => (
                        <label key={song._id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedAlbumSongs.includes(song._id)}
                            onChange={() => handleToggleAlbumSong(song._id)}
                            className="h-4 w-4 rounded border-white/30 bg-transparent"
                          />
                          <img
                            src={song.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title || 'Song')}&background=1f2a44&color=fff`}
                            alt={song.title}
                            className="h-9 w-9 rounded object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{song.title}</p>
                            <p className="truncate text-xs text-slate-400">{song.artist || 'Unknown artist'}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {(profileData?.albums || []).length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-slate-400">
                  Bạn chưa tạo album nào.
                </div>
              ) : (
                (profileData?.albums || []).map((album) => (
                  <div key={album._id || album.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="text-lg font-bold text-white">{album.name}</h4>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                        {(album.songIds || []).length} bài
                      </span>
                    </div>
                    <div className="space-y-2">
                      {(album.songIds || []).slice(0, 6).map((song, idx) => (
                        <TrackItem key={song._id || `${album.name}-${idx}`} song={song} index={idx} songs={album.songIds || []} onPlay={playSong} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : visibleSongs.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-10 text-center">
            <FaCompactDisc className="mx-auto text-2xl text-slate-500" />
            <p className="mt-3 text-sm text-slate-400">Chưa có dữ liệu phù hợp trong mục này.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleSongs.map((song, index) => (
              <TrackItem
                key={song._id}
                song={song}
                index={index}
                songs={visibleSongs}
                onPlay={playSong}
                showStatus={activeTab === 'uploaded' && isOwnerProfile}
                showDelete={isOwnerProfile && activeTab === 'uploaded'}
                onDelete={handleDeleteSong}
              />
            ))}
          </div>
        )}
      </section>

      <div className="pb-4 text-center text-xs text-slate-500">
        <FaMusic className="mr-1 inline" /> MOONTUNE Profile
      </div>

      {showRelationshipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b1329] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="inline-flex items-center gap-2 text-xl font-black text-white">
                <FaUsers className="text-cyan-300" /> {relationshipListTitle}
              </h3>
              <button
                type="button"
                onClick={() => setShowRelationshipModal(false)}
                className="rounded-full border border-white/20 bg-white/10 p-2 text-slate-200 hover:bg-white/20"
              >
                <FaTimes />
              </button>
            </div>

            {relationshipLoading ? (
              <p className="py-8 text-center text-slate-300">Đang tải danh sách...</p>
            ) : relationshipError ? (
              <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-amber-200">
                <p className="inline-flex items-center gap-2 font-semibold">
                  <FaLock /> {relationshipError}
                </p>
              </div>
            ) : relationshipUsers.length === 0 ? (
              <p className="py-8 text-center text-slate-400">Danh sách trống.</p>
            ) : (
              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {relationshipUsers.map((item) => (
                  <Link
                    key={item._id}
                    to={`/profile/${item._id}`}
                    onClick={() => setShowRelationshipModal(false)}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition hover:border-cyan-300/45 hover:bg-white/10"
                  >
                    <img
                      src={item.avatar || DEFAULT_USER_AVATAR}
                      alt={item.username}
                      className="h-11 w-11 rounded-full border border-white/20 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{item.username}</p>
                      <p className="text-xs text-slate-400">Xem hồ sơ</p>
                    </div>
                    <FaCheck className="text-emerald-300" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

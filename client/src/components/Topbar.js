import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HiOutlineSearch, HiOutlineBell, HiOutlineMenu } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../utils/api';
import { DEFAULT_USER_AVATAR } from '../utils/defaults';

const Topbar = ({ onToggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const authToken = user?.token || user?.accessToken;
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [openNotifications, setOpenNotifications] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [songSuggestions, setSongSuggestions] = useState([]);
    const [userSuggestions, setUserSuggestions] = useState([]);
    const notificationRef = useRef(null);
    const searchRef = useRef(null);

    const fetchNotifications = useCallback(async () => {
        if (!user?._id) return;
        try {
            const res = await axios.get(`${API_URL}/api/users/${user._id}/notifications`, {
                headers: { token: `Bearer ${authToken}` },
            });
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (err) {
            console.error(err);
        }
    }, [user?._id, authToken]);

    const markAllRead = async () => {
        if (!user?._id) return;
        try {
            await axios.put(
                `${API_URL}/api/users/${user._id}/notifications/read-all`,
                {},
                {
                    headers: { token: `Bearer ${authToken}` },
                }
            );
            setUnreadCount(0);
            setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (!user?._id) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 30000);
        return () => clearInterval(intervalId);
    }, [user?._id, fetchNotifications]);

    useEffect(() => {
        if (!user?._id) return;

        const handleNotificationRefresh = () => {
            fetchNotifications();
        };

        window.addEventListener('moontune:notifications-updated', handleNotificationRefresh);
        return () => window.removeEventListener('moontune:notifications-updated', handleNotificationRefresh);
    }, [user?._id, fetchNotifications]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setOpenNotifications(false);
            }

            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const keyword = searchText.trim();
        if (!keyword) {
            setSongSuggestions([]);
            setUserSuggestions([]);
            setSearching(false);
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                setSearching(true);
                const [songRes, userRes] = await Promise.all([
                    axios.get(`${API_URL}/api/songs?q=${encodeURIComponent(keyword)}`),
                    axios.get(`${API_URL}/api/users/search?q=${encodeURIComponent(keyword)}`),
                ]);

                setSongSuggestions((songRes.data || []).slice(0, 6));
                setUserSuggestions((userRes.data?.users || []).slice(0, 6));
            } catch (err) {
                console.error(err);
                setSongSuggestions([]);
                setUserSuggestions([]);
            } finally {
                setSearching(false);
            }
        }, 250);

        return () => clearTimeout(timeoutId);
    }, [searchText]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const keyword = searchText.trim();
        if (!keyword) return;

        navigate(`/?q=${encodeURIComponent(keyword)}`);
        setSearchOpen(false);
    };

    const handleOpenSong = (songId) => {
        navigate(`/song/${songId}`);
        setSearchOpen(false);
        setSearchText('');
    };

    const handleOpenUser = (userId) => {
        navigate(`/profile/${userId}`);
        setSearchOpen(false);
        setSearchText('');
    };

    return (
        <header className="fixed left-0 right-0 top-0 z-30 border-b border-blue-400/20 bg-[#0e1430]/75 backdrop-blur-xl lg:left-[280px]">
            <div className="flex h-20 items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 lg:px-10">
                <button
                    onClick={onToggleSidebar}
                    className="lg:hidden flex-shrink-0 rounded-lg border border-blue-300/20 bg-white/5 p-2.5 text-slate-300 transition hover:text-cyan-200"
                    title="Toggle menu"
                >
                    <HiOutlineMenu className="text-2xl" />
                </button>

                <div className="search-led w-full max-w-sm sm:max-w-2xl">
                    <form onSubmit={handleSearchSubmit} className="relative" ref={searchRef}>
                        <HiOutlineSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-300 text-xl" />
                        <input
                            type="text"
                            value={searchText}
                            onChange={(e) => {
                                setSearchText(e.target.value);
                                setSearchOpen(true);
                            }}
                            onFocus={() => setSearchOpen(true)}
                            placeholder="Tìm bài hát hoặc người dùng..."
                            className="search-led-input w-full rounded-full py-2.5 pl-12 pr-11 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                        />
                        <span className="absolute right-4 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_16px_#21d4fd]" />

                        {searchOpen && searchText.trim() && (
                            <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-40 max-h-[420px] overflow-y-auto rounded-2xl border border-white/15 bg-[#0e1734]/95 p-3 shadow-[0_26px_60px_rgba(3,8,25,0.5)] backdrop-blur-xl">
                                {searching ? (
                                    <p className="py-4 text-center text-sm text-slate-300">Đang tìm kiếm...</p>
                                ) : (
                                    <>
                                        <div>
                                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Bài hát</p>
                                            {songSuggestions.length === 0 ? (
                                                <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400">Không có bài hát phù hợp.</p>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    {songSuggestions.map((song) => (
                                                        <button
                                                            key={song._id}
                                                            onClick={() => handleOpenSong(song._id)}
                                                            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:border-cyan-300/40 hover:bg-white/10"
                                                        >
                                                            <img
                                                                src={song.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title || 'Song')}&background=1f2a44&color=fff`}
                                                                alt={song.title}
                                                                className="h-10 w-10 rounded-lg border border-white/15 object-cover"
                                                            />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-semibold text-white">{song.title}</p>
                                                                <p className="truncate text-xs text-slate-400">{song.artist || 'Unknown artist'}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-3 border-t border-white/10 pt-3">
                                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-violet-200">Người dùng</p>
                                            {userSuggestions.length === 0 ? (
                                                <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400">Không có user phù hợp.</p>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    {userSuggestions.map((item) => (
                                                        <button
                                                            key={item._id}
                                                            onClick={() => handleOpenUser(item._id)}
                                                            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:border-violet-300/45 hover:bg-white/10"
                                                        >
                                                            <img
                                                                src={item.avatar || DEFAULT_USER_AVATAR}
                                                                alt={item.username}
                                                                className="h-10 w-10 rounded-full border border-white/20 object-cover"
                                                            />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-semibold text-white">{item.username}</p>
                                                                <p className="truncate text-xs text-slate-400">{item.followerCount || 0} followers</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </form>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                    {user && (
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setOpenNotifications((prev) => !prev)}
                                className="relative rounded-full border border-blue-300/20 bg-white/5 p-2.5 text-slate-300 transition hover:text-cyan-200"
                            >
                                <HiOutlineBell className="text-xl" />
                                {unreadCount > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {openNotifications && (
                                <div className="absolute right-0 mt-2 w-[320px] overflow-hidden rounded-xl border border-blue-300/25 bg-[#121b36]/95 shadow-xl">
                                    <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                                        <span className="text-sm font-semibold text-slate-100">Thông báo</span>
                                        <button
                                            onClick={markAllRead}
                                            className="text-xs text-cyan-300 hover:text-cyan-200"
                                        >
                                            Đánh dấu đã đọc
                                        </button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <p className="px-3 py-4 text-sm text-slate-400">Chưa có thông báo mới.</p>
                                        ) : (
                                            notifications.map((item) => (
                                                <Link
                                                    key={item._id}
                                                    to={item.linkUrl || '/'}
                                                    onClick={() => setOpenNotifications(false)}
                                                    className={`block border-b border-white/5 px-3 py-3 transition hover:bg-white/5 ${!item.isRead ? 'bg-cyan-900/20' : ''}`}
                                                >
                                                    <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                                                    <p className="mt-1 line-clamp-2 text-xs text-slate-300">{item.message}</p>
                                                    <p className="mt-1 text-[11px] text-slate-500">{new Date(item.createdAt).toLocaleString('vi-VN')}</p>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {user ? (
                        <div className="relative group flex-shrink-0">
                            <Link to="/profile" className="flex items-center gap-2 rounded-full border border-violet-300/30 bg-white/5 px-2 py-1.5 pr-3 text-sm text-slate-100 transition hover:border-cyan-300/50 whitespace-nowrap">
                                <img
                                    src={user.avatar || DEFAULT_USER_AVATAR}
                                    alt="User Avatar"
                                    className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                                />
                                <span className="hidden max-w-[100px] truncate sm:block">{user.username}</span>
                            </Link>
                            <div className="invisible absolute right-0 mt-2 w-48 rounded-xl border border-blue-300/25 bg-[#121b36]/95 py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                                <Link to="/profile" className="block px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Trang cá nhân</Link>
                                <Link to="/upload" className="block px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Tải nhạc</Link>
                                {user?.isAdmin && <Link to="/admin" className="block px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Quản trị</Link>}
                                <button onClick={logout} className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/5">
                                    Đăng xuất
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Link to="/login" className="rounded-full border border-blue-300/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-slate-200 hover:border-cyan-300/50 whitespace-nowrap">
                                Đăng nhập
                            </Link>
                            <Link to="/register" className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-slate-900 shadow-lg shadow-cyan-900/50 whitespace-nowrap">
                                Đăng ký
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Topbar;

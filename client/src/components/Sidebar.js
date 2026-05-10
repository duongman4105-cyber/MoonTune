import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    HiHome, HiOutlineMusicNote, HiOutlineHeart, 
    HiOutlineUpload, HiOutlineUser, HiOutlineShieldCheck, HiOutlineX
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../utils/api';
import { APP_LOGO_URL, DEFAULT_USER_AVATAR } from '../utils/defaults';

const Sidebar = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { playSong } = usePlayer();
    const location = useLocation();
    const navigate = useNavigate();
    const sidebarRef = useRef(null);
    const [likedSongs, setLikedSongs] = useState([]);

    const menuItems = [
        { name: 'Home', icon: <HiHome />, path: '/' },
        { name: 'Upload', icon: <HiOutlineUpload />, path: '/upload' },
        { name: 'Profile', icon: <HiOutlineUser />, path: '/profile' },
        { name: 'Gần đây', icon: <HiOutlineMusicNote />, path: '/recent' },
    ];

    if (user?.isAdmin) {
        menuItems.push({ name: 'Admin', icon: <HiOutlineShieldCheck />, path: '/admin' });
    }

    const NavItem = ({ item }) => (
        <button
            type="button"
            onClick={() => {
                navigate(item.path);
                onClose();
            }}
            data-sidebar-nav="true"
            data-sidebar-path={item.path}
            className={`relative z-[10000] flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                item.path === '/'
                    ? location.pathname === '/'
                        ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-[#0c1636] shadow-lg shadow-cyan-900/40'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    : location.pathname === item.path
                        ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-[#0c1636] shadow-lg shadow-cyan-900/40'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
        >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium tracking-wide">{item.name}</span>
        </button>
    );

    useEffect(() => {
        const fetchLikedSongs = async () => {
            if (!user?._id) {
                setLikedSongs([]);
                return;
            }

            try {
                const res = await api.get(`/api/users/${user._id}`);
                setLikedSongs(res.data?.likedSongs || []);
            } catch (err) {
                console.error('Failed to fetch liked songs:', err);
            }
        };

        fetchLikedSongs();
    }, [user?._id, user?.likedSongs?.length]);

    useEffect(() => {
        const handlePointerDown = (event) => {
            if (!sidebarRef.current) return;

            const sidebarRect = sidebarRef.current.getBoundingClientRect();
            const isInsideSidebar =
                event.clientX >= sidebarRect.left &&
                event.clientX <= sidebarRect.right &&
                event.clientY >= sidebarRect.top &&
                event.clientY <= sidebarRect.bottom;

            if (!isInsideSidebar) return;

            const elements = document.elementsFromPoint(event.clientX, event.clientY);
            const navElement = elements.find((element) => element?.dataset?.sidebarPath);

            if (!navElement?.dataset?.sidebarPath) return;

            const targetPath = navElement.dataset.sidebarPath;
            if (targetPath && targetPath !== location.pathname) {
                event.preventDefault();
                event.stopPropagation();
                navigate(targetPath);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown, true);
        return () => document.removeEventListener('pointerdown', handlePointerDown, true);
    }, [location.pathname, navigate]);

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[9998] bg-black/40 lg:hidden"
                    onClick={onClose}
                />
            )}
            <aside 
                ref={sidebarRef} 
                className={`glass-panel pointer-events-auto fixed inset-y-0 left-0 z-[9999] w-[280px] flex-col px-5 pb-6 pt-5 isolate transition-all duration-300 lg:flex hidden lg:translate-x-0 ${
                    isOpen ? 'translate-x-0 flex' : '-translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between mb-4">
                    <div></div>
                    <button
                        onClick={onClose}
                        className="lg:hidden flex-shrink-0 rounded-lg border border-blue-300/20 bg-white/5 p-2 text-slate-300 transition hover:text-cyan-200"
                        title="Close menu"
                    >
                        <HiOutlineX className="text-xl" />
                    </button>
                </div>

                <Link to="/" className="mb-6 flex items-center gap-3 rounded-2xl border border-violet-300/20 bg-white/5 p-3">
                <img
                    src={APP_LOGO_URL}
                    alt="MOONTUNE logo"
                    className="h-11 w-11 rounded-xl object-cover shadow-lg shadow-cyan-900/50"
                />
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Neon</p>
                    <h1 className="text-xl font-bold text-white">MOONTUNE</h1>
                </div>
            </Link>

            <div className="mb-7 rounded-2xl border border-blue-300/20 bg-[#151e3a]/70 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Tài khoản</p>
                <div className="mt-3 flex items-center gap-3">
                    <img
                        src={user?.avatar || DEFAULT_USER_AVATAR}
                        alt="avatar"
                        className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{user?.username || 'Guest'}</p>
                        <p className="truncate text-xs text-slate-400">{user ? 'Music explorer' : 'Chưa đăng nhập'}</p>
                    </div>
                </div>
            </div>

            <div>
                <p className="mb-3 px-1 text-xs uppercase tracking-[0.18em] text-slate-400">Khám phá</p>
                <nav className="space-y-2">
                    {menuItems.map(item => <NavItem key={item.name} item={item} />)}
                </nav>
            </div>

            <div className="mt-6 flex-grow">
                <p className="mb-3 px-1 text-xs uppercase tracking-[0.18em] text-slate-400">Bộ sưu tập</p>
                <div className="space-y-2 rounded-2xl border border-blue-300/20 bg-[#131a34]/70 p-3 text-sm text-slate-300">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                        <HiOutlineHeart className="text-cyan-300" />
                        <span>Liked Songs</span>
                                            </div>
                                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-cyan-200">{likedSongs.length}</span>
                    </div>

                                        {user ? (
                                            likedSongs.length > 0 ? (
                                                <div className="max-h-52 space-y-1.5 overflow-y-auto rounded-lg bg-white/5 px-2 py-1.5">
                                                    {likedSongs.slice(0, 5).map((song) => (
                                                        <button
                                                            key={song._id}
                                                            onClick={() => playSong(song, likedSongs)}
                                                            className="flex w-full items-center gap-2.5 rounded px-1.5 py-1.5 text-left text-xs text-slate-300 hover:bg-white/10 hover:text-white"
                                                            title={`${song.title} - ${song.artist}`}
                                                        >
                                                            <img
                                                                src={song.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title || 'Song')}&background=1f2a44&color=fff`}
                                                                alt={song.title}
                                                                className="h-8 w-8 flex-shrink-0 rounded object-cover"
                                                            />
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block truncate text-xs font-semibold text-white">{song.title}</span>
                                                                <span className="block truncate text-[11px] text-slate-400">{song.artist || 'Unknown artist'}</span>
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="rounded-lg bg-white/5 px-2 py-1.5 text-xs text-slate-400">Bạn chưa tim bài hát nào</div>
                                            )
                                        ) : (
                                            <div className="rounded-lg bg-white/5 px-2 py-1.5 text-xs text-slate-400">Đăng nhập để lưu Liked Songs</div>
                                        )}

                                        <Link
                                            to="/profile"
                                            className="inline-block rounded-md px-2 py-1 text-xs text-cyan-300 hover:bg-white/5 hover:text-cyan-200"
                                        >
                                            Mở danh sách đã tim
                                        </Link>
                </div>
            </div>

            <div className="rounded-2xl border border-cyan-300/30 bg-gradient-to-br from-cyan-400/20 to-violet-500/25 p-4 text-center">
                <p className="text-sm text-slate-200">Nâng cấp tài khoản để mở toàn bộ hiệu ứng visualizer.</p>
                <button className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#15214a] transition hover:bg-cyan-100">
                    Xem gói Premium
                </button>
            </div>
            </aside>
        </>
    );
};

export default Sidebar;

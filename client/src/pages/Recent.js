import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaHistory, FaMusic } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../utils/api';

const Recent = () => {
  const { user } = useAuth();
  const { playSong, setSongList } = usePlayer();
  const [recentSongs, setRecentSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecentSongs = async () => {
      if (!user?._id) {
        setRecentSongs([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/api/users/${user._id}/history`, {
          headers: { token: `Bearer ${user.token}` },
        });
        const history = res.data || [];
        setRecentSongs(history);
        setSongList(history);
      } catch (err) {
        console.error('Failed to fetch listening history:', err);
        setError('Không thể tải mục Gần đây. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    const handleHistoryUpdated = () => {
      fetchRecentSongs();
    };

    fetchRecentSongs();
    window.addEventListener('moontune:history-updated', handleHistoryUpdated);

    return () => {
      window.removeEventListener('moontune:history-updated', handleHistoryUpdated);
    };
  }, [user?._id, user?.token, setSongList]);

  if (!user) {
    return (
      <div className="py-14 text-center">
        <FaHistory className="mx-auto mb-4 text-4xl text-slate-500" />
        <h2 className="text-2xl font-bold text-white">Mục Gần đây</h2>
        <p className="mt-2 text-slate-400">Đăng nhập để xem lịch sử nghe nhạc của bạn.</p>
        <Link
          to="/login"
          className="mt-5 inline-block rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-2.5 font-bold text-slate-900"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  if (loading) return <div className="py-10 text-slate-300">Đang tải bài hát gần đây...</div>;
  if (error) return <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-300">{error}</div>;

  return (
    <div className="text-white">
      <div className="mb-6 flex items-center gap-3">
        <FaHistory className="text-cyan-300" />
        <h1 className="text-3xl font-black">Gần đây</h1>
      </div>

      {recentSongs.length === 0 ? (
        <div className="rounded-2xl border border-blue-300/20 bg-slate-800/30 p-10 text-center">
          <FaMusic className="mx-auto mb-4 text-3xl text-slate-500" />
          <p className="text-slate-400">Bạn chưa có lịch sử nghe nào.</p>
          <p className="mt-2 text-sm text-slate-500">Hãy phát vài bài nhạc để danh sách này xuất hiện.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentSongs.map((song, index) => (
            <div
              key={`${song._id}-${index}`}
              className="group flex items-center gap-4 rounded-xl border border-blue-300/10 bg-gradient-to-r from-slate-800/50 to-slate-900/50 p-3"
            >
              <div className="w-6 text-center font-mono text-sm text-slate-400">{index + 1}</div>
              <button
                onClick={() => playSong(song, recentSongs)}
                className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded border border-cyan-300/20"
              >
                <img
                  src={song.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title || 'Song')}&background=1f2a44&color=fff`}
                  alt={song.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition group-hover:opacity-100">
                  <FaPlay size={14} className="text-white" />
                </div>
              </button>

              <div className="min-w-0 flex-1">
                <Link to={`/song/${song._id}`} className="block truncate font-semibold text-white hover:text-cyan-300">
                  {song.title}
                </Link>
                <p className="truncate text-sm text-slate-400">{song.artist}</p>
              </div>

              <div className="hidden text-sm text-slate-400 md:block">{song.plays || 0} lượt nghe</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recent;

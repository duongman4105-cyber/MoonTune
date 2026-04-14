import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { DEFAULT_USER_AVATAR } from '../utils/defaults';
import { 
    FaPlay, FaHeart, FaRetweet, FaShareSquare, FaEllipsisH, 
    FaCommentAlt, FaTrash, FaEdit, FaReply 
} from 'react-icons/fa';

const SongDetail = () => {
  const { id } = useParams();
    const location = useLocation();
  const [song, setSong] = useState(null);
    const [fetchError, setFetchError] = useState('');
        const { currentSong } = usePlayer();
  
  const { user, updateUser } = useAuth();
  const [commentText, setCommentText] = useState("");

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState("");
  const [replyingCommentId, setReplyingCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const [dominantColor, setDominantColor] = useState('rgb(50, 50, 50)');
  const [waveforms, setWaveforms] = useState([]);
    const [liveCurrentTime, setLiveCurrentTime] = useState(0);
    const [liveDuration, setLiveDuration] = useState(0);
        const [highlightTargetId, setHighlightTargetId] = useState('');

  useEffect(() => {
    const fetchSong = async () => {
      try {
                                const authToken = user?.token || user?.accessToken;
                                const config = authToken ? { headers: { token: `Bearer ${authToken}` } } : undefined;
                const res = await api.get(`/api/songs/find/${id}`, config);
        setSong(res.data);
                setFetchError('');
      } catch (err) {
                const message = err?.response?.data?.message || err?.response?.data || 'Không thể tải bài hát này.';
                setFetchError(typeof message === 'string' ? message : 'Không thể tải bài hát này.');
      }
    };
    fetchSong();
    setWaveforms([...Array(120)].map(() => Math.max(15, Math.random() * 100)));
        setLiveCurrentTime(0);
        }, [id, user?.token, user?.accessToken]);

    const songId = song?._id;

    useEffect(() => {
        if (!songId) return;

        const onProgress = (event) => {
            const detail = event.detail || {};
            if (detail.songId !== songId) return;

            if (Number.isFinite(detail.currentTime)) {
                setLiveCurrentTime(detail.currentTime);
            }

            if (Number.isFinite(detail.duration) && detail.duration > 0) {
                setLiveDuration(detail.duration);
            }
        };

        window.addEventListener('moontune:player-progress', onProgress);
        return () => window.removeEventListener('moontune:player-progress', onProgress);
    }, [songId]);

  useEffect(() => {
      if (!song || !song.coverImage) return;
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = song.coverImage;
      img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 1;
          canvas.height = 1;
          ctx.drawImage(img, 0, 0, 1, 1);
          const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
          setDominantColor(`rgb(${r}, ${g}, ${b})`);
      };
      img.onerror = () => setDominantColor('rgb(50, 50, 50)');
  }, [song]);

  useEffect(() => {
      if (!song?._id) return;

      const searchParams = new URLSearchParams(location.search);
      const commentId = searchParams.get('commentId');
      const replyId = searchParams.get('replyId');

      if (!commentId && !replyId) return;

      const primaryTargetId = replyId ? `reply-${replyId}` : `comment-${commentId}`;
      const fallbackTargetId = commentId ? `comment-${commentId}` : '';

      const timerId = setTimeout(() => {
          const targetEl = document.getElementById(primaryTargetId) || (fallbackTargetId ? document.getElementById(fallbackTargetId) : null);
          if (!targetEl) return;

          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightTargetId(targetEl.id);

          window.setTimeout(() => {
              setHighlightTargetId((currentId) => (currentId === targetEl.id ? '' : currentId));
          }, 2200);
      }, 140);

      return () => clearTimeout(timerId);
  }, [song?._id, song?.comments, location.search]);

  // Helper format thời gian
  const formatTime = (time) => {
    if (!time) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
  };

  // Xử lý click vào sóng nhạc để tua
  const handleWaveformClick = (e) => {
            if (!isCurrentSong || !effectiveDuration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const percent = x / width;
            const newTime = percent * effectiveDuration;

            window.dispatchEvent(new CustomEvent('moontune:seek-to', {
                detail: {
                    songId: song._id,
                    time: newTime,
                },
            }));

            setLiveCurrentTime(newTime);
  };

  const handleCommentSubmit = async (e) => {
    if (e.key === 'Enter') {
        if (!user) return alert("Vui lòng đăng nhập để bình luận!");
        if (!commentText.trim()) return;
        try {
            const res = await api.post(`/api/songs/${id}/comment`, {
                username: user.username,
                userAvatar: user.avatar || '',
                text: commentText,
                timestamp: liveCurrentTime // Lưu thời điểm bình luận
            }, {
                headers: { token: `Bearer ${user.token}` }
            });
            setSong(res.data);
            setCommentText("");
        } catch (err) {
            console.error(err);
            alert("Lỗi khi gửi bình luận");
        }
    }
  };

  const handleLike = async () => {
      if (!user) return alert("Please login to like songs!");
      try {
          const res = await api.put(`/api/users/like/${id}`, {}, {
             headers: { token: `Bearer ${user.token}` }
          });
          if (res.data === "Liked") {
              setSong({ ...song, likes: song.likes + 1 });
              updateUser({ likedSongs: [...(user.likedSongs || []), id] });
          } else {
              setSong({ ...song, likes: song.likes - 1 });
              updateUser({ likedSongs: (user.likedSongs || []).filter(songId => songId !== id) });
          }
      } catch (err) { console.error(err); }
  };

  const handleDeleteComment = async (commentId) => {
      if (!window.confirm("Bạn muốn xóa bình luận này?")) return;
      try {
          const res = await api.delete(`/api/songs/${id}/comment/${commentId}`, {
              headers: { token: `Bearer ${user.token}` }
          });
          setSong(res.data);
      } catch (err) {
          const errorMessage = err.response?.data || "Lỗi khi xóa comment";
          alert(typeof errorMessage === 'string' ? errorMessage : "Có lỗi xảy ra!");
      }
  };

  const handleEditSubmit = async (commentId) => {
      if (!editText.trim()) return;
      try {
          const res = await api.put(`/api/songs/${id}/comment/${commentId}`, { text: editText }, { headers: { token: `Bearer ${user.token}` } });
          setSong(res.data);
          setEditingCommentId(null);
      } catch (err) { alert("Lỗi khi sửa comment"); }
  };

  const handleReplySubmit = async (commentId) => {
      if (!replyText.trim()) return;
      try {
          const res = await api.post(`/api/songs/${id}/comment/${commentId}/reply`, { username: user.username, userAvatar: user.avatar || '', text: replyText }, { headers: { token: `Bearer ${user.token}` } });
          setSong(res.data);
          setReplyingCommentId(null);
          setReplyText("");
      } catch (err) { alert("Lỗi khi trả lời comment"); }
  };

    if (fetchError) {
        return <div className="mt-20 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-center text-red-200">{fetchError}</div>;
    }

    if (!song) return <div className="text-gray-500 text-center mt-20">Loading...</div>;

    const isCurrentSong = currentSong?._id === song._id;
  const isLiked = user?.likedSongs?.includes(song._id);
    const uploaderName = typeof song?.uploader === 'object' ? song?.uploader?.username : (song?.artist || 'Unknown');
    const uploaderFollowers = typeof song?.uploader === 'object' ? (song?.uploader?.followers?.length || 0) : 0;
    const effectiveDuration = liveDuration > 0
        ? liveDuration
        : (Number(song?.duration) > 0 ? Number(song.duration) : 0);

    const displayedDuration = effectiveDuration;
    const coverImage = song.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(song.title || 'Song')}&background=1f2a44&color=fff`;
    const createdDate = song.createdAt ? new Date(song.createdAt).toLocaleDateString('vi-VN') : 'N/A';
    const uploaderId = typeof song?.uploader === 'object' ? song?.uploader?._id : song?.uploader;
    const uploaderAvatar = typeof song?.uploader === 'object' && song?.uploader?.avatar
        ? song.uploader.avatar
        : DEFAULT_USER_AVATAR;

  return (
        <div className="space-y-6 pb-32 text-white">
            <section
                className="relative overflow-hidden rounded-3xl border border-white/10 p-6 shadow-[0_26px_60px_rgba(8,10,30,0.5)] sm:p-8"
                style={{ background: `linear-gradient(120deg, ${dominantColor}88, rgba(17,24,39,0.95) 55%, rgba(15,23,42,0.96))` }}
            >
                <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-300/15 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

                <div className="relative z-10 grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
                    <div className="space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100">
                                <span className="h-2 w-2 rounded-full bg-cyan-300" /> Song
                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">{createdDate}</span>
                            </div>
                        </div>

                        <div>
                            <h1 className="text-5xl font-black leading-none sm:text-6xl">{song.title}</h1>
                            <p className="mt-3 text-2xl font-semibold text-slate-200">{song.artist}</p>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm font-semibold">
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">{song.plays || 0} lượt nghe</span>
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">{song.likes || 0} lượt tim</span>
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">{formatTime(displayedDuration)} phút</span>
                            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-cyan-100">#{song.artist || 'music'}</span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Nghệ sĩ</p>
                                <p className="mt-2 text-2xl font-black">{song.artist || 'Unknown'}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Uploader</p>
                                <p className="mt-2 text-2xl font-black">{uploaderName}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Followers uploader</p>
                                <p className="mt-2 text-2xl font-black">{uploaderFollowers}</p>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                            <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-300">
                                <span className="uppercase tracking-[0.16em] text-slate-400">Live waveform</span>
                                <span>{formatTime(isCurrentSong ? liveCurrentTime : 0)} / {formatTime(displayedDuration)}</span>
                            </div>
                            <div className="relative h-28 w-full cursor-pointer" onClick={handleWaveformClick}>
                                <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/15" />
                                <div className="absolute left-0 top-0 h-full w-[2px] rounded-full bg-white/80" style={{ left: `${(isCurrentSong && effectiveDuration) ? (liveCurrentTime / effectiveDuration) * 100 : 0}%` }} />
                                <div className="absolute -left-1 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.8)]" style={{ left: `${(isCurrentSong && effectiveDuration) ? (liveCurrentTime / effectiveDuration) * 100 : 0}%` }} />

                                <div className="absolute bottom-1 left-0 right-0 flex items-end gap-[2px]">
                                    {waveforms.slice(0, 95).map((height, i) => {
                                        const barPercent = (i / 95) * 100;
                                        const currentPercent = (isCurrentSong && effectiveDuration) ? (liveCurrentTime / effectiveDuration) * 100 : 0;
                                        const isPlayed = barPercent < currentPercent;
                                        return (
                                            <div
                                                key={i}
                                                className="flex-1 rounded-t-sm transition-all duration-75"
                                                style={{
                                                    height: `${Math.max(18, height * 0.55)}%`,
                                                    background: isPlayed ? 'linear-gradient(180deg, #f59e0b, #fb7185)' : 'rgba(226,232,240,0.55)'
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <div className="w-full max-w-[460px] overflow-hidden rounded-3xl border border-white/15 bg-black/25 p-3 shadow-2xl">
                            <div className="aspect-[4/3] overflow-hidden rounded-2xl">
                                <img src={coverImage} alt="cover" className="h-full w-full object-cover object-center" />
                            </div>
                        </div>
                        <div className="grid w-full max-w-[460px] grid-cols-2 gap-3">
                            <div className="flex h-[74px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/20 p-3 text-center">
                                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Upload</p>
                                <p className="mt-1 truncate text-xl font-black">{uploaderName}</p>
                            </div>
                            <div className="flex h-[74px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/20 p-3 text-center">
                                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Tâm trạng</p>
                                <p className="mt-1 text-xl font-black">#Fresh</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="glass-panel rounded-2xl border border-white/10 bg-[#0b1228]/80 p-4 sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                        <button onClick={handleLike} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${isLiked ? 'border-amber-300/50 bg-amber-300/15 text-amber-200' : 'border-white/20 bg-white/5 text-slate-200 hover:border-amber-300/40'}`}><FaHeart /> {isLiked ? 'Đã thích' : 'Thích'}</button>
                        <button className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200"><FaRetweet /> Repost</button>
                        <button className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200"><FaShareSquare /> Share</button>
                        <button className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200"><FaEllipsisH /> More</button>
                    </div>
                    <div className="flex gap-4 text-sm font-semibold text-slate-300">
                        <span className="inline-flex items-center gap-1"><FaPlay size={12} /> {song.plays || 0}</span>
                        <span className="inline-flex items-center gap-1"><FaHeart size={12} /> {song.likes || 0}</span>
                        <span className="inline-flex items-center gap-1"><FaRetweet size={12} /> 12</span>
                    </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-[1.5fr_0.95fr]">
                    <div>
                        <div className="mb-5 flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="h-10 w-10 overflow-hidden rounded-full border border-white/20">
                                <img src={user?.avatar || DEFAULT_USER_AVATAR} alt="me" className="h-full w-full object-cover" />
                            </div>
                            <input
                                type="text"
                                placeholder="Viết bình luận và nhấn Enter..."
                                className="h-10 w-full rounded-full border border-white/10 bg-[#0b1228] px-4 text-sm text-white placeholder:text-slate-500 outline-none"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={handleCommentSubmit}
                            />
                        </div>

                        <div className="space-y-5">
                            <h3 className="flex items-center gap-2 border-b border-white/10 pb-2 text-sm font-bold uppercase tracking-[0.14em] text-slate-300"><FaCommentAlt /> {song.comments?.length || 0} bình luận</h3>
                            {song.comments && song.comments.length > 0 ? (
                                [...song.comments].reverse().map((comment) => (
                                    <div id={`comment-${comment._id}`} key={comment._id} className={`group flex gap-4 rounded-xl border bg-white/5 p-3 transition ${highlightTargetId === `comment-${comment._id}` ? 'border-cyan-300/70 ring-2 ring-cyan-300/30' : 'border-white/10'}`}>
                                        <Link to={comment.userId ? `/profile/${comment.userId}` : '#'} className="h-10 w-10 overflow-hidden rounded-full border border-white/20">
                                            <img src={comment.userAvatar || DEFAULT_USER_AVATAR} alt={comment.username} className="h-full w-full object-cover" />
                                        </Link>
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {comment.userId ? (
                                                    <Link to={`/profile/${comment.userId}`} className="text-sm font-bold text-white hover:text-cyan-300">{comment.username}</Link>
                                                ) : (
                                                    <span className="text-sm font-bold text-white">{comment.username}</span>
                                                )}
                                                <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
                                                {comment.timestamp > 0 && <span className="text-xs font-semibold text-cyan-300">{formatTime(comment.timestamp)}</span>}
                                            </div>

                                            {editingCommentId === comment._id ? (
                                                <div className="mt-2">
                                                    <input className="mb-2 w-full rounded border border-white/20 bg-[#0b1228] p-2 text-sm text-white" value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus />
                                                    <div className="flex gap-2 text-xs">
                                                        <button onClick={() => handleEditSubmit(comment._id)} className="font-bold text-cyan-300">Lưu</button>
                                                        <button onClick={() => setEditingCommentId(null)} className="text-slate-400">Hủy</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="mt-1 text-sm text-slate-300">{comment.text}</p>
                                            )}

                                            <div className="mt-2 flex gap-3 text-xs text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
                                                <button onClick={() => { setReplyingCommentId(comment._id); setReplyText(`@${comment.username} `); }} className="inline-flex items-center gap-1 hover:text-cyan-300"><FaReply /> Trả lời</button>
                                                {user && user.username === comment.username && (
                                                    <>
                                                        <button onClick={() => { setEditingCommentId(comment._id); setEditText(comment.text); }} className="inline-flex items-center gap-1 hover:text-cyan-300"><FaEdit /> Sửa</button>
                                                        <button onClick={() => handleDeleteComment(comment._id)} className="inline-flex items-center gap-1 hover:text-rose-300"><FaTrash /> Xóa</button>
                                                    </>
                                                )}
                                            </div>

                                            {replyingCommentId === comment._id && (
                                                <div className="mt-3 flex gap-2">
                                                    <input className="w-full rounded border border-white/20 bg-[#0b1228] p-2 text-sm text-white" placeholder="Viết trả lời..." value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit(comment._id)} autoFocus />
                                                    <button onClick={() => setReplyingCommentId(null)} className="text-xs text-slate-400">Hủy</button>
                                                </div>
                                            )}

                                            {comment.replies && comment.replies.length > 0 && (
                                                <div className="mt-3 space-y-2 border-l-2 border-white/10 pl-4">
                                                    {comment.replies.map((reply, idx) => (
                                                        <div id={reply._id ? `reply-${reply._id}` : undefined} key={reply._id || idx} className={`flex gap-3 rounded-md px-1 py-0.5 transition ${reply._id && highlightTargetId === `reply-${reply._id}` ? 'bg-cyan-500/15 ring-1 ring-cyan-300/40' : ''}`}>
                                                            <Link to={reply.userId ? `/profile/${reply.userId}` : '#'} className="h-6 w-6 overflow-hidden rounded-full">
                                                                <img src={reply.userAvatar || DEFAULT_USER_AVATAR} alt={reply.username} className="h-full w-full object-cover" />
                                                            </Link>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    {reply.userId ? (
                                                                        <Link to={`/profile/${reply.userId}`} className="text-xs font-bold text-slate-200 hover:text-cyan-300">{reply.username}</Link>
                                                                    ) : (
                                                                        <span className="text-xs font-bold text-slate-200">{reply.username}</span>
                                                                    )}
                                                                    <span className="text-[10px] text-slate-500">{new Date(reply.createdAt).toLocaleDateString('vi-VN')}</span>
                                                                </div>
                                                                <p className="text-xs text-slate-400">{reply.text}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="py-4 text-center text-sm italic text-slate-500">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                            )}
                        </div>
                    </div>
                    <aside className="h-fit rounded-3xl border border-cyan-300/35 bg-gradient-to-br from-cyan-400/15 via-sky-400/10 to-white/5 p-5 shadow-[0_22px_45px_rgba(8,145,178,0.2)]">
                        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-cyan-100">Tác giả bài hát</p>
                        {uploaderId ? (
                            <Link to={`/profile/${uploaderId}`} className="mt-4 flex items-center gap-4 rounded-2xl border border-cyan-200/45 bg-black/20 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/70 hover:bg-cyan-200/10">
                                <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-cyan-200/60 shadow-[0_0_22px_rgba(34,211,238,0.35)]">
                                    <img src={uploaderAvatar} alt={uploaderName} className="h-full w-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-xl font-black text-white">{uploaderName}</p>
                                    <p className="mt-1 text-sm font-semibold text-cyan-100/90">Xem trang cá nhân tác giả</p>
                                    <p className="mt-1 text-xs text-slate-300">{uploaderFollowers} người theo dõi</p>
                                </div>
                            </Link>
                        ) : (
                            <div className="mt-4 flex items-center gap-4 rounded-2xl border border-cyan-200/30 bg-black/20 p-4">
                                <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-cyan-200/40">
                                    <img src={uploaderAvatar} alt={uploaderName} className="h-full w-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-xl font-black text-white">{uploaderName}</p>
                                    <p className="mt-1 text-sm text-slate-300">Không có trang profile</p>
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </section>
    </div>
  );
};

export default SongDetail;
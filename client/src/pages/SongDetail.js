import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { 
    FaPlay, FaPause, FaHeart, FaRetweet, FaShareSquare, FaEllipsisH, 
    FaCommentAlt, FaTrash, FaEdit, FaReply 
} from 'react-icons/fa';

const SongDetail = () => {
  const { id } = useParams();
  const [song, setSong] = useState(null);
  const { currentSong, isPlaying, playSong, togglePlay, currentTime, duration, handleSeek } = usePlayer();
  
  const { user, updateUser } = useAuth();
  const [commentText, setCommentText] = useState("");

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState("");
  const [replyingCommentId, setReplyingCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const [dominantColor, setDominantColor] = useState('rgb(50, 50, 50)');
  const [waveforms, setWaveforms] = useState([]);

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/songs/find/${id}`);
        setSong(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSong();
    setWaveforms([...Array(120)].map(() => Math.max(15, Math.random() * 100)));
  }, [id]);

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

  // Helper format thời gian
  const formatTime = (time) => {
    if (!time) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
  };

  // Xử lý click vào sóng nhạc để tua
  const handleWaveformClick = (e) => {
      if (!duration || !isCurrentSong) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const percent = x / width;
      const newTime = percent * duration;
      handleSeek(newTime); // Gọi hàm tua từ context
  };

  const handleCommentSubmit = async (e) => {
    if (e.key === 'Enter') {
        if (!user) return alert("Vui lòng đăng nhập để bình luận!");
        if (!commentText.trim()) return;
        try {
            const res = await axios.post(`http://localhost:5000/api/songs/${id}/comment`, {
                username: user.username,
                text: commentText,
                timestamp: currentTime // Lưu thời điểm bình luận
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
          const res = await axios.put(`http://localhost:5000/api/users/like/${id}`, {}, {
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
          const res = await axios.delete(`http://localhost:5000/api/songs/${id}/comment/${commentId}`, {
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
          const res = await axios.put(`http://localhost:5000/api/songs/${id}/comment/${commentId}`, { text: editText }, { headers: { token: `Bearer ${user.token}` } });
          setSong(res.data);
          setEditingCommentId(null);
      } catch (err) { alert("Lỗi khi sửa comment"); }
  };

  const handleReplySubmit = async (commentId) => {
      if (!replyText.trim()) return;
      try {
          const res = await axios.post(`http://localhost:5000/api/songs/${id}/comment/${commentId}/reply`, { username: user.username, text: replyText }, { headers: { token: `Bearer ${user.token}` } });
          setSong(res.data);
          setReplyingCommentId(null);
          setReplyText("");
      } catch (err) { alert("Lỗi khi trả lời comment"); }
  };

  if (!song) return <div className="text-gray-500 text-center mt-20">Loading...</div>;

  const isCurrentSong = currentSong?._id === song._id;
  const isLiked = user?.likedSongs?.includes(song._id);

  return (
    <div className="bg-[#FAF7F2] min-h-screen text-gray-700 pb-32 font-sans relative">
      {/* 1. HERO SECTION */}
      <div 
        className="p-8 relative overflow-hidden transition-colors duration-700 ease-in-out"
        style={{ background: `linear-gradient(to bottom, ${dominantColor}, #111)` }}
      >
        <div className="max-w-7xl mx-auto flex gap-8 h-[380px]">
            
            {/* Left Content */}
            <div className="flex-1 flex flex-col relative z-10">
                
                {/* Top: Play Button & Info */}
                <div className="flex items-start gap-4 mb-auto pt-4">
                    <button 
                        onClick={() => isCurrentSong ? togglePlay() : playSong(song)}
                        className="w-16 h-16 rounded-full bg-[#f50] flex items-center justify-center hover:scale-105 transition shadow-lg flex-shrink-0 text-white border-2 border-white/20"
                    >
                        {isCurrentSong && isPlaying ? <FaPause size={24} /> : <FaPlay size={24} className="ml-1" />}
                    </button>
                    
                    <div className="mt-1">
                        <h1 className="text-2xl font-normal bg-black/60 px-3 py-1 inline-block mb-2 text-white backdrop-blur-sm">{song.title}</h1>
                        <br />
                        <h2 className="text-lg text-gray-300 bg-black/60 px-3 py-1 inline-block backdrop-blur-sm">{song.artist}</h2>
                    </div>
                    
                    <div className="ml-auto text-right">
                         <span className="text-xs font-bold text-white/80 bg-black/40 px-2 py-1 rounded">1 month ago</span>
                    </div>
                </div>

                {/* Bottom: Waveform (Clickable) */}
                <div 
                    className="relative h-32 w-full flex items-end gap-[1px] mt-8 mb-2 cursor-pointer"
                    onClick={handleWaveformClick}
                >
                    {/* Time Labels */}
                    <span className="absolute left-0 bottom-1 bg-[#f50] px-1 text-[10px] text-white z-20 font-bold">
                        {formatTime(isCurrentSong ? currentTime : 0)}
                    </span>
                    <span className="absolute right-0 bottom-1 bg-white px-1 text-[10px] text-black z-20 font-bold">
                        {formatTime(isCurrentSong ? duration : 0)}
                    </span>

                    {/* Bars */}
                    {waveforms.map((height, i) => {
                        const barPercent = (i / waveforms.length) * 100;
                        const currentPercent = (isCurrentSong && duration) ? (currentTime / duration) * 100 : 0;
                        const isPlayed = barPercent < currentPercent;

                        return (
                            <div 
                                key={i} 
                                className="flex-1 transition-all duration-75 pointer-events-none"
                                style={{ 
                                    height: `${height}%`,
                                    backgroundColor: isPlayed ? '#f50' : '#fff' 
                                }}
                            ></div>
                        );
                    })}

                    {/* Comment Avatars */}
                    {song.comments && song.comments.map((comment, idx) => {
                        if (!comment.timestamp || !duration) return null;
                        const leftPos = (comment.timestamp / duration) * 100;
                        if (leftPos > 100) return null;

                        return (
                            <div 
                                key={idx}
                                className="absolute bottom-0 w-5 h-5 rounded-full border border-white overflow-hidden cursor-pointer group z-30 hover:scale-125 transition hover:z-40 shadow-md"
                                style={{ left: `${leftPos}%`, marginBottom: '-10px' }}
                            >
                                <img 
                                    src={`https://ui-avatars.com/api/?name=${comment.username}&background=random`} 
                                    alt={comment.username} 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap hidden group-hover:block shadow-lg border border-gray-700 z-50">
                                    <span className="font-bold text-[#f50]">{comment.username}</span>: {comment.text}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Right Content: Cover Image */}
            <div className="w-[340px] h-[340px] flex-shrink-0 shadow-2xl relative group rounded overflow-hidden bg-black border-4 border-white/10">
                <img src={song.coverImage} alt="cover" className="w-full h-full object-cover opacity-100" />
            </div>
        </div>
      </div>

      {/* 2. ACTION BAR */}
      <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center border-b border-gray-200 bg-white shadow-sm">
          <div className="flex gap-3">
              <button onClick={handleLike} className={`flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded text-sm transition ${isLiked ? 'text-[#FFB703] border-[#FFB703]' : 'text-gray-600 hover:border-[#FFB703] hover:text-[#FFB703]'}`}><FaHeart /> {isLiked ? 'Liked' : 'Like'}</button>
              <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:border-[#FFB703] hover:text-[#FFB703] transition"><FaRetweet /> Repost</button>
              <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:border-[#FFB703] hover:text-[#FFB703] transition"><FaShareSquare /> Share</button>
              <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:border-[#FFB703] hover:text-[#FFB703] transition"><FaEllipsisH /> More</button>
          </div>
          <div className="flex gap-6 text-gray-400 text-sm font-medium">
              <span className="flex items-center gap-1"><FaPlay size={12} /> {song.plays}</span>
              <span className="flex items-center gap-1"><FaHeart size={12} /> {song.likes}</span>
              <span className="flex items-center gap-1"><FaRetweet size={12} /> 12</span>
          </div>
      </div>

      {/* 3. MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-8 py-8 flex gap-8">
          <div className="flex-1">
              {/* Comment Input */}
              <div className="flex gap-4 mb-8 bg-white p-4 rounded-xl border border-[#A5D8FF]/30 shadow-sm">
                  <div className="w-10 h-10 bg-[#A5D8FF] rounded-full overflow-hidden">
                      <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || 'Guest'}&background=random`} alt="me" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 relative">
                      <input type="text" placeholder="Write a comment (Press Enter to submit)" className="w-full h-10 bg-[#FAF7F2] border border-gray-200 rounded-full px-4 text-sm focus:outline-none focus:border-[#FFB703] transition text-gray-700" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={handleCommentSubmit} />
                  </div>
              </div>
              
              {/* Comments List */}
              <div className="space-y-6">
                  <h3 className="text-gray-500 font-bold text-sm border-b border-gray-200 pb-2 flex items-center gap-2"><FaCommentAlt /> {song.comments?.length || 0} comments</h3>
                  {song.comments && song.comments.length > 0 ? (
                      [...song.comments].reverse().map((comment) => (
                        <div key={comment._id} className="flex gap-4 group animate-fade-in-up">
                            <div className="w-10 h-10 rounded-full bg-[#FAF7F2] flex-shrink-0 overflow-hidden border border-gray-100">
                                <img src={`https://ui-avatars.com/api/?name=${comment.username}&background=random`} alt="u" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-gray-700 text-sm font-bold">{comment.username}</span>
                                    <span className="text-gray-400 text-xs">{new Date(comment.createdAt).toLocaleDateString()} {comment.timestamp > 0 && <span className="ml-2 text-[#FFB703]">at {formatTime(comment.timestamp)}</span>}</span>
                                </div>
                                {editingCommentId === comment._id ? (
                                    <div className="mt-2">
                                        <input className="border p-1 rounded w-full text-sm mb-2" value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus />
                                        <div className="flex gap-2 text-xs">
                                            <button onClick={() => handleEditSubmit(comment._id)} className="text-blue-500 font-bold">Save</button>
                                            <button onClick={() => setEditingCommentId(null)} className="text-gray-500">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-600 mt-1">{comment.text}</p>
                                )}
                                <div className="flex gap-3 mt-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setReplyingCommentId(comment._id); setReplyText(`@${comment.username} `); }} className="hover:text-[#FFB703] flex items-center gap-1"><FaReply /> Reply</button>
                                    {user && user.username === comment.username && (
                                        <>
                                            <button onClick={() => { setEditingCommentId(comment._id); setEditText(comment.text); }} className="hover:text-blue-500 flex items-center gap-1"><FaEdit /> Edit</button>
                                            <button onClick={() => handleDeleteComment(comment._id)} className="hover:text-red-500 flex items-center gap-1"><FaTrash /> Delete</button>
                                        </>
                                    )}
                                </div>
                                {replyingCommentId === comment._id && (
                                    <div className="mt-3 flex gap-2">
                                        <input className="border p-2 rounded w-full text-sm bg-gray-50" placeholder="Write a reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit(comment._id)} autoFocus />
                                        <button onClick={() => setReplyingCommentId(null)} className="text-xs text-gray-500">Cancel</button>
                                    </div>
                                )}
                                {comment.replies && comment.replies.length > 0 && (
                                    <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-3">
                                        {comment.replies.map((reply, idx) => (
                                            <div key={idx} className="flex gap-3">
                                                <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                                    <img src={`https://ui-avatars.com/api/?name=${reply.username}&background=random`} alt="r" className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-gray-700 text-xs font-bold">{reply.username}</span>
                                                        <span className="text-gray-400 text-[10px]">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600">{reply.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                      ))
                  ) : (
                      <p className="text-gray-400 text-sm italic text-center py-4">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                  )}
              </div>
          </div>
          <div className="w-80 flex-shrink-0">
              <div className="mb-6">
                  <h3 className="text-gray-500 text-xs font-bold uppercase mb-4 border-b border-gray-200 pb-2">Fans who played this most</h3>
                  <ul className="space-y-4">
                      {[1, 2, 3].map((_, i) => (
                          <li key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-[#FAF7F2] overflow-hidden border border-gray-100">
                                      <img src={`https://ui-avatars.com/api/?name=Fan${i}&background=random`} alt="f" />
                                  </div>
                                  <span className="text-sm font-bold text-gray-600">Fan {i+1}</span>
                              </div>
                              <span className="text-xs text-[#FFB703] font-bold">{90 - i*10} plays</span>
                          </li>
                      ))}
                  </ul>
              </div>
          </div>
      </div>
    </div>
  );
};

export default SongDetail;
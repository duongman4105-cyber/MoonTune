import React, { useRef, useEffect, useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaRandom, FaRedo, FaVolumeUp, FaVolumeDown, FaVolumeMute, FaHeart, FaUserPlus, FaList, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Player = () => {
  const { 
    currentSong, isPlaying, togglePlay, 
    playNext, playPrev, isLooping, toggleLoop, isShuffling, toggleShuffle, songList, playSong 
  } = usePlayer();
  
  const { user, updateUser } = useAuth();
  const audioRef = useRef(null);
  const volumeBarRef = useRef(null); // Ref cho thanh volume
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showQueue, setShowQueue] = useState(false);
  
  // State cho Volume
  const [volume, setVolume] = useState(1); // Mặc định 100%
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1); // Lưu volume trước khi mute
  const [isDraggingVolume, setIsDraggingVolume] = useState(false); // Thêm state để kiểm tra đang kéo

  // Xử lý Play/Pause khi đổi bài
  useEffect(() => {
    if (currentSong && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentSong, isPlaying]);

  // Xử lý khi hết bài
  const handleEnded = () => {
      if (isLooping) {
          // Nếu đang lặp 1 bài -> Phát lại từ đầu
          audioRef.current.currentTime = 0;
          audioRef.current.play();
      } else {
          // Nếu không -> Chuyển bài tiếp
          playNext();
      }
  };

  // Cập nhật thời gian thực
  const handleTimeUpdate = () => {
    if(audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        setDuration(audioRef.current.duration || 0);
    }
  };

  // Tua nhạc
  const handleSeek = (e) => {
    const seekTime = (e.target.value / 100) * duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Xử lý thay đổi Volume (Chung cho Click và Drag)
  const handleVolumeChange = (e) => {
      if (!volumeBarRef.current) return;
      const rect = volumeBarRef.current.getBoundingClientRect();
      const height = rect.height;
      const y = e.clientY - rect.top; // Khoảng cách từ đỉnh thanh
      
      // Tính % volume (đảo ngược vì y=0 là đỉnh, volume=1)
      let newVolume = (height - y) / height;
      
      // Giới hạn 0 -> 1
      if (newVolume < 0) newVolume = 0;
      if (newVolume > 1) newVolume = 1;
      
      setVolume(newVolume);
      if (audioRef.current) audioRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
  };

  // Bắt đầu kéo
  const handleVolumeMouseDown = (e) => {
      setIsDraggingVolume(true);
      handleVolumeChange(e); // Cập nhật ngay khi click
  };

  // Đang kéo
  const handleVolumeMouseMove = (e) => {
      if (isDraggingVolume) {
          handleVolumeChange(e);
      }
  };

  // Thả chuột ra
  const handleVolumeMouseUp = () => {
      setIsDraggingVolume(false);
  };

  // Bật/Tắt tiếng
  const toggleMute = () => {
      if (isMuted) {
          setVolume(prevVolume);
          if (audioRef.current) audioRef.current.volume = prevVolume;
          setIsMuted(false);
      } else {
          setPrevVolume(volume);
          setVolume(0);
          if (audioRef.current) audioRef.current.volume = 0;
          setIsMuted(true);
      }
  };

  // Format giây thành phút:giây
  const formatTime = (time) => {
    if (!time) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
  };

  const handleLike = async () => {
      if (!user) return alert("Please login to like songs!");
      if (!currentSong) return;

      try {
          const res = await axios.put(`http://localhost:5000/api/users/like/${currentSong._id}`, {}, {
             headers: { token: `Bearer ${user.token}` }
          });
          
          if (res.data === "Liked") {
              updateUser({ likedSongs: [...(user.likedSongs || []), currentSong._id] });
          } else {
              updateUser({ likedSongs: (user.likedSongs || []).filter(songId => songId !== currentSong._id) });
          }
      } catch (err) {
          console.error(err);
      }
  };

  if (!currentSong) return null;

  const isLiked = user?.likedSongs?.includes(currentSong._id);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white text-gray-700 h-[70px] border-t border-[#A5D8FF]/30 flex items-center px-2 md:px-4 z-50 font-sans select-none justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <audio 
        ref={audioRef} 
        src={currentSong.audioUrl} 
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
      />

      {/* 1. Nhóm Điều Khiển (Trái) */}
      <div className="flex items-center gap-4 md:gap-6 w-auto md:w-[240px] justify-start flex-shrink-0">
        <button onClick={playPrev} className="text-gray-400 hover:text-[#FFB703] transition hidden md:block"><FaStepBackward size={18} /></button>
        <button 
          onClick={togglePlay}
          className="text-[#FFB703] hover:text-orange-400 transition drop-shadow-sm"
        >
          {isPlaying ? <FaPause size={32} className="md:w-8 md:h-8" /> : <FaPlay size={32} className="md:w-8 md:h-8" />}
        </button>
        <button onClick={playNext} className="text-gray-400 hover:text-[#FFB703] transition"><FaStepForward size={18} /></button>
        
        {/* Nút Shuffle */}
        <button 
            onClick={toggleShuffle} 
            className={`transition hidden lg:block ${isShuffling ? 'text-[#FFB703]' : 'text-gray-300 hover:text-[#A5D8FF]'}`}
            title="Shuffle"
        >
            <FaRandom size={16} />
        </button>
        
        {/* Nút Loop */}
        <button 
            onClick={toggleLoop} 
            className={`transition hidden lg:block ${isLooping ? 'text-[#FFB703]' : 'text-gray-300 hover:text-[#A5D8FF]'}`}
            title="Loop One"
        >
            <FaRedo size={16} />
        </button>
      </div>

      {/* 2. Thanh Tiến Trình (Giữa) */}
      <div className="flex-1 flex items-center gap-4 px-4 hidden md:flex">
        <span className="text-[#FFB703] text-xs font-bold w-10 text-right">{formatTime(currentTime)}</span>
        
        <div className="relative flex-1 h-[4px] bg-[#FAF7F2] rounded-full group cursor-pointer border border-gray-100">
           <input 
              type="range" 
              min="0" 
              max="100" 
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={handleSeek}
              className="absolute w-full h-[12px] -top-[4px] opacity-0 cursor-pointer z-20"
           />
           <div className="absolute top-0 left-0 w-full h-full bg-gray-200 rounded-full"></div>
           <div 
              className="absolute top-0 left-0 h-full bg-[#FFB703] rounded-full" 
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
           ></div>
           <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#FFB703] border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition z-10 pointer-events-none shadow-sm"
              style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
           ></div>
        </div>

        <span className="text-gray-400 text-xs font-medium w-10">{formatTime(duration)}</span>
        
        {/* Volume Control */}
        <div className="relative group ml-2 flex items-center justify-center">
            <button onClick={toggleMute} className="text-gray-400 hover:text-[#FFB703]">
                {isMuted || volume === 0 ? <FaVolumeMute size={18} /> : volume < 0.5 ? <FaVolumeDown size={18} /> : <FaVolumeUp size={18} />}
            </button>
            
            {/* Volume Slider Popup (Hiện khi hover) */}
            <div 
                className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white p-3 rounded-lg shadow-xl border border-[#A5D8FF]/30 hidden group-hover:flex flex-col items-center w-12 h-32 z-50"
                onMouseMove={handleVolumeMouseMove}
                onMouseUp={handleVolumeMouseUp}
                onMouseLeave={handleVolumeMouseUp}
            >
                <div 
                    ref={volumeBarRef}
                    className="relative w-1.5 h-24 bg-gray-200 rounded-full flex items-end cursor-pointer"
                    onMouseDown={handleVolumeMouseDown}
                >
                    {/* Phần đã fill */}
                    <div 
                        className="w-full bg-[#FFB703] rounded-full pointer-events-none" 
                        style={{ height: `${(isMuted ? 0 : volume) * 100}%` }}
                    ></div>
                    {/* Nút tròn */}
                    <div 
                        className="absolute w-3 h-3 bg-[#FFB703] border-2 border-white rounded-full shadow-sm -translate-x-1/2 left-1/2 pointer-events-none"
                        style={{ bottom: `calc(${(isMuted ? 0 : volume) * 100}% - 6px)` }}
                    ></div>
                </div>
            </div>
        </div>
      </div>

      {/* 3. Thông Tin Bài Hát (Phải) */}
      <div className="flex items-center gap-2 md:gap-4 px-2 md:px-6 w-auto md:w-[360px] justify-end border-l-0 md:border-l border-gray-100 h-full flex-shrink min-w-0 relative">
        <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link to={`/song/${currentSong._id}`}>
                <img src={currentSong.coverImage || 'https://via.placeholder.com/40'} alt="cover" className="w-12 h-12 object-cover shadow-md rounded-lg md:rounded-lg hover:opacity-90 transition" />
            </Link>
            
            <div className="flex flex-col justify-center overflow-hidden">
                <span className="text-gray-400 text-[10px] md:text-[11px] truncate hover:underline cursor-pointer">{currentSong.artist}</span>
                <Link to={`/song/${currentSong._id}`} className="text-gray-700 text-xs truncate font-bold hover:text-[#FFB703] cursor-pointer">
                    {currentSong.title}
                </Link>
            </div>
        </div>

        <div className="flex items-center gap-3 md:gap-5 text-gray-400">
            <button 
                onClick={handleLike}
                className={`transition ${isLiked ? 'text-[#FFB703]' : 'hover:text-[#FFB703]'}`}
                title={isLiked ? "Unlike" : "Like"}
            >
                <FaHeart size={18} />
            </button>
            
            <button className="hover:text-[#A5D8FF] transition hidden sm:block"><FaUserPlus size={18} /></button>
            
            {/* Nút Danh Sách Phát */}
            <button 
                onClick={() => setShowQueue(!showQueue)}
                className={`transition hidden sm:block ${showQueue ? 'text-[#FFB703]' : 'hover:text-[#A5D8FF]'}`}
                title="Next Up"
            >
                <FaList size={18} />
            </button>
        </div>

        {/* POPUP DANH SÁCH PHÁT (QUEUE) */}
        {showQueue && (
            <div className="absolute bottom-[80px] right-4 w-80 bg-white shadow-2xl rounded-xl border border-[#A5D8FF]/30 p-4 max-h-[400px] overflow-y-auto z-50 animate-fade-in-up">
                <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                    <h4 className="font-bold text-gray-700 text-sm">Next Up</h4>
                    <button onClick={() => setShowQueue(false)} className="text-gray-400 hover:text-red-500"><FaTimes /></button>
                </div>
                <div className="space-y-2">
                    {songList.map((song, index) => (
                        <div 
                            key={index} 
                            onClick={() => playSong(song, songList)}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${currentSong._id === song._id ? 'bg-[#FAF7F2] border border-[#FFB703]/30' : 'hover:bg-gray-50'}`}
                        >
                            <img src={song.coverImage} alt="cover" className="w-10 h-10 rounded object-cover" />
                            <div className="overflow-hidden">
                                <p className={`text-xs font-bold truncate ${currentSong._id === song._id ? 'text-[#FFB703]' : 'text-gray-700'}`}>{song.title}</p>
                                <p className="text-[10px] text-gray-400 truncate">{song.artist}</p>
                            </div>
                            {currentSong._id === song._id && <div className="ml-auto text-[#FFB703] text-xs animate-pulse">Playing</div>}
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* Mobile Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gray-100 md:hidden pointer-events-none">
        <div 
            className="h-full bg-[#FFB703]" 
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Player;

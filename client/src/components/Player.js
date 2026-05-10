import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaPlay,
  FaPause,
  FaStepForward,
  FaStepBackward,
  FaRandom,
  FaRedo,
  FaVolumeUp,
  FaVolumeDown,
  FaVolumeMute,
  FaHeart,
  FaList,
  FaTimes,
  FaBackward,
  FaForward,
} from 'react-icons/fa';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const Player = () => {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    playNext,
    playPrev,
    isLooping,
    toggleLoop,
    isShuffling,
    toggleShuffle,
    songList,
    playSong,
  } = usePlayer();

  const { user, updateUser } = useAuth();

  const audioRef = useRef(null);
  const lastHistorySongIdRef = useRef('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    if (isPlaying) {
      audioRef.current.play().catch(() => {
        // Browser can block autoplay after song switch.
      });
    } else {
      audioRef.current.pause();
    }
  }, [currentSong, isPlaying]);

  useEffect(() => {
    const syncListeningHistory = async () => {
      if (!currentSong?._id || !user?.token) return;
      if (lastHistorySongIdRef.current === currentSong._id) return;

      try {
        await api.put(`/api/users/history/${currentSong._id}`, {}, {
          headers: { token: `Bearer ${user.token}` },
        });

        lastHistorySongIdRef.current = currentSong._id;
        window.dispatchEvent(new CustomEvent('moontune:history-updated'));
      } catch (error) {
        // Keep playback uninterrupted even if history sync fails.
      }
    };

    syncListeningHistory();
  }, [currentSong?._id, user?.token]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tagName = event.target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea') return;

      if (event.code === 'Space') {
        event.preventDefault();
        togglePlay();
      }

      if (event.code === 'ArrowRight') {
        playNext();
      }

      if (event.code === 'ArrowLeft') {
        playPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, playNext, playPrev]);

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const loadedDuration = audioRef.current.duration || 0;
    setDuration(loadedDuration);

    if (currentSong?._id) {
      window.dispatchEvent(new CustomEvent('moontune:player-progress', {
        detail: {
          songId: currentSong._id,
          currentTime: audioRef.current.currentTime || 0,
          duration: loadedDuration,
          isPlaying,
        },
      }));
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const nextTime = audioRef.current.currentTime || 0;
    setCurrentTime(nextTime);

    if (currentSong?._id) {
      window.dispatchEvent(new CustomEvent('moontune:player-progress', {
        detail: {
          songId: currentSong._id,
          currentTime: nextTime,
          duration,
          isPlaying,
        },
      }));
    }
  };

  const handleSeek = (event) => {
    if (!audioRef.current) return;

    const progress = Number(event.target.value);
    const nextTime = (progress / 100) * (duration || 0);
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);

    if (currentSong?._id) {
      window.dispatchEvent(new CustomEvent('moontune:player-progress', {
        detail: {
          songId: currentSong._id,
          currentTime: nextTime,
          duration,
          isPlaying,
        },
      }));
    }
  };

  useEffect(() => {
    const handleExternalSeek = (event) => {
      if (!audioRef.current || !currentSong?._id) return;

      const targetSongId = event.detail?.songId;
      const targetTime = Number(event.detail?.time);

      if (!targetSongId || targetSongId !== currentSong._id) return;
      if (!Number.isFinite(targetTime)) return;

      const boundedTime = Math.max(0, Math.min(targetTime, duration || targetTime));
      audioRef.current.currentTime = boundedTime;
      setCurrentTime(boundedTime);

      window.dispatchEvent(new CustomEvent('moontune:player-progress', {
        detail: {
          songId: currentSong._id,
          currentTime: boundedTime,
          duration,
          isPlaying,
        },
      }));
    };

    window.addEventListener('moontune:seek-to', handleExternalSeek);
    return () => window.removeEventListener('moontune:seek-to', handleExternalSeek);
  }, [currentSong?._id, duration, isPlaying]);

  useEffect(() => {
    if (!currentSong?._id) return;

    window.dispatchEvent(new CustomEvent('moontune:player-progress', {
      detail: {
        songId: currentSong._id,
        currentTime,
        duration,
        isPlaying,
      },
    }));
  }, [currentSong?._id, currentTime, duration, isPlaying]);

  const handleEnded = () => {
    if (!audioRef.current) return;

    if (isLooping) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      return;
    }

    playNext();
  };

  const formatTime = (time) => {
    if (!Number.isFinite(time) || time <= 0) return '0:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? `0${sec}` : sec}`;
  };

  const likedSongIds = useMemo(
    () => (user?.likedSongs || []).map((item) => (typeof item === 'string' ? item : item?._id)).filter(Boolean),
    [user?.likedSongs]
  );

  const isLiked = currentSong ? likedSongIds.includes(currentSong._id) : false;

  const handleLike = async () => {
    if (!user || !currentSong) return;

    try {
      await api.put(`/api/users/like/${currentSong._id}`, {}, {
        headers: { token: `Bearer ${user.token}` },
      });

      const nextLiked = isLiked
        ? (user.likedSongs || []).filter((item) => (typeof item === 'string' ? item !== currentSong._id : item?._id !== currentSong._id))
        : [...(user.likedSongs || []), currentSong._id];

      updateUser({ likedSongs: nextLiked });
    } catch (error) {
      // Keep silent to avoid interrupting playback.
    }
  };

  const volumeIcon = isMuted || volume === 0
    ? <FaVolumeMute size={16} />
    : volume < 0.45
      ? <FaVolumeDown size={16} />
      : <FaVolumeUp size={16} />;

  const handleRewind = () => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, currentTime - 10);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleForward = () => {
    if (!audioRef.current) return;
    const newTime = Math.min(duration, currentTime + 10);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const cover = currentSong?.coverImage || currentSong?.thumbnail || 'https://via.placeholder.com/80';
  const audioSource = currentSong?.audioUrl || currentSong?.fileUrl || currentSong?.songUrl || '';
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentSong) return null;

  return (
    <div className="player-shell fixed bottom-0 left-0 right-0 z-50 h-auto md:h-[106px] border-t border-white/10 px-3 py-2 text-white md:px-5 lg:left-[280px] lg:px-8">
      <audio
        ref={audioRef}
        src={audioSource}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Mobile Mini Player */}
      <div className="md:hidden flex flex-col gap-3 py-1">
        {/* Song Info Row */}
        <div className="flex items-center gap-3">
          <Link to={`/song/${currentSong._id}`} className="flex-shrink-0">
            <img src={cover} alt={currentSong.title} className="h-16 w-16 rounded-lg object-cover shadow-md" />
          </Link>

          <div className="min-w-0 flex-1">
            <Link to={`/song/${currentSong._id}`} className="block truncate text-base font-bold text-white hover:text-cyan-200">
              {currentSong.title}
            </Link>
            <p className="truncate text-sm text-slate-400">{currentSong.artist || 'Unknown artist'}</p>
          </div>

          <button
            onClick={handleLike}
            className={`flex-shrink-0 p-2 transition ${isLiked ? 'text-rose-400' : 'text-slate-400 hover:text-rose-400'}`}
          >
            <FaHeart size={18} />
          </button>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-center gap-3">
          <button onClick={handleRewind} className="p-2 text-slate-300 hover:text-white transition group relative" title="Rewind 10s">
            <FaBackward size={14} />
            <span className="absolute -top-6 text-xs bg-slate-800 px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">-10s</span>
          </button>

          <button onClick={playPrev} className="p-2 text-slate-300 hover:text-white transition">
            <FaStepBackward size={16} />
          </button>

          <button
            onClick={togglePlay}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 text-[#0c1533] transition hover:scale-110"
          >
            {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} className="ml-0.5" />}
          </button>

          <button onClick={playNext} className="p-2 text-slate-300 hover:text-white transition">
            <FaStepForward size={16} />
          </button>

            <button onClick={handleForward} className="p-2 text-slate-300 hover:text-white transition group relative" title="Forward 10s">
              <FaForward size={14} />
              <span className="absolute -top-6 text-xs bg-slate-800 px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">+10s</span>
            </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-8 text-right">{formatTime(currentTime)}</span>
          <div className="group relative flex-1">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="absolute inset-0 z-20 h-2 w-full cursor-pointer opacity-0"
            />
            <div className="h-1.5 rounded-full bg-slate-700/70">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-white/80 bg-white opacity-0 transition group-hover:opacity-100" style={{ left: `calc(${progress}% - 6px)` }} />
          </div>
          <span className="text-xs text-slate-400 w-8 text-left">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Desktop Player */}
      <div className="hidden md:flex h-full items-center gap-5">
        <div className="min-w-0 flex w-[30%] items-center gap-3">
          <Link to={`/song/${currentSong._id}`}>
            <img src={cover} alt={currentSong.title} className="h-12 w-12 rounded-xl object-cover shadow-lg md:h-14 md:w-14" />
          </Link>

          <div className="min-w-0">
            <Link to={`/song/${currentSong._id}`} className="block truncate text-sm font-bold text-white hover:text-cyan-200 md:text-base">
              {currentSong.title}
            </Link>
            <p className="truncate text-xs text-slate-300 md:text-sm">{currentSong.artist || 'Unknown artist'}</p>
          </div>

          <button
            onClick={handleLike}
            className={`hidden md:inline-flex ${isLiked ? 'text-rose-300' : 'text-slate-300 hover:text-rose-300'} transition`}
            title={isLiked ? 'Bỏ yêu thích' : 'Yêu thích'}
          >
            <FaHeart size={16} />
          </button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-4 md:gap-5">
            <button onClick={toggleShuffle} className={`hidden md:inline-flex transition ${isShuffling ? 'text-cyan-300' : 'text-slate-400 hover:text-white'}`}>
              <FaRandom size={15} />
            </button>
            <button onClick={handleRewind} className="text-slate-300 transition hover:text-white" title="Rewind 10s">
              <FaBackward size={14} />
            </button>
            <button onClick={playPrev} className="text-slate-300 transition hover:text-white">
              <FaStepBackward size={16} />
            </button>

            <button
              onClick={togglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 text-[#0c1533] shadow-[0_0_24px_rgba(75,168,255,0.55)] transition hover:scale-105 md:h-11 md:w-11"
            >
              {isPlaying ? <FaPause size={14} /> : <FaPlay size={14} className="ml-0.5" />}
            </button>

            <button onClick={playNext} className="text-slate-300 transition hover:text-white">
              <FaStepForward size={16} />
            </button>
            <button onClick={handleForward} className="text-slate-300 transition hover:text-white" title="Forward 10s">
              <FaForward size={14} />
            </button>
            <button onClick={toggleLoop} className={`hidden md:inline-flex transition ${isLooping ? 'text-cyan-300' : 'text-slate-400 hover:text-white'}`}>
              <FaRedo size={15} />
            </button>
          </div>

          <div className="flex w-full max-w-xl items-center gap-2 md:gap-3">
            <span className="hidden w-11 text-right text-xs text-slate-400 sm:inline">{formatTime(currentTime)}</span>

            <div className="group relative flex-1">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="absolute inset-0 z-20 h-2 w-full cursor-pointer opacity-0"
              />
              <div className="h-1.5 rounded-full bg-slate-700/70">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${progress}%` }} />
              </div>
              <div className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-white/80 bg-white opacity-0 transition group-hover:opacity-100" style={{ left: `calc(${progress}% - 6px)` }} />
            </div>

            <span className="hidden w-11 text-left text-xs text-slate-400 sm:inline">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex w-[18%] min-w-[92px] items-center justify-end gap-2 md:w-[20%] md:gap-3">
          <button onClick={() => setShowQueue((prev) => !prev)} className={`hidden sm:inline-flex transition ${showQueue ? 'text-cyan-300' : 'text-slate-300 hover:text-white'}`}>
            <FaList size={15} />
          </button>

          <button
            onClick={() => setIsMuted((prev) => !prev)}
            className="text-slate-300 transition hover:text-white"
          >
            {volumeIcon}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(event) => {
              setIsMuted(false);
              setVolume(Number(event.target.value));
            }}
            className="hidden h-1 w-24 cursor-pointer appearance-none rounded-full bg-slate-700 accent-violet-400 md:block"
          />
        </div>
      </div>
      {/* End Desktop Player */}

      {showQueue && (
        <div className="animate-fade-in-up absolute bottom-[110%] right-3 w-80 max-h-[420px] overflow-y-auto rounded-2xl border border-blue-300/25 bg-[#10182f]/95 p-4 shadow-2xl md:right-5 lg:right-8">
          <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="text-sm font-bold text-white">Next Up</h4>
            <button onClick={() => setShowQueue(false)} className="text-slate-400 hover:text-rose-300">
              <FaTimes size={14} />
            </button>
          </div>

          <div className="space-y-2">
            {songList.map((song) => {
              const active = song._id === currentSong._id;
              return (
                <button
                  key={song._id}
                  onClick={() => playSong(song, songList)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-2.5 py-2 text-left transition ${active ? 'border-cyan-300/30 bg-cyan-400/10' : 'border-white/5 hover:bg-white/5'}`}
                >
                  <img
                    src={song.coverImage || song.thumbnail || 'https://via.placeholder.com/40'}
                    alt={song.title}
                    className="h-10 w-10 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-xs font-bold ${active ? 'text-cyan-200' : 'text-white'}`}>{song.title}</p>
                    <p className="truncate text-[11px] text-slate-400">{song.artist}</p>
                  </div>
                  {active && <span className="text-[10px] font-bold text-cyan-200">Playing</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;

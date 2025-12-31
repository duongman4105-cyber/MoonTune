import { createContext, useState, useContext } from 'react';

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songList, setSongList] = useState([]); // Danh sách bài hát hiện tại
  const [isLooping, setIsLooping] = useState(false); // Trạng thái lặp 1 bài
  const [isShuffling, setIsShuffling] = useState(false); // Trạng thái ngẫu nhiên

  const playSong = (song, list) => {
    setCurrentSong(song);
    setIsPlaying(true);
    if (list) setSongList(list); // Cập nhật danh sách nếu có
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleLoop = () => setIsLooping(!isLooping);
  const toggleShuffle = () => setIsShuffling(!isShuffling);

  // Chuyển bài tiếp theo
  const playNext = () => {
    if (!currentSong || songList.length === 0) return;
    
    let nextIndex;
    if (isShuffling) {
        // Nếu đang shuffle: Chọn ngẫu nhiên
        nextIndex = Math.floor(Math.random() * songList.length);
    } else {
        // Nếu bình thường: Chọn bài kế tiếp (vòng lại đầu nếu hết)
        const currentIndex = songList.findIndex(s => s._id === currentSong._id);
        nextIndex = (currentIndex + 1) % songList.length;
    }
    setCurrentSong(songList[nextIndex]);
    setIsPlaying(true);
  };

  // Quay lại bài trước
  const playPrev = () => {
    if (!currentSong || songList.length === 0) return;
    const currentIndex = songList.findIndex(s => s._id === currentSong._id);
    const prevIndex = (currentIndex - 1 + songList.length) % songList.length;
    setCurrentSong(songList[prevIndex]);
    setIsPlaying(true);
  };

  return (
    <PlayerContext.Provider value={{ 
        currentSong, isPlaying, setIsPlaying, playSong, togglePlay, 
        songList, setSongList,
        isLooping, toggleLoop,
        isShuffling, toggleShuffle,
        playNext, playPrev
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

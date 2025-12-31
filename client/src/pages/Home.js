import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { usePlayer } from '../context/PlayerContext';
import { useLocation } from 'react-router-dom';
import { FaPlay, FaHeart, FaUserPlus, FaEllipsisH, FaRetweet, FaTrash, FaStar, FaHeadphonesAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [songs, setSongs] = useState([]);
  const [sidebarData, setSidebarData] = useState({ likedSongs: [], history: [], albums: [] });
  const [menuOpenId, setMenuOpenId] = useState(null);
  const { playSong } = usePlayer();
  const { search } = useLocation();
  const { user, updateUser } = useAuth();

  // Danh mục giả lập để trang trí
  const categories = ["All", "Lofi Beats", "Piano Chill", "Jazz Vibes", "Study", "Sleep", "Synthwave", "Indie Pop"];
  const [activeCategory, setActiveCategory] = useState("All");

  const topArtists = [
    { name: "Son Tung M-TP", followers: "14.2M", image: "https://bhmedia.vn/wp-content/uploads/2025/11/son-tung-mtp-3.jpg" },
    { name: "Den Vau", followers: "5.8M", image: "https://vcdn1-vnexpress.vnecdn.net/2022/02/09/denvau-5827-1627546466-5337-1644377203.jpg?w=680&h=0&q=100&dpr=2&fit=crop&s=rpm2cgIdVzle7xKvlbBCaA" },
    { name: "HIEUTHUHAI", followers: "3.1M", image: "https://i.scdn.co/image/ab67616d00001e02c006b0181a3846c1c63e178f" },
    { name: "Negav", followers: "2.5M", image: "https://hosongoisao.com/wp-content/uploads/2025/07/logo-negav.jpg" },
  ];

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/songs${search}`);
        setSongs(res.data);
      } catch (err) {
        console.error("Error fetching songs:", err);
      }
    };
    fetchSongs();
  }, [search]);

  // Fetch Sidebar Data
  useEffect(() => {
    const fetchUserData = async () => {
        if (user) {
            try {
                const res = await axios.get(`http://localhost:5000/api/users/${user._id}`);
                const resAlbums = await axios.get(`http://localhost:5000/api/albums/user/${user._id}`);
                
                setSidebarData({
                    likedSongs: res.data.likedSongs || [],
                    history: res.data.history || [],
                    albums: resAlbums.data || []
                });
            } catch (err) {
                console.error(err);
            }
        }
    };
    fetchUserData();
  }, [user]);

  const handlePlay = async (song) => {
      playSong(song, songs); 
      try {
          await axios.put(`http://localhost:5000/api/songs/${song._id}/play`);
          if (user) {
             await axios.put(`http://localhost:5000/api/users/history/${song._id}`, {}, {
                headers: { token: `Bearer ${user.token}` }
             });
             setSidebarData(prev => ({
                 ...prev,
                 history: [song, ...prev.history.filter(s => s._id !== song._id)].slice(0, 20)
             }));
          }
      } catch (err) {
          console.error(err);
      }
  };

  // Hàm xử lý Play Mix (Phát ngẫu nhiên)
  const handlePlayMix = () => {
      if (songs.length > 0) {
          const randomIndex = Math.floor(Math.random() * songs.length);
          handlePlay(songs[randomIndex]);
      }
  };

  const handleLike = async (id) => {
      if (!user) return alert("Please login to like songs!");
      try {
          const res = await axios.put(`http://localhost:5000/api/users/like/${id}`, {}, {
             headers: { token: `Bearer ${user.token}` }
          });
          
          if (res.data === "Liked") {
              setSongs(songs.map(song => song._id === id ? { ...song, likes: song.likes + 1 } : song));
              updateUser({ likedSongs: [...(user.likedSongs || []), id] });
              const likedSong = songs.find(s => s._id === id);
              if(likedSong) {
                  setSidebarData(prev => ({ ...prev, likedSongs: [likedSong, ...prev.likedSongs] }));
              }
          } else {
              setSongs(songs.map(song => song._id === id ? { ...song, likes: song.likes - 1 } : song));
              updateUser({ likedSongs: (user.likedSongs || []).filter(songId => songId !== id) });
              setSidebarData(prev => ({ ...prev, likedSongs: prev.likedSongs.filter(s => s._id !== id) }));
          }
      } catch (err) {
          console.error(err);
      }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Bạn có chắc chắn muốn xóa bài hát này không? Hành động này không thể hoàn tác.")) return;
      try {
          await axios.delete(`http://localhost:5000/api/songs/${id}`, {
              headers: { token: `Bearer ${user.token}` }
          });
          setSongs(songs.filter(song => song._id !== id));
          setMenuOpenId(null);
          alert("Đã xóa bài hát thành công!");
      } catch (err) {
          console.error(err);
          alert("Xóa thất bại! Có lỗi xảy ra.");
      }
  };

  const formatNumber = (num) => {
    if (!num) return 0;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
  };

  // Hàm format thời gian (giây -> mm:ss)
  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
  };

  const SidebarTrack = ({ song }) => (
      <div className="flex gap-3 mb-4 group cursor-pointer hover:bg-white p-2 rounded-lg transition" onClick={() => handlePlay(song)}>
          <div className="relative w-12 h-12 flex-shrink-0">
              <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover rounded-lg shadow-sm" />
              <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center text-white rounded-lg">
                  <FaPlay size={10} />
              </div>
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
              <p className="text-xs text-gray-500 truncate hover:underline">{song.artist}</p>
              <p className="text-sm font-bold text-gray-700 truncate hover:text-[#FFB703]">{song.title}</p>
              
              <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1">
                  <span className="flex items-center gap-1"><FaPlay size={8} /> {formatNumber(song.plays)}</span>
                  <span className="flex items-center gap-1"><FaHeart size={8} /> {formatNumber(song.likes)}</span>
              </div>
          </div>
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-32 px-4">
      
      {/* 1. HERO BANNER (Mới) */}
      <div className="mt-6 mb-8 rounded-3xl overflow-hidden relative h-64 md:h-80 shadow-xl group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#A5D8FF] via-[#FFB703] to-[#FF9E00] opacity-90"></div>
          <img 
            src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80" 
            alt="Hero" 
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 group-hover:scale-105 transition duration-700"
          />
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 text-white">
              <span className="bg-white/20 backdrop-blur-md w-fit px-3 py-1 rounded-full text-xs font-bold mb-4 border border-white/30">TRENDING NOW</span>
              <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-md">Pastel Vibes <br/> & Chill Beats</h1>
              <p className="text-white/90 max-w-lg mb-6 text-sm md:text-base font-medium">Discover the smoothest tracks selected just for you. Relax, study, or just vibe with our curated collection.</p>
              <div className="flex gap-4">
                  <button 
                    onClick={handlePlayMix}
                    className="bg-white text-[#FFB703] px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition transform hover:-translate-y-1 flex items-center gap-2"
                  >
                      <FaPlay /> Play Mix
                  </button>
                  <button className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white/10 transition flex items-center gap-2">
                      <FaStar /> Favorites
                  </button>
              </div>
          </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cột Chính (Danh sách nhạc) */}
        <div className="flex-1">
            
            {/* 2. CATEGORY TABS (Mới) */}
            <div className="flex gap-3 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                {categories.map((cat, idx) => (
                    <button 
                        key={idx}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition shadow-sm border ${
                            activeCategory === cat 
                            ? 'bg-[#FFB703] text-white border-[#FFB703]' 
                            : 'bg-white text-gray-500 border-gray-100 hover:border-[#FFB703] hover:text-[#FFB703]'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-6 border-b border-[#A5D8FF]/30 pb-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-700 truncate flex items-center gap-2">
                    {search ? `Search: "${decodeURIComponent(search.split('=')[1])}"` : "Fresh Tracks"}
                    {!search && <FaHeadphonesAlt className="text-[#A5D8FF]" />}
                </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {songs.map((song) => {
                    const isLiked = user?.likedSongs?.includes(song._id);
                    const isOwner = user && (song.uploader === user._id);

                    return (
                    <div key={song._id} className="bg-white rounded-2xl p-3 group hover:shadow-xl hover:shadow-[#FFB703]/10 transition-all duration-300 border border-gray-50 hover:border-[#FFB703]/30 relative">
                        {/* Ảnh bìa */}
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl cursor-pointer mb-3" onClick={() => handlePlay(song)}>
                            <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <button className="w-12 h-12 bg-[#FFB703] rounded-full flex items-center justify-center text-white shadow-lg transform scale-0 group-hover:scale-100 transition duration-300 hover:bg-orange-400">
                                    <FaPlay className="ml-1 text-lg" />
                                </button>
                            </div>
                            {/* Hiển thị thời lượng đúng */}
                            <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm">
                                {formatDuration(song.duration)}
                            </span>
                        </div>

                        {/* Thông tin bài hát */}
                        <div className="flex flex-col">
                            <h3 className="font-bold text-gray-700 truncate text-base hover:text-[#FFB703] cursor-pointer transition mb-1" onClick={() => handlePlay(song)}>{song.title}</h3>
                            <p className="text-xs text-gray-400 truncate mb-3 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-[#A5D8FF]"></span>
                                {song.artist}
                            </p>
                            
                            {/* Stats */}
                            <div className="flex justify-between items-center text-xs text-gray-400 font-medium border-t border-gray-100 pt-3">
                                <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">▶ {formatNumber(song.plays)}</span>
                                <div className="flex gap-2 relative">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleLike(song._id); }} 
                                        className={`flex items-center gap-1 transition p-1.5 rounded-full hover:bg-red-50 ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                                        title="Like"
                                    >
                                        <FaHeart /> {formatNumber(song.likes)}
                                    </button>
                                    
                                    {isOwner && (
                                        <>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === song._id ? null : song._id); }}
                                                className="hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
                                            >
                                                <FaEllipsisH />
                                            </button>

                                            {menuOpenId === song._id && (
                                                <div className="absolute right-0 bottom-full mb-2 w-32 bg-white shadow-xl rounded-lg border border-gray-100 z-20 overflow-hidden animate-fade-in-up">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(song._id); }}
                                                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 font-bold transition"
                                                    >
                                                        <FaTrash /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )})}
            </div>
        </div>

        {/* Cột Phụ (Sidebar) */}
        <div className="w-full lg:w-80 hidden lg:block sticky top-24 h-fit space-y-8">
                {/* Top Artists */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#A5D8FF]/20">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Artists to Follow</h3>
                        <span className="text-xs text-[#A5D8FF] cursor-pointer hover:text-[#FFB703] font-bold">Refresh</span>
                    </div>
                    <ul className="space-y-4">
                        {topArtists.map((artist, idx) => (
                            <li key={idx} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#FAF7F2] overflow-hidden border-2 border-white shadow-sm group-hover:border-[#FFB703] transition">
                                        <img src={artist.image} alt="avatar" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-700 group-hover:text-[#FFB703] cursor-pointer truncate w-32">{artist.name}</p>
                                        <p className="text-xs text-gray-400">{artist.followers} followers</p>
                                    </div>
                                </div>
                                <button className="text-xs border border-[#A5D8FF] text-[#A5D8FF] px-3 py-1 rounded-full hover:bg-[#A5D8FF] hover:text-white transition flex items-center gap-1">
                                    <FaUserPlus />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* LIKED SONGS SECTION */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#A5D8FF]/20">
                    <div className="flex justify-between items-center mb-4 text-gray-500 border-b border-gray-100 pb-2">
                        <h3 className="text-xs font-bold uppercase text-gray-700 tracking-wider flex items-center gap-2">
                            <FaHeart className="text-red-400"/> Liked Songs
                        </h3>
                        <span className="text-xs cursor-pointer hover:text-[#FFB703] font-bold">View all</span>
                    </div>
                    
                    {sidebarData.likedSongs.length > 0 ? (
                        <div className="flex flex-col">
                            {sidebarData.likedSongs.slice(0, 3).map(song => (
                                <SidebarTrack key={song._id} song={song} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 italic text-center py-2">No likes yet.</p>
                    )}
                </div>

                {/* HISTORY SECTION */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#A5D8FF]/20">
                    <div className="flex justify-between items-center mb-4 text-gray-500 border-b border-gray-100 pb-2">
                        <h3 className="text-xs font-bold uppercase text-gray-700 tracking-wider flex items-center gap-2">
                            <FaRetweet className="text-blue-400"/> History
                        </h3>
                        <span className="text-xs cursor-pointer hover:text-[#FFB703] font-bold">View all</span>
                    </div>

                    {sidebarData.history.length > 0 ? (
                        <div className="flex flex-col">
                            {sidebarData.history.slice(0, 3).map(song => (
                                <SidebarTrack key={song._id} song={song} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 italic text-center py-2">No history yet.</p>
                    )}
                </div>

                {/* Footer Links */}
                <div className="text-[11px] text-gray-400 flex flex-wrap gap-x-3 gap-y-2 justify-center">
                    <span className="hover:text-[#FFB703] cursor-pointer transition">Legal</span>
                    <span className="hover:text-[#FFB703] cursor-pointer transition">Privacy</span>
                    <span className="hover:text-[#FFB703] cursor-pointer transition">Cookies</span>
                    <span className="hover:text-[#FFB703] cursor-pointer transition">About</span>
                    <span className="hover:text-[#FFB703] cursor-pointer transition">Contact</span>
                </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

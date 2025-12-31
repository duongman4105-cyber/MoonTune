import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaShareSquare, FaPencilAlt, FaHeart, FaPlay, FaCamera, FaMapMarkerAlt, FaLink, FaCalendarAlt } from 'react-icons/fa';
import axios from 'axios';
import { usePlayer } from '../context/PlayerContext';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { playSong } = usePlayer();
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [mySongs, setMySongs] = useState([]); 
  const [activeTab, setActiveTab] = useState('all');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [about, setAbout] = useState(""); // Thêm state About

  useEffect(() => {
    const fetchUserData = async () => {
        if (user) {
            try {
                const res = await axios.get(`http://localhost:5000/api/users/${user._id}`);
                setProfileData(res.data);

                const resSongs = await axios.get(`http://localhost:5000/api/songs?uploader=${user._id}`);
                setMySongs(resSongs.data);
            } catch (err) {
                console.error(err);
            }
        }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (user) {
        setEditName(user.username);
        // Lấy thông tin about từ user hoặc dùng mặc định
        setAbout(user.about || "Music lover, beat maker, and sound explorer. Sharing my journey through soundwaves. Contact for collabs! 🎵✨");
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    try {
      const res = await axios.put(`http://localhost:5000/api/users/${user._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'token': `Bearer ${user.token}`
        }
      });
      updateUser(res.data);
      setUploading(false);
    } catch (err) {
      console.error(err);
      setUploading(false);
      alert("Update failed!");
    }
  };

  // Đổi tên hàm và thêm logic lưu About
  const handleSaveProfile = async () => {
      if (!editName.trim()) return alert("Tên không được để trống");
      try {
          const formData = new FormData();
          formData.append('username', editName);
          formData.append('about', about); // Gửi thêm about

          const res = await axios.put(`http://localhost:5000/api/users/${user._id}`, formData, {
              headers: { 
                  'Content-Type': 'multipart/form-data',
                  'token': `Bearer ${user.token}` 
              }
          });
          updateUser(res.data);
          setIsEditing(false);
      } catch (err) {
          console.error(err);
          alert("Cập nhật thất bại!");
      }
  };

  const renderSongList = (songs, title) => (
    <div className="animate-fade-in-up">
        <h3 className="font-bold text-gray-800 mb-4 text-xl flex items-center gap-2">
            <span className="w-1 h-6 bg-[#FFB703] rounded-full"></span>
            {title}
        </h3>
        {songs && songs.length > 0 ? (
            <div className="flex flex-col gap-3">
                {songs.map((song, index) => (
                    <div key={song._id} className="flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 group">
                        <span className="text-gray-400 font-bold w-6 text-center">{index + 1}</span>
                        
                        <div className="relative w-14 h-14 flex-shrink-0 cursor-pointer" onClick={() => playSong(song)}>
                            <img src={song.coverImage} alt="cover" className="w-full h-full object-cover rounded-lg" />
                            <div className="absolute inset-0 bg-black/30 hidden group-hover:flex items-center justify-center text-white rounded-lg transition">
                                <FaPlay size={16} />
                            </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-800 truncate group-hover:text-[#FFB703] cursor-pointer" onClick={() => playSong(song)}>{song.title}</h4>
                            <p className="text-xs text-gray-500 truncate">{song.artist}</p>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-400 font-medium mr-2">
                            <span className="flex items-center gap-1"><FaPlay /> {song.plays}</span>
                            <span className="flex items-center gap-1"><FaHeart className={profileData?.likedSongs?.find(s => s._id === song._id) ? "text-red-500" : ""} /> {song.likes}</span>
                            <span className="hidden md:block">3:45</span>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 italic">No tracks found in this section.</p>
            </div>
        )}
    </div>
  );

  const renderTabContent = () => {
      switch (activeTab) {
          case 'popular':
              const popularSongs = [...mySongs].sort((a, b) => b.plays - a.plays).slice(0, 5);
              return renderSongList(popularSongs, "Most Popular Tracks");
          case 'uploaded':
              return renderSongList(mySongs, "Uploaded Tracks");
          case 'all':
          default:
              return (
                  <div className="space-y-8">
                      {profileData && renderSongList(profileData.history, "Recently Played")}
                      {profileData && renderSongList(profileData.likedSongs, "Liked Tracks")}
                  </div>
              );
      }
  };

  if (!user) return <div className="text-center mt-20 text-gray-500">Please login to view profile.</div>;

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-24 font-sans">
      
      {/* 1. HERO BANNER & USER INFO */}
      <div className="relative mb-24"> {/* Tăng margin bottom để tránh đè content */}
          {/* Banner Background */}
          <div className="h-[320px] w-full bg-gradient-to-br from-[#A5D8FF] via-[#FFD6A5] to-[#FFB703] relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#FFB703]/20 rounded-full blur-3xl"></div>
          </div>

          {/* User Info Container - Điều chỉnh vị trí */}
          <div className="max-w-7xl mx-auto px-6 absolute bottom-0 left-0 right-0 translate-y-1/3 flex flex-col md:flex-row items-end gap-6">
              
              {/* Avatar - Điều chỉnh kích thước và viền */}
              <div className="relative group">
                  <div className="w-40 h-40 md:w-52 md:h-52 rounded-full border-[6px] border-white shadow-2xl overflow-hidden bg-white">
                      <img 
                          src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random&size=200`} 
                          alt="avatar" 
                          className="w-full h-full object-cover"
                      />
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition duration-300 z-10">
                      <div className="flex flex-col items-center">
                          <FaCamera size={24} className="mb-1" />
                          <span className="text-xs font-bold">{uploading ? 'Uploading...' : 'Change'}</span>
                      </div>
                      <input type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" />
                  </label>
              </div>

              {/* Name & Stats - Căn chỉnh lại */}
              <div className="flex-1 pb-2 md:pb-6 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                      {isEditing ? (
                          <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-lg">
                              <input 
                                  type="text" 
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="text-2xl font-bold text-gray-800 px-2 py-1 outline-none border-b-2 border-[#FFB703]"
                                  autoFocus
                              />
                              <button onClick={handleSaveProfile} className="bg-[#FFB703] text-white px-3 py-1 rounded-md text-sm font-bold">Save</button>
                              <button onClick={() => { setIsEditing(false); setEditName(user.username); }} className="text-gray-500 px-2 text-sm">Cancel</button>
                          </div>
                      ) : (
                          <h1 className="text-3xl md:text-5xl font-black text-gray-800 drop-shadow-sm flex items-center gap-3 justify-center md:justify-start">
                              {user.username}
                              <span className="bg-[#FFB703] text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm align-middle self-start mt-2">Pro</span>
                          </h1>
                      )}
                  </div>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500 font-medium mb-4">
                      <span className="flex items-center gap-1"><FaMapMarkerAlt className="text-gray-400"/> Vietnam</span>
                      <span className="flex items-center gap-1"><FaLink className="text-gray-400"/>WavyCloud.com/{user.username}</span>
                      <span className="flex items-center gap-1"><FaCalendarAlt className="text-gray-400"/> Joined 2025</span>
                  </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pb-4">
                  <button 
                      onClick={() => setIsEditing(true)}
                      className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-gray-50 hover:border-gray-300 transition flex items-center gap-2"
                  >
                      <FaPencilAlt size={14} /> <span className="hidden sm:inline">Edit Profile</span>
                  </button>
                  <button className="bg-[#FFB703] text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-orange-400 transition flex items-center gap-2">
                      <FaShareSquare size={14} /> <span className="hidden sm:inline">Share</span>
                  </button>
              </div>
          </div>
      </div>

      {/* 2. MAIN LAYOUT */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-32 md:mt-20"> {/* Tăng margin top */}
          
          {/* LEFT CONTENT (8 Cols) */}
          <div className="lg:col-span-8">
              {/* Tabs */}
              <div className="flex gap-8 border-b border-gray-200 mb-8 overflow-x-auto scrollbar-hide">
                  {['all', 'popular', 'uploaded'].map((tab) => (
                      <button 
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`pb-3 text-sm font-bold uppercase tracking-wide transition whitespace-nowrap ${
                              activeTab === tab 
                              ? 'text-[#FFB703] border-b-2 border-[#FFB703]' 
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                      >
                          {tab === 'all' ? 'Overview' : tab}
                      </button>
                  ))}
              </div>

              {/* Content */}
              <div className="min-h-[300px]">
                  {renderTabContent()}
              </div>
          </div>

          {/* RIGHT SIDEBAR (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
              
              {/* Stats Box */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between text-center">
                  <div>
                      <div className="text-gray-400 text-xs font-bold uppercase mb-1">Tracks</div>
                      <div className="text-2xl font-black text-gray-800">{mySongs.length}</div>
                  </div>
                  <div className="w-[1px] bg-gray-100"></div>
                  <div>
                      <div className="text-gray-400 text-xs font-bold uppercase mb-1">Likes</div>
                      <div className="text-2xl font-black text-gray-800">{profileData?.likedSongs?.length || 0}</div>
                  </div>
                  <div className="w-[1px] bg-gray-100"></div>
                  <div>
                      <div className="text-gray-400 text-xs font-bold uppercase mb-1">History</div>
                      <div className="text-2xl font-black text-gray-800">{profileData?.history?.length || 0}</div>
                  </div>
              </div>

              {/* Likes Grid */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-700 flex items-center gap-2">
                          <FaHeart className="text-red-400" /> {profileData?.likedSongs?.length || 0} Likes
                      </h3>
                      <span className="text-xs text-gray-400 hover:text-[#FFB703] cursor-pointer">View all</span>
                  </div>
                  
                  {profileData?.likedSongs?.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                          {profileData.likedSongs.slice(0, 9).map(song => (
                              <div 
                                  key={song._id} 
                                  className="aspect-square rounded-lg overflow-hidden cursor-pointer relative group"
                                  onClick={() => playSong(song)}
                              >
                                  <img src={song.coverImage} alt="cover" className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                                  <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center">
                                      <FaPlay className="text-white drop-shadow-md" size={12} />
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-sm text-gray-400 italic">No likes yet.</p>
                  )}
              </div>

              {/* About / Bio Section - Có thể chỉnh sửa */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-gray-700">About</h3>
                      {isEditing && <span className="text-xs text-[#FFB703] font-bold">Editing...</span>}
                  </div>
                  
                  {isEditing ? (
                      <textarea 
                          className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#FFB703] min-h-[100px]"
                          value={about}
                          onChange={(e) => setAbout(e.target.value)}
                          placeholder="Tell us about yourself..."
                      />
                  ) : (
                      <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">
                          {about}
                      </p>
                  )}
              </div>

              <div className="text-xs text-gray-400 text-center pt-4">
                  © 2024 WaveCloud Inc.
              </div>
          </div>

      </div>
    </div>
  );
};

export default Profile;

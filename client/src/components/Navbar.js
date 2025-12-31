import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSearch, FaSignOutAlt, FaCloudUploadAlt, FaWaveSquare } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/?q=${search}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login'); // Chuyển hướng về trang đăng nhập sau khi thoát
  };

  return (
    <nav className="bg-white/90 backdrop-blur-sm text-gray-600 p-3 flex justify-between items-center sticky top-0 z-40 shadow-sm h-14 border-b border-[#A5D8FF]/30">
      {/* Logo WaveCloud mới */}
      <Link to="/" className="text-xl font-bold text-[#FFB703] flex items-center gap-2 ml-2 hover:opacity-80 transition">
        <span className="text-2xl drop-shadow-sm">☁️</span>
        <span className="flex items-center gap-1 tracking-tight">
            WaveCloud 
            <FaWaveSquare className="text-[#A5D8FF] text-sm animate-pulse" />
        </span>
      </Link>

      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 relative hidden md:block">
        <input 
            type="text" 
            placeholder="Search for artists, bands, tracks..." 
            className="w-full py-1.5 px-3 rounded-full bg-[#FAF7F2] border border-[#A5D8FF]/50 focus:outline-none focus:border-[#FFB703] text-sm text-gray-700 placeholder-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="absolute right-3 top-2 text-gray-400 hover:text-[#FFB703]"><FaSearch /></button>
      </form>

      <div className="flex items-center gap-4 text-sm font-medium mr-2">
        <Link to="/" className="hover:text-[#FFB703] text-gray-500 hidden sm:block">Home</Link>
        {user ? (
            <>
                <Link to="/upload" className="hover:text-[#FFB703] text-gray-500 flex items-center gap-1">
                    <FaCloudUploadAlt /> <span className="hidden sm:inline">Upload</span>
                </Link>
                
                {/* Đường kẻ dọc ngăn cách */}
                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                <div className="flex items-center gap-3">
                    <Link to="/profile" className="flex items-center gap-2 text-gray-500 select-none hover:text-[#FFB703] transition group">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 border border-gray-200 group-hover:border-[#FFB703]">
                             {/* Avatar nhỏ trên navbar */}
                             <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`} alt="avt" className="w-full h-full object-cover" />
                        </div>
                        <span className="hidden md:inline max-w-[100px] truncate font-medium">{user.username}</span>
                    </Link>
                    
                    {/* Nút Sign Out */}
                    <button 
                        onClick={handleLogout} 
                        className="flex items-center gap-1 bg-white hover:bg-red-50 text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-full transition text-xs font-bold border border-gray-200 hover:border-red-200 shadow-sm"
                        title="Sign Out"
                    >
                        <FaSignOutAlt /> <span className="hidden sm:inline">Sign Out</span>
                    </button>
                </div>
            </>
        ) : (
            <>
                <Link to="/login" className="border border-[#A5D8FF] px-4 py-1 rounded-full text-[#A5D8FF] hover:bg-[#A5D8FF] hover:text-white transition text-xs font-bold">Sign in</Link>
                <Link to="/register" className="bg-[#FFB703] px-4 py-1 rounded-full text-white hover:bg-orange-400 transition text-xs font-bold shadow-sm">Create account</Link>
            </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

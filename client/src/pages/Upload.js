import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaCloudUploadAlt } from 'react-icons/fa';

const Upload = () => {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [audio, setAudio] = useState(null);
  const [cover, setCover] = useState(null);
  const [duration, setDuration] = useState(0); // State lưu thời lượng
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAudioChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setAudio(file);
        // Lấy thời lượng bài hát
        const url = URL.createObjectURL(file);
        const audioEl = new Audio(url);
        audioEl.onloadedmetadata = () => {
            setDuration(audioEl.duration);
        };
      }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!audio || !title || !artist) return alert("Please fill all fields");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("artist", artist);
    formData.append("audio", audio);
    if (cover) formData.append("cover", cover);
    formData.append("duration", duration); // Gửi duration lên server

    setUploading(true);
    try {
      await axios.post("http://localhost:5000/api/songs", formData, {
        headers: { 
            "Content-Type": "multipart/form-data",
            token: `Bearer ${user.token}`
        },
      });
      setUploading(false);
      navigate("/");
    } catch (err) {
      console.error(err);
      setUploading(false);
      alert("Upload failed");
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-sm border border-[#A5D8FF]/30">
        <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center gap-2">
            <FaCloudUploadAlt className="text-[#FFB703]" /> Upload New Track
        </h2>
        <form onSubmit={handleUpload} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Title</label>
                <input type="text" className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-[#FFB703]" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Artist</label>
                <input type="text" className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-[#FFB703]" value={artist} onChange={(e) => setArtist(e.target.value)} required />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Audio File</label>
                <input type="file" accept="audio/*" className="w-full border border-gray-300 p-2 rounded" onChange={handleAudioChange} required />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">Cover Image (Optional)</label>
                <input type="file" accept="image/*" className="w-full border border-gray-300 p-2 rounded" onChange={(e) => setCover(e.target.files[0])} />
            </div>
            <button disabled={uploading} className="w-full bg-[#FFB703] text-white font-bold py-3 rounded hover:bg-orange-400 transition disabled:opacity-50">
                {uploading ? "Uploading..." : "Upload Track"}
            </button>
        </form>
    </div>
  );
};

export default Upload;

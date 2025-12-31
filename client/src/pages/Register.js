import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaMusic } from 'react-icons/fa';

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        username,
        email,
        password,
      });
      navigate("/login");
    } catch (err) {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Image Banner */}
      <div className="hidden lg:flex w-1/2 bg-cover bg-center relative bg-gray-900" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')" }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-12 text-white">
            <h2 className="text-5xl font-bold mb-4">Join the Community.</h2>
            <p className="text-lg text-gray-200 max-w-md">Create an account to save tracks, follow artists, and build your own playlists.</p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#FAF7F2]">
        <div className="max-w-md w-full">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#A5D8FF]/20 text-[#A5D8FF] mb-4">
                    <FaMusic size={20} />
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
                <p className="text-gray-500 mt-2">Start your musical journey today.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FaUser />
                        </div>
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-[#A5D8FF] focus:ring-2 focus:ring-[#A5D8FF]/20 outline-none transition bg-white"
                            placeholder="Choose a username"
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FaEnvelope />
                        </div>
                        <input 
                            type="email" 
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-[#A5D8FF] focus:ring-2 focus:ring-[#A5D8FF]/20 outline-none transition bg-white"
                            placeholder="Enter your email"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FaLock />
                        </div>
                        <input 
                            type="password" 
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-[#A5D8FF] focus:ring-2 focus:ring-[#A5D8FF]/20 outline-none transition bg-white"
                            placeholder="Create a password"
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="flex items-start text-sm text-gray-600">
                    <input type="checkbox" className="mt-1 mr-2 accent-[#A5D8FF]" required />
                    <span>I agree to the <button type="button" className="text-[#A5D8FF] font-bold hover:underline">Terms of Service</button> and <button type="button" className="text-[#A5D8FF] font-bold hover:underline">Privacy Policy</button>.</span>
                </div>

                {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">Something went wrong!</p>}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gray-800 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-black transition transform hover:-translate-y-0.5 disabled:opacity-70"
                >
                    {loading ? "Creating Account..." : "Sign Up"}
                </button>
            </form>

            <p className="text-center mt-8 text-gray-600">
                Already have an account? <Link to="/login" className="text-[#A5D8FF] font-bold hover:underline">Log in</Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

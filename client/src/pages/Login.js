import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGoogle, FaFacebookF, FaMusic } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      login(res.data);
      navigate("/");
    } catch (err) {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Image Banner */}
      <div className="hidden lg:flex w-1/2 bg-cover bg-center relative bg-gray-900" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1493225255756-d9584f8606e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')" }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-12 text-white">
            <h2 className="text-5xl font-bold mb-4">Feel the Rhythm.</h2>
            <p className="text-lg text-gray-200 max-w-md">Discover, stream, and share a constantly expanding mix of music from emerging and major artists around the world.</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#FAF7F2]">
        <div className="max-w-md w-full">
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FFB703]/20 text-[#FFB703] mb-4">
                    <FaMusic size={20} />
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
                <p className="text-gray-500 mt-2">Please enter your details to sign in.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FaEnvelope />
                        </div>
                        <input 
                            type="email" 
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-[#FFB703] focus:ring-2 focus:ring-[#FFB703]/20 outline-none transition bg-white"
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
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-[#FFB703] focus:ring-2 focus:ring-[#FFB703]/20 outline-none transition bg-white"
                            placeholder="••••••••"
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center text-gray-600 cursor-pointer">
                        <input type="checkbox" className="mr-2 accent-[#FFB703]" /> Remember me
                    </label>
                    <button type="button" className="text-[#FFB703] font-bold hover:underline">Forgot password?</button>
                </div>

                {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">Wrong email or password!</p>}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[#FFB703] text-white font-bold py-3 rounded-lg shadow-lg hover:bg-orange-400 transition transform hover:-translate-y-0.5 disabled:opacity-70"
                >
                    {loading ? "Signing in..." : "Sign In"}
                </button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-[#FAF7F2] text-gray-500">Or continue with</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button type="button" className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition bg-white text-gray-700 font-medium">
                        <FaGoogle className="text-red-500" /> Google
                    </button>
                    <button type="button" className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition bg-white text-gray-700 font-medium">
                        <FaFacebookF className="text-blue-600" /> Facebook
                    </button>
                </div>
            </form>

            <p className="text-center mt-8 text-gray-600">
                Don't have an account? <Link to="/register" className="text-[#FFB703] font-bold hover:underline">Sign up for free</Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

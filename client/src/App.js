import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import ErrorBoundary from './components/ErrorBoundary';

const Topbar = lazy(() => import('./components/Topbar'));
const Sidebar = lazy(() => import('./components/Sidebar'));
const Player = lazy(() => import('./components/Player'));

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Register = lazy(() => import('./pages/Register'));
const Upload = lazy(() => import('./pages/Upload'));
const Profile = lazy(() => import('./pages/Profile'));
const SongDetail = lazy(() => import('./pages/SongDetail'));
const Recent = lazy(() => import('./pages/Recent'));
const Admin = lazy(() => import('./pages/Admin'));

const AppLoader = () => (
  <div className="py-16 text-center text-slate-300">Đang tải nội dung...</div>
);

const AdminGuard = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <div className="text-slate-300">Vui lòng đăng nhập admin tại /admin/login.</div>;
  }

  if (!user.isAdmin) {
    return <div className="text-slate-300">Bạn không có quyền truy cập trang này.</div>;
  }

  return children;
};

const ProtectedRoute = ({ children, title, description }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-250px)] items-center justify-center">
        <div className="mx-auto w-full max-w-2xl rounded-3xl border border-cyan-300/25 bg-[#111a35]/85 p-8 text-center shadow-[0_24px_60px_rgba(8,14,36,0.45)]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Yêu cầu tài khoản</p>
          <h2 className="mt-3 text-3xl font-black text-white">{title || 'Bạn cần đăng nhập hoặc đăng ký'}</h2>
          <p className="mt-3 text-slate-300">
            {description || 'Để truy cập mục này, vui lòng đăng nhập hoặc tạo tài khoản mới.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              state={{ from: location.pathname }}
              className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-2.5 font-bold text-slate-900"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              state={{ from: location.pathname }}
              className="rounded-full border border-white/25 bg-white/10 px-6 py-2.5 font-bold text-white"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

const AppContent = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/admin/login';

  if (isAuthPage) {
    return (
      <Suspense fallback={<AppLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<AppLoader />}>
      <div className="app-shell min-h-screen text-slate-100">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:ml-[280px]">
          <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="px-4 pb-32 pt-24 sm:px-6 lg:px-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute
                    title="Đăng nhập để tải bài hát"
                    description="Trang Upload chỉ dành cho thành viên. Đăng nhập hoặc tạo tài khoản để đăng bài nhạc của bạn."
                  >
                    <Upload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute
                    title="Đăng nhập để xem trang cá nhân"
                    description="Bạn cần tài khoản để xem và chỉnh sửa trang hồ sơ của mình."
                  >
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:id"
                element={
                  <ProtectedRoute
                    title="Đăng nhập để xem hồ sơ người dùng"
                    description="Hồ sơ người dùng chỉ hiển thị cho thành viên đã đăng nhập."
                  >
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recent"
                element={
                  <ProtectedRoute
                    title="Đăng nhập để xem mục Gần đây"
                    description="Lịch sử nghe nhạc được lưu theo tài khoản, vui lòng đăng nhập để xem danh sách gần đây của bạn."
                  >
                    <Recent />
                  </ProtectedRoute>
                }
              />
              <Route path="/song/:id" element={<SongDetail />} />
              <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />
            </Routes>
          </main>
        </div>
        <Player />
      </div>
    </Suspense>
  );
};

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <PlayerProvider>
            <AppContent />
          </PlayerProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;

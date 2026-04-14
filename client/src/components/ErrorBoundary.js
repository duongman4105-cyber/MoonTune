import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0b1020] px-6 text-center text-white">
          <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
            <h1 className="text-3xl font-black">Có lỗi xảy ra</h1>
            <p className="mt-3 text-slate-300">
              Trang đã gặp lỗi hiển thị. Mình đã chặn màn hình trắng để bạn vẫn thấy thông báo này.
            </p>
            <button
              className="mt-6 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-3 font-bold text-slate-900"
              onClick={() => window.location.reload()}
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

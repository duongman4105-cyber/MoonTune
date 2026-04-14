import React, { memo, useEffect, useMemo, useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { FaPlay, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../utils/api';

const SongCard = memo(({ song, size = 'md' }) => {
  const { playSong, songList } = usePlayer();
  const cardSize = size === 'md' ? 'w-full' : 'w-full';
  const imgSize = size === 'md' ? 'h-48' : 'h-40';

  return (
    <div className={`min-w-0 ${cardSize}`}>
      <div
        className="block group relative cursor-pointer"
        onClick={() => playSong(song, songList)}
      >
        <img src={song.coverImage} alt={song.title} loading="lazy" decoding="async" className={`w-full ${imgSize} object-cover rounded-lg shadow-lg`} />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center rounded-lg transition-all duration-300">
          <FaPlay className="text-white text-4xl opacity-0 group-hover:opacity-100 transform group-hover:scale-110 transition-all duration-300" />
        </div>
      </div>
      <div className="mt-3 space-y-1 min-w-0">
        <Link to={`/song/${song._id}`} className="block text-base font-semibold leading-6 text-white break-words whitespace-normal hover:underline">{song.title}</Link>
        <p className="text-sm leading-5 text-gray-400 break-words whitespace-normal">{song.artist}</p>
      </div>
    </div>
  );
});

const WelcomeBanner = () => (
  <section className="relative mb-10 overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-[#1b2a7a] via-[#7c3aed] to-[#ec4899] p-8 text-white shadow-[0_22px_60px_rgba(20,12,55,0.5)] sm:p-10">
    <div className="hero-animated-image" />
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#070b1f]/75 via-[#2a1459]/45 to-[#0e1227]/70" />
    <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-cyan-300/25 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-20 left-1/4 h-56 w-56 rounded-full bg-fuchsia-200/20 blur-3xl" />
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_20%,rgba(255,255,255,0.16)_50%,transparent_80%)] opacity-40" />

    <div className="relative z-10 max-w-2xl animate-fade-in-up">
      <p className="mb-4 inline-flex rounded-full border border-white/35 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">
        Moontune Selection
      </p>
      <h1 className="text-3xl font-black leading-[1.1] tracking-tight text-white drop-shadow-[0_10px_28px_rgba(4,8,30,0.45)] sm:text-6xl sm:leading-[1.06]">
        <span className="block whitespace-nowrap">Bật cảm hứng nghe nhạc</span>
        <span className="mt-2 block">mỗi ngày</span>
      </h1>
      <p className="mt-6 max-w-xl text-base leading-8 text-slate-100/95 sm:text-xl sm:leading-9">
        Khám phá playlist theo tâm trạng, bản phát hành mới và những ca khúc đang gây bão trong cộng đồng.
      </p>

      <div className="mt-7 flex flex-wrap gap-2.5 text-xs font-bold sm:text-sm">
        <span className="rounded-full border border-white/35 bg-white/12 px-3.5 py-1.5">#Chill đêm khuya</span>
        <span className="rounded-full border border-white/35 bg-white/12 px-3.5 py-1.5">#Indie Việt</span>
        <span className="rounded-full border border-white/35 bg-white/12 px-3.5 py-1.5">#Top Trending</span>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/upload"
          className="rounded-full bg-white px-6 py-2.5 text-sm font-black text-[#2f2675] transition hover:-translate-y-0.5 hover:bg-cyan-100"
        >
          Tải bài hát của bạn
        </Link>
        <a
          href="#new-releases"
          className="rounded-full border border-white/50 bg-black/15 px-6 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-black/25"
        >
          Nghe ngay
        </a>
      </div>
    </div>
  </section>
);

const SongRow = memo(({ title, songs }) => {
  if (!songs || songs.length === 0) return null;
  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <Link to="/songs" className="text-sm font-semibold text-gray-400 hover:text-white">XEM THÊM</Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {songs.map((song) => <SongCard key={song._id} song={song} size="md" />)}
      </div>
    </section>
  );
});

const Home = () => {
  const location = useLocation();
  const searchKeyword = useMemo(() => (new URLSearchParams(location.search).get('q') || '').trim(), [location.search]);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [songs, setSongs] = useState([]);
  const [sliders, setSliders] = useState([]);
  const [featuredSongs, setFeaturedSongs] = useState([]);
  const [bannerAds, setBannerAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { setSongList } = usePlayer();

  useEffect(() => {
    const message = sessionStorage.getItem('moontune:welcome-message');
    if (!message) return;

    setWelcomeMessage(message);
    sessionStorage.removeItem('moontune:welcome-message');

    const timeoutId = setTimeout(() => setWelcomeMessage(''), 4000);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        setError('');
        const songsUrl = searchKeyword ? `/api/songs?q=${encodeURIComponent(searchKeyword)}` : '/api/songs';
        if (searchKeyword) {
          const songsRes = await api.get(songsUrl);
          const nextSongs = songsRes.data || [];
          setSongs(nextSongs);
          setSongList(nextSongs);
          setSliders([]);
          setFeaturedSongs([]);
          setBannerAds([]);
        } else {
          const [songsRes, configRes, bannerRes] = await Promise.all([
            api.get(songsUrl),
            api.get('/api/public/home-config'),
            api.get('/api/public/ads/banner'),
          ]);
          const nextSongs = songsRes.data || [];
          setSongs(nextSongs);
          setSongList(nextSongs);
          setSliders(configRes.data?.sliders || []);
          setFeaturedSongs(configRes.data?.featuredSongs || []);
          setBannerAds(bannerRes.data || []);
        }
      } catch (err) {
        console.error('Error fetching songs:', err);
        setError('Không thể tải danh sách bài hát. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, [setSongList, searchKeyword]);

  if (loading) {
    return <div className="py-20 text-center text-slate-300">Đang tải bài hát...</div>;
  }

  if (error) {
    return <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-center text-red-300">{error}</div>;
  }

  if (songs.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400">
        {searchKeyword
          ? `Không tìm thấy bài hát nào với từ khóa "${searchKeyword}".`
          : 'Chưa có bài hát nào trên hệ thống.'}
      </div>
    );
  }

  return (
    <div className="text-white">
      {welcomeMessage && (
        <div className="pointer-events-none fixed right-4 top-24 z-50 w-[min(92vw,420px)] animate-fade-in-up">
          <div className="pointer-events-auto rounded-2xl border border-emerald-300/35 bg-[#0f1e1b]/95 p-4 text-emerald-100 shadow-[0_22px_55px_rgba(16,185,129,0.25)] backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <FaCheckCircle className="mt-0.5 text-lg text-emerald-300" />
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Welcome</p>
                <p className="mt-1 text-sm font-semibold leading-6">{welcomeMessage}</p>
              </div>
              <button
                onClick={() => setWelcomeMessage('')}
                className="rounded-full border border-emerald-200/25 bg-emerald-300/10 p-1.5 text-emerald-100 transition hover:bg-emerald-300/20"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      )}

      {searchKeyword && (
        <section className="mb-6 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Kết quả tìm kiếm</p>
          <h2 className="mt-1 text-xl font-black text-white">"{searchKeyword}"</h2>
          <p className="mt-1 text-sm text-slate-300">Tìm thấy {songs.length} bài hát phù hợp.</p>
        </section>
      )}

      {sliders.length > 0 ? (
        <div className="mb-8 overflow-hidden rounded-2xl border border-white/10">
          {sliders.slice(0, 1).map((slider, idx) => (
            <a key={`${slider.imageUrl}-${idx}`} href={slider.linkUrl || '#'} className="relative block">
              <img src={slider.imageUrl} alt={slider.title || 'slider'} decoding="async" className="h-56 w-full object-cover sm:h-72" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent p-6">
                <h2 className="text-3xl font-black text-white">{slider.title || 'MOONTUNE'}</h2>
                <p className="mt-2 text-sm text-slate-200">{slider.subtitle || 'Âm nhạc được chọn lọc mỗi ngày'}</p>
              </div>
            </a>
          ))}
        </div>
      ) : <WelcomeBanner />}

      {searchKeyword ? (
        <SongRow title="Bài hát phù hợp" songs={songs} />
      ) : (
        <>
          {featuredSongs.length > 0 && <SongRow title="Featured by Admin" songs={featuredSongs.slice(0, 6)} />}
          <div id="new-releases">
            <SongRow title="New Releases" songs={songs.slice(0, 6)} />
          </div>
          <SongRow title="Popular Right Now" songs={songs.slice(6, 12)} />
        </>
      )}

      {bannerAds.length > 0 && (
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.16em] text-slate-400">Sponsored</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {bannerAds.slice(0, 2).map((ad) => (
              <a key={ad._id} href={ad.linkUrl || '#'} className="overflow-hidden rounded-xl border border-white/10">
                <img src={ad.imageUrl} alt={ad.title} loading="lazy" decoding="async" className="h-28 w-full object-cover" />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;

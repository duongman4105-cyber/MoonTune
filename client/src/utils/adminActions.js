import { api } from './api';

export const fetchAdminCore = async (headers) => {
  const [dashboardRes, usersRes, pendingRes, adsRes, notificationsRes] = await Promise.all([
    api.get('/api/admin/dashboard', { headers }),
    api.get('/api/admin/users', { headers }),
    api.get('/api/admin/songs/pending', { headers }),
    api.get('/api/admin/ads', { headers }),
    api.get('/api/admin/notifications', { headers }),
  ]);

  const [playsRes, growthRes, engagementRes] = await Promise.allSettled([
    api.get('/api/admin/analytics/plays?period=month', { headers }),
    api.get('/api/admin/analytics/growth', { headers }),
    api.get('/api/admin/analytics/engagement', { headers }),
  ]);

  return {
    dashboard: dashboardRes.data,
    users: usersRes.data || [],
    pendingSongs: pendingRes.data || [],
    ads: adsRes.data || [],
    notifications: notificationsRes.data || [],
    analytics: {
      plays: playsRes.status === 'fulfilled' ? (playsRes.value?.data || []) : [],
      growth: growthRes.status === 'fulfilled' ? (growthRes.value?.data || []) : [],
      engagement: engagementRes.status === 'fulfilled' ? (engagementRes.value?.data || []) : [],
    },
  };
};

export const fetchAdminUserSongs = async (userId, headers) => {
  const res = await api.get(`/api/admin/users/${userId}/songs`, { headers });
  return res.data || [];
};

export const toggleAdminRole = async ({ userId, isAdmin, headers }) => {
  const res = await api.put(`/api/admin/users/${userId}/role`, { isAdmin }, { headers });
  return res.data;
};

export const toggleAdminBlock = async ({ userId, isBlocked, blockedReason, headers }) => {
  const res = await api.put(
    `/api/admin/users/${userId}/block`,
    { isBlocked, blockedReason },
    { headers }
  );
  return res.data;
};

export const deleteAdminUser = async ({ userId, headers }) => {
  await api.delete(`/api/admin/users/${userId}`, { headers });
};

export const updateAdminBadges = async ({ userId, badges, headers }) => {
  const res = await api.put(`/api/admin/users/${userId}/badges`, { badges }, { headers });
  return res.data;
};

export const moderateAdminSong = async ({ songId, action, moderationNotes, qualityScore, copyrightStatus, headers }) => {
  await api.put(
    `/api/admin/songs/${songId}/moderate`,
    { action, moderationNotes, qualityScore, copyrightStatus },
    { headers }
  );
};

export const createAdminAd = async ({ payload, headers }) => {
  const res = await api.post('/api/admin/ads', payload, { headers });
  return res.data;
};

export const deleteAdminAd = async ({ adId, headers }) => {
  await api.delete(`/api/admin/ads/${adId}`, { headers });
};

export const saveAdminHomeConfig = async ({ homeConfig, headers }) => {
  await api.put('/api/admin/home-config', homeConfig, { headers });
};

export const createAdminNotification = async ({ payload, headers }) => {
  const res = await api.post('/api/admin/notifications', payload, { headers });
  return res.data;
};

export const deleteAdminNotification = async ({ notificationId, headers }) => {
  await api.delete(`/api/admin/notifications/${notificationId}`, { headers });
};
import { api } from './api';

const authHeaders = (token) => ({
  headers: {
    'Content-Type': 'multipart/form-data',
    token: `Bearer ${token}`,
  },
});

const jsonHeaders = (token) => ({
  headers: {
    token: `Bearer ${token}`,
  },
});

export const updateUserMedia = async ({ userId, token, fieldName, file }) => {
  const formData = new FormData();
  formData.append(fieldName, file);

  const res = await api.put(`/api/users/${userId}`, formData, authHeaders(token));
  return res.data;
};

export const updateUserProfile = async ({ userId, token, payload }) => {
  const res = await api.put(`/api/users/${userId}`, payload, jsonHeaders(token));
  return res.data;
};

export const deleteUserSong = async ({ songId, token }) => {
  await api.delete(`/api/songs/${songId}`, jsonHeaders(token));
};

export const createUserAlbum = async ({ userId, token, payload }) => {
  const res = await api.post(`/api/users/${userId}/albums`, payload, jsonHeaders(token));
  return res.data;
};
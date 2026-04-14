import { api } from './api';

const authHeaders = (token) => ({
  headers: {
    token: `Bearer ${token}`,
  },
});

export const likeSong = async ({ songId, token }) => {
  const res = await api.put(`/api/users/like/${songId}`, {}, authHeaders(token));
  return res.data;
};

export const submitSongComment = async ({ songId, text, token }) => {
  const res = await api.post(`/api/songs/${songId}/comment`, { text }, authHeaders(token));
  return res.data;
};

export const deleteSongComment = async ({ songId, commentId, token }) => {
  const res = await api.delete(`/api/songs/${songId}/comment/${commentId}`, authHeaders(token));
  return res.data;
};

export const editSongComment = async ({ songId, commentId, text, token }) => {
  const res = await api.put(`/api/songs/${songId}/comment/${commentId}`, { text }, authHeaders(token));
  return res.data;
};

export const replySongComment = async ({ songId, commentId, text, token }) => {
  const res = await api.post(`/api/songs/${songId}/comment/${commentId}/reply`, { text }, authHeaders(token));
  return res.data;
};

export const editSongReply = async ({ songId, commentId, replyId, text, token }) => {
  const res = await api.put(
    `/api/songs/${songId}/comment/${commentId}/reply/${replyId}`,
    { text },
    authHeaders(token)
  );
  return res.data;
};

export const deleteSongReply = async ({ songId, commentId, replyId, token }) => {
  const res = await api.delete(
    `/api/songs/${songId}/comment/${commentId}/reply/${replyId}`,
    authHeaders(token)
  );
  return res.data;
};
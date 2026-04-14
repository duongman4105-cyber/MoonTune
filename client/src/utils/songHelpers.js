import { DEFAULT_USER_AVATAR } from './defaults';

export const formatDuration = (time) => {
  const totalSeconds = Number(time);
  if (!totalSeconds || Number.isNaN(totalSeconds)) return '0:00';

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export const resolveAuthor = (entity, fallbackName = 'Unknown user') => {
  const author = entity?.userId;

  if (author && typeof author === 'object') {
    return {
      id: author._id,
      username: author.username || entity?.username || fallbackName,
      avatar: author.avatar || DEFAULT_USER_AVATAR,
    };
  }

  return {
    id: String(entity?.userId || ''),
    username: entity?.username || fallbackName,
    avatar: DEFAULT_USER_AVATAR,
  };
};
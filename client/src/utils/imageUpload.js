import { api } from './api';

// Upload ảnh qua backend admin để không phụ thuộc cấu hình Cloudinary phía client
export const uploadAdminImage = async ({ file, token, folder = 'admin-assets' }) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);

  try {
    const res = await api.post('/api/admin/upload-image', formData, {
      headers: {
        token: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data?.url;
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error(error?.response?.data?.message || 'Upload failed');
  }
};

// Get image preview from file
export const getImagePreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

import axiosInstance from '../api/axiosInstance';
import { AI_API } from '../config/apiConfig.js';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// type: 'title' | 'body' | 'comment'
export const rephraseText = async (text, type) => {
  const res = await axiosInstance.post(
    AI_API.REPHRASE,
    { text, type },
    { headers: getAuthHeaders() },
  );
  return res.data.data.text;
};

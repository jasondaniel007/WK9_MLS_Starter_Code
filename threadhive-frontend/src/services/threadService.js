import axiosInstance from '../api/axiosInstance';
import { THREAD_API } from '../config/apiConfig.js';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchRecentThreads = async () => {
  const res = await axiosInstance.get(THREAD_API.GET_ALL, {
    headers: getAuthHeaders(),
  });
  return res.data.data;
};

export const fetchThreadById = async (threadId) => {
  const res = await axiosInstance.get(THREAD_API.GET_BY_ID(threadId), {
    headers: getAuthHeaders(),
  });
  return res.data.data;
};

export const createThread = async (data) => {
  const res = await axiosInstance.post(THREAD_API.CREATE, data, {
    headers: getAuthHeaders(),
  });
  return res.data.data;
};

export const upvoteThread = async (threadId) => {
  const res = await axiosInstance.post(THREAD_API.UPVOTE(threadId), null, {
    headers: getAuthHeaders(),
  });
  return res.data.data;
};

export const downvoteThread = async (threadId) => {
  const res = await axiosInstance.post(THREAD_API.DOWNVOTE(threadId), null, {
    headers: getAuthHeaders(),
  });
  return res.data.data;
};

export const summarizeThread = async (threadId) => {
  const res = await axiosInstance.post(
    THREAD_API.SUMMARIZE(threadId),
    {},
    { headers: getAuthHeaders() },
  );
  return res.data.data.summary;
};

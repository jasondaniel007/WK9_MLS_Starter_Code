import axiosInstance from "../api/axiosInstance";
import { SUBREDDIT_API } from '../config/apiConfig.js';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchSubreddits = async () => {
  const res = await axiosInstance.get(SUBREDDIT_API.GET_ALL, {
    headers: getAuthHeaders(),
  });
  return res.data.data;
};

export const createSubreddit = async ({ name, description = '' }) => {
  const res = await axiosInstance.post(
    SUBREDDIT_API.CREATE,
    { name, description },
    { headers: getAuthHeaders() }
  );
  return res.data.data;
};

export const fetchSubredditWithThreads = async (subredditId) => {
  const res = await axiosInstance.get(SUBREDDIT_API.GET_BY_ID(subredditId), {
    headers: getAuthHeaders(),
  });
  return res.data.data;
};

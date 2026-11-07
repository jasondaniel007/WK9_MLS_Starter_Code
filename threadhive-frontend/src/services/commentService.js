import axiosInstance from "../api/axiosInstance";
import { COMMENT_API } from '../config/apiConfig.js';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchCommentsForThread = async (threadId) => {
  const res = await axiosInstance.get(COMMENT_API.GET_BY_THREAD(threadId), {
    headers: getAuthHeaders(),
  });
  return res.data.data;
};

export const postComment = async ({ threadId, content }) => {
  const res = await axiosInstance.post(COMMENT_API.CREATE, {
    thread: threadId,
    content,
  }, {
    headers: getAuthHeaders(),
  });
  return res.data.data;
};

export const upvoteComment = async (commentId) => {
  const res = await axiosInstance.post(COMMENT_API.UPVOTE(commentId), null, {
    headers: getAuthHeaders(),
  });
  return res.data.data;
};

export const downvoteComment = async (commentId) => {
  const res = await axiosInstance.post(COMMENT_API.DOWNVOTE(commentId), null, {
    headers: getAuthHeaders(),
  });
  return res.data.data;
};

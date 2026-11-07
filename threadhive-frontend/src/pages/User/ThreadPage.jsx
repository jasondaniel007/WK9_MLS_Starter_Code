import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchThreadById,
  clearThread,
} from "../../reducers/currentThreadSlice.js";
import {
  fetchComments,
  addComment,
  clearComments,
} from "../../reducers/commentSlice.js";

import ThreadCard from "../../components/ThreadList/ThreadCard";
import ThreadSummary from "../../components/Summary/ThreadSummary";
import CommentForm from "../../components/Comment/CommentForm";
import CommentList from "../../components/Comment/CommentList";
import { Container, Card, Button, Spinner, Alert } from "react-bootstrap";
import "./ThreadPage.css";

export default function Thread() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [commentText, setCommentText] = useState("");

  const {
    thread,
    loading: threadLoading,
    error: threadError,
  } = useSelector((state) => state.currentThread);

  const {
    comments: threadComments,
    loading: commentsLoading,
    error: commentsError,
  } = useSelector((state) => state.comments);

  useEffect(() => {
    if (threadId) {
      dispatch(fetchThreadById(threadId));
      dispatch(fetchComments(threadId));
    }

    return () => {
      dispatch(clearThread());
      dispatch(clearComments());
    };
  }, [dispatch, threadId]);

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    dispatch(addComment({ threadId, content: commentText }));
    setCommentText("");
  };

  if (threadError) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{threadError}</Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (threadLoading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading thread...</span>
        </Spinner>
        <p className="text-muted mt-3">Loading thread...</p>
      </Container>
    );
  }

  if (!thread) {
    return (
      <Container className="my-5">
        <Alert variant="warning">Thread not found</Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container className="thread-container">
      {/* Thread Card */}
      <div className="mb-4">
        <ThreadCard thread={thread} goBack={() => navigate(-1)} />
      </div>

      {/* AI Summary */}
      <ThreadSummary threadId={threadId} />

      {/* Post Comment Input */}
      <CommentForm
        commentText={commentText}
        onCommentChange={(e) => setCommentText(e.target.value)}
        onTextReplace={setCommentText}
        onPostComment={handlePostComment}
        disabled={!commentText.trim()}
      />

      {/* Comments Section */}
      <section className="mb-5">
        <div className="d-flex align-items-center justify-content-between mb-4 px-2">
          <h4 className="comments-header-title">💬 Comments</h4>
          <span className="comments-count">{threadComments.length} total</span>
        </div>

        {commentsError && (
          <Alert variant="danger" className="mb-3">
            Error loading comments: {commentsError}
          </Alert>
        )}

        {commentsLoading ? (
          <Card className="text-center py-4">
            <Card.Body>
              <Spinner animation="border" role="status" size="sm" />
              <p className="text-muted mt-2 mb-0">Loading comments...</p>
            </Card.Body>
          </Card>
        ) : threadComments.length > 0 ? (
          <CommentList />
        ) : (
          <Card className="no-comments-card">
            <Card.Body>
              <p className="no-comments-text">No comments yet. Be the first!</p>
            </Card.Body>
          </Card>
        )}
      </section>
    </Container>
  );
}

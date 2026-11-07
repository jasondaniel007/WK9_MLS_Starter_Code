import { useDispatch } from "react-redux";
import {
  upvoteThreadThunk,
  downvoteThreadThunk,
} from "../../reducers/threadListSlice";
import { Container, Card, Button, Row, Col, Stack } from "react-bootstrap";
import VoteButtons from "../Shared/VoteButtons";
import "./ThreadCard.css";

export default function ThreadCard({ thread, goBack }) {
  const dispatch = useDispatch();

  if (!thread) return <div>No thread found</div>;

  const handleUpvote = () => {
    dispatch(upvoteThreadThunk(thread._id));
  };

  const handleDownvote = () => {
    dispatch(downvoteThreadThunk(thread._id));
  };

  return (
    <Card className="single-thread-card">
      <Card.Body>
        {goBack && (
          <Button
            onClick={goBack}
            variant="link"
            size="sm"
            className="back-to-home-btn text-decoration-none"
          >
            <i className="bi bi-arrow-left me-2"></i>Back to Home
          </Button>
        )}

        <Row className="g-3">
          {/* Voting UI */}
          <Col xs="auto">
            <Stack gap={2} className="text-center vote-column">
              <VoteButtons
                count={thread.voteCount}
                onUpvote={handleUpvote}
                onDownvote={handleDownvote}
              />
            </Stack>
          </Col>

          {/* Thread content */}
          <Col>
            <h3 className="thread-title">{thread.title}</h3>
            <p className="thread-content">{thread.content}</p>

            <div className="d-flex gap-4 flex-wrap thread-meta">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-person-circle thread-meta-icon"></i>
                <span>
                  <strong className="thread-meta-author">
                    {thread.author?.name ?? "Unknown"}
                  </strong>
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-bookmark thread-meta-icon"></i>
                <span className="badge thread-meta-badge">
                  r/{thread.subreddit?.name ?? "unknown"}
                </span>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

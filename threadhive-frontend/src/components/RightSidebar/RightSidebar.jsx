import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Card, ListGroup, Badge, Row, Col } from "react-bootstrap";
import { fetchSubreddits } from "../../reducers/subredditSlice";
import "./RightSidebar.css";

function RightSidebar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { subreddits, loading, error } = useSelector((state) => state.subreddits);

  useEffect(() => {
    if (subreddits.length === 0 && !loading) {
      dispatch(fetchSubreddits());
    }
  }, [dispatch, subreddits.length, loading]);

  const hotSubreddits = useMemo(() => {
    return [...subreddits]
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 5);
  }, [subreddits]);

  const recentSubreddits = useMemo(() => {
    return [...subreddits].reverse().slice(0, 4);
  }, [subreddits]);

  const handleSubredditClick = (subredditId) => {
    navigate(`/home?subreddit=${subredditId}`);
  };

  return (
    <aside className="right-sidebar">
      {/* Hot Subreddits Card */}
      <Card className="mb-3 border-0 shadow-sm">
        <Card.Body className="p-3">
          <Card.Title className="h6 fw-bold mb-3 d-flex align-items-center" style={{ color: 'var(--text-dark)' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>🔥</span>
            <span style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Hot Communities</span>
          </Card.Title>
          {loading ? (
            <p className="text-muted small text-center">Loading...</p>
          ) : hotSubreddits.length > 0 ? (
            <ListGroup variant="flush">
              {hotSubreddits.map((subreddit, index) => (
                <ListGroup.Item
                  key={subreddit._id}
                  action
                  onClick={() => handleSubredditClick(subreddit._id)}
                  className="border-0 px-0"
                >
                  <Row className="align-items-start">
                    <Col xs="auto">
                      <Badge bg="secondary" pill className="fw-bold" style={{ fontSize: '10px', padding: '6px 10px' }}>
                        #{index + 1}
                      </Badge>
                    </Col>
                    <Col>
                      <div className="fw-bold small" style={{ color: 'var(--primary-blue)', fontSize: '13px' }}>r/{subreddit.name}</div>
                      {subreddit.description && (
                        <div className="small text-truncate" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {subreddit.description}
                        </div>
                      )}
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p className="text-muted small text-center">No communities found</p>
          )}
        </Card.Body>
      </Card>

      {/* Recently Added Card */}
      <Card className="mb-3 border-0 shadow-sm">
        <Card.Body className="p-3">
          <Card.Title className="h6 fw-bold mb-3 d-flex align-items-center" style={{ color: 'var(--text-dark)' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>✨</span>
            <span style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Recently Added</span>
          </Card.Title>
          {loading ? (
            <p className="text-muted small text-center">Loading...</p>
          ) : recentSubreddits.length > 0 ? (
            <ListGroup variant="flush">
              {recentSubreddits.map((subreddit) => (
                <ListGroup.Item
                  key={subreddit._id}
                  action
                  onClick={() => handleSubredditClick(subreddit._id)}
                  className="border-0 px-0"
                >
                  <div className="fw-bold small" style={{ color: 'var(--primary-orange)', fontSize: '13px' }}>r/{subreddit.name}</div>
                  {subreddit.description && (
                    <div className="small text-truncate" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {subreddit.description}
                    </div>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p className="text-muted small text-center">No recent communities</p>
          )}
        </Card.Body>
      </Card>
    </aside>
  );
}

export default RightSidebar;

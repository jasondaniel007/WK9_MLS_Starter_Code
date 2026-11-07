import { Card, Form, Button } from "react-bootstrap";
import RephraseButton from '../Shared/RephraseButton';
import './CommentForm.css';

export default function CommentForm({ commentText, onCommentChange, onPostComment, disabled, onTextReplace }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onPostComment) {
      onPostComment();
    }
  };

  return (
    <Card className="add-comment-section mb-4 border-0">
      <Card.Body>
        <h5 className="add-comment-title">Add a Comment</h5>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="commentTextarea" className="mb-3">
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Write a comment..."
              value={commentText}
              onChange={onCommentChange}
              required
              className="comment-textarea"
            />
            {onTextReplace && (
              <RephraseButton
                text={commentText}
                type="comment"
                onAccept={onTextReplace}
              />
            )}
          </Form.Group>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={disabled || !commentText?.trim()}
            className="post-comment-btn"
          >
            📝 Post Comment
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}

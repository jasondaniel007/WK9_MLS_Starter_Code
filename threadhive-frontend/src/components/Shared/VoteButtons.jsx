import { Button } from "react-bootstrap";

export default function VoteButtons({ count, onUpvote, onDownvote, ariaLabel = "item" }) {
  return (
    <>
      <Button 
        variant="light" 
        size="sm" 
        onClick={onUpvote} 
        aria-label={`Upvote ${ariaLabel}`}
        className="vote-btn"
      >
        <i className="bi bi-arrow-up"></i>
      </Button>
      <span className="vote-count">{count || 0}</span>
      <Button 
        variant="light" 
        size="sm" 
        onClick={onDownvote} 
        aria-label={`Downvote ${ariaLabel}`}
        className="vote-btn"
      >
        <i className="bi bi-arrow-down"></i>
      </Button>
    </>
  );
}

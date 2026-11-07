import { Row, Col, ButtonGroup, Button } from 'react-bootstrap';

export default function FilterSortBar({ sortBy, onSortChange }) {
  return (
    <Row className="mb-3">
      <Col>
        <div className="d-flex align-items-center gap-2">
          <span className="small fw-semibold" style={{ color: 'var(--text-muted)' }}>Sort by:</span>
          <ButtonGroup size="sm">
            <Button
              variant={sortBy === 'newest' ? 'primary' : 'outline-secondary'}
              onClick={() => onSortChange('newest')}
              className={sortBy === 'newest' ? 'sort-btn-active' : 'sort-btn'}
            >
              🆕 Newest
            </Button>
            <Button
              variant={sortBy === 'most-upvoted' ? 'primary' : 'outline-secondary'}
              onClick={() => onSortChange('most-upvoted')}
              className={sortBy === 'most-upvoted' ? 'sort-btn-active' : 'sort-btn'}
            >
              🔥 Most Upvoted
            </Button>
          </ButtonGroup>
        </div>
      </Col>
    </Row>
  );
}

import { useDispatch, useSelector } from "react-redux";
import { Button, Card, Spinner, Alert } from "react-bootstrap";
import { summarizeThread } from "../../reducers/currentThreadSlice.js";
import "./ThreadSummary.css";

export default function ThreadSummary({ threadId }) {
  const dispatch = useDispatch();
  const { summary, summaryLoading, summaryError } = useSelector(
    (state) => state.currentThread,
  );

  const handleSummarize = () => dispatch(summarizeThread(threadId));

  return (
    <section className="summary-section mb-4">
      <Button
        className="summarize-btn"
        onClick={handleSummarize}
        disabled={summaryLoading}
      >
        {summaryLoading ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-2"
            />
            Summarizing...
          </>
        ) : summary ? (
          "✨ Re-summarize"
        ) : (
          "✨ Summarize"
        )}
      </Button>

      {summaryError && (
        <Alert variant="danger" className="mt-3 mb-0" role="alert">
          Could not generate summary: {summaryError}
        </Alert>
      )}

      {summary && (
        <Card className="summary-card mt-3">
          <Card.Body>
            <h5 className="summary-title">AI Summary</h5>
            <p className="summary-text mb-0">{summary}</p>
          </Card.Body>
        </Card>
      )}
    </section>
  );
}

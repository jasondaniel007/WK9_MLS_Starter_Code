import { useState, useEffect, useRef } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import { rephraseText } from "../../services/aiService";
import { handleApiError } from "../../utils/handleApiError";
import "./RephraseButton.css";

/**
 * "Rephrase with AI" control for a single text field. Owns its own loading /
 * proposal / error state, never modifies the original text itself — the parent
 * only receives new text through onAccept.
 */
export default function RephraseButton({ text, type, onAccept }) {
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  // If the user edits the field, any in-flight request or shown proposal is stale.
  useEffect(() => {
    requestId.current += 1;
    setLoading(false);
    setProposal(null);
    setError(null);
  }, [text]);

  // Ignore results that arrive after unmount.
  useEffect(
    () => () => {
      requestId.current += 1;
    },
    [],
  );

  const handleRephrase = async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    setProposal(null);
    try {
      const result = await rephraseText(text, type);
      if (id !== requestId.current) return;
      setProposal(result);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(handleApiError(err) || "Failed to rephrase text");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  const handleAccept = () => {
    const accepted = proposal;
    setProposal(null);
    onAccept(accepted);
  };

  return (
    <div className="rephrase-wrapper">
      <Button
        type="button"
        size="sm"
        className="rephrase-btn"
        onClick={handleRephrase}
        disabled={loading || !text?.trim()}
        aria-label={`Rephrase ${type} with AI`}
      >
        {loading ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-2"
            />
            Rephrasing...
          </>
        ) : (
          "✨ Rephrase with AI"
        )}
      </Button>

      {error && (
        <Alert
          variant="danger"
          className="mt-2 mb-0"
          role="alert"
          dismissible
          onClose={() => setError(null)}
        >
          Could not rephrase: {error}
        </Alert>
      )}

      {proposal && (
        <div className="rephrase-proposal mt-2" data-testid={`rephrase-proposal-${type}`}>
          <div className="rephrase-proposal-label">Suggested rewrite</div>
          <p className="rephrase-proposal-text">{proposal}</p>
          <div className="rephrase-actions">
            <Button type="button" size="sm" variant="success" onClick={handleAccept}>
              Accept
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline-secondary"
              onClick={() => setProposal(null)}
            >
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

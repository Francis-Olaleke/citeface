
import { useEffect, useState } from "react";

import {
  getMyDrafts,
  type DraftStory,
} from "../services/stories";

import "./MyDrafts.css";

interface MyDraftsProps {
  onOpenDraft: (draft: DraftStory) => void;
  refreshKey?: number;
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function MyDrafts({
  onOpenDraft,
  refreshKey = 0,
}: MyDraftsProps) {
  const [drafts, setDrafts] = useState<DraftStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadDrafts() {
      setLoading(true);
      setError(null);

      try {
        const result = await getMyDrafts();

        if (!cancelled) {
          setDrafts(result.drafts);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your saved drafts."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDrafts();

    return () => {
      cancelled = true;
    };
  }, [refresh, refreshKey]);

  return (
    <section className="panel my-drafts">
      <div className="my-drafts-header">
        <div>
          <h2 className="panel-heading">My research drafts</h2>
          <p className="my-drafts-description">
            Continue working on research stories you have saved.
          </p>
        </div>

        {!loading && !error && (
          <span className="draft-count">
            {drafts.length} {drafts.length === 1 ? "draft" : "drafts"}
          </span>
        )}
      </div>

      {loading && (
        <p className="draft-state" aria-live="polite">
          Loading your drafts...
        </p>
      )}

      {!loading && error && (
        <div className="draft-state" role="alert">
          <p>{error}</p>

          <button
            type="button"
            className="draft-retry-button"
            onClick={() => setRefresh((current) => current + 1)}
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && drafts.length === 0 && (
        <div className="draft-state">
          <h3>No saved drafts yet</h3>
          <p>
            Your unfinished research stories will appear here.
            Start creating a story to save your first draft.
          </p>
        </div>
      )}

      {!loading && !error && drafts.length > 0 && (
        <div className="draft-list">
          {drafts.map((draft) => (
            <article className="draft-item" key={draft.id}>
              <div className="draft-item-content">
                <h3>{draft.title}</h3>

                <p>{draft.summary}</p>

                <div className="draft-item-meta">
                  <span>{formatLabel(draft.classification)}</span>
                  <span>
                    Updated {formatDate(draft.updatedAt)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="draft-open-button"
                onClick={() => onOpenDraft(draft)}
              >
                Open draft
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default MyDrafts;

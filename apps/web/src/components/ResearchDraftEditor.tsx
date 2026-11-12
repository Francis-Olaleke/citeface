import PublishStoryForm from "./PublishStoryForm";
import { useEffect, useState } from "react";
import {
  updateStoryDraft,
  type DraftStory,
} from "../services/stories";
import "./ResearchDraftEditor.css";

interface ResearchDraftEditorProps {
  draft: DraftStory;
  onClose: () => void;
  onSaved: (story: DraftStory) => void;
  onPublished: () => void;
}

const classifications = [
  {
    value: "PEER_REVIEWED_ARTICLE",
    label: "Peer-reviewed article",
  },
  { value: "PREPRINT", label: "Preprint" },
  {
    value: "THESIS_DISSERTATION",
    label: "Thesis or dissertation",
  },
  {
    value: "CONFERENCE_PAPER",
    label: "Conference paper",
  },
  {
    value: "RESEARCH_REPORT",
    label: "Research report",
  },
  {
    value: "AUTHOR_DESCRIBED_PROJECT",
    label: "Author-described project",
  },
  {
    value: "PRELIMINARY_UNPUBLISHED",
    label: "Preliminary unpublished research",
  },
];

function ResearchDraftEditor({
  draft,
  onClose,
  onSaved,
  onPublished,
}: ResearchDraftEditorProps) {
  const [title, setTitle] = useState(draft.title);
  const [summary, setSummary] = useState(draft.summary);
  const [classification, setClassification] = useState(
    draft.classification,
  );
  const [researchQuestion, setResearchQuestion] = useState(
    draft.researchQuestion ?? "",
  );
  const [methodology, setMethodology] = useState(
    draft.methodology ?? "",
  );
  const [findings, setFindings] = useState(draft.findings ?? "");
  const [significance, setSignificance] = useState(
    draft.significance ?? "",
  );
  const [limitations, setLimitations] = useState(
    draft.limitations ?? "",
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setTitle(draft.title);
    setSummary(draft.summary);
    setClassification(draft.classification);
    setResearchQuestion(draft.researchQuestion ?? "");
    setMethodology(draft.methodology ?? "");
    setFindings(draft.findings ?? "");
    setSignificance(draft.significance ?? "");
    setLimitations(draft.limitations ?? "");
    setError("");
    setSuccess("");
  }, [draft.id, draft.updatedAt]);

  const hasChanges =
    title.trim() !== draft.title ||
    summary.trim() !== draft.summary ||
    classification !== draft.classification ||
    (researchQuestion.trim() || null) !== draft.researchQuestion ||
    (methodology.trim() || null) !== draft.methodology ||
    (findings.trim() || null) !== draft.findings ||
    (significance.trim() || null) !== draft.significance ||
    (limitations.trim() || null) !== draft.limitations;

  async function handleSave(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!title.trim() || !summary.trim()) {
      setError("Title and summary are required.");
      return;
    }

    if (!hasChanges) {
      setError("Make a change before saving your draft.");
      return;
    }

    setSaving(true);

    try {
      const result = await updateStoryDraft(draft.id, {
        title: title.trim(),
        summary: summary.trim(),
        classification,
        researchQuestion: researchQuestion.trim() || null,
        methodology: methodology.trim() || null,
        findings: findings.trim() || null,
        significance: significance.trim() || null,
        limitations: limitations.trim() || null,
        changeNote: "Updated through the Citeface research editor",
      });

      setSuccess("Your research draft has been saved.");
      onSaved(result.story);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your draft. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="research-editor panel">
      <div className="research-editor-header">
        <div>
          <p className="research-editor-eyebrow">
            MY RESEARCH
          </p>
          <h2>Edit research draft</h2>
          <p>
            Develop your research story before making it public.
          </p>
        </div>

        <button
          type="button"
          className="research-editor-close"
          onClick={onClose}
          disabled={saving}
        >
          Close
        </button>
      </div>

      <form onSubmit={handleSave}>
        <div className="research-editor-field">
          <label htmlFor="draft-title">Research title</label>
          <input
            id="draft-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            required
          />
          <small>{title.length}/200 characters</small>
        </div>

        <div className="research-editor-field">
          <label htmlFor="draft-summary">Research summary</label>
          <textarea
            id="draft-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            maxLength={500}
            rows={4}
            required
          />
          <small>{summary.length}/500 characters</small>
        </div>

        <div className="research-editor-field">
          <label htmlFor="draft-classification">
            Research classification
          </label>
          <select
            id="draft-classification"
            value={classification}
            onChange={(event) =>
              setClassification(event.target.value)
            }
          >
            {classifications.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="research-editor-divider" />

        <h3>Research details</h3>
        <p className="research-editor-section-description">
          Add more context to help readers understand your work.
          These fields are optional.
        </p>

        <div className="research-editor-field">
          <label htmlFor="draft-question">
            Research question or objective
          </label>
          <textarea
            id="draft-question"
            value={researchQuestion}
            onChange={(event) =>
              setResearchQuestion(event.target.value)
            }
            maxLength={10000}
            rows={4}
          />
        </div>

        <div className="research-editor-field">
          <label htmlFor="draft-methodology">Methodology</label>
          <textarea
            id="draft-methodology"
            value={methodology}
            onChange={(event) =>
              setMethodology(event.target.value)
            }
            maxLength={10000}
            rows={4}
          />
        </div>

        <div className="research-editor-field">
          <label htmlFor="draft-findings">Findings</label>
          <textarea
            id="draft-findings"
            value={findings}
            onChange={(event) => setFindings(event.target.value)}
            maxLength={10000}
            rows={4}
          />
        </div>

        <div className="research-editor-field">
          <label htmlFor="draft-significance">
            Significance of the research
          </label>
          <textarea
            id="draft-significance"
            value={significance}
            onChange={(event) =>
              setSignificance(event.target.value)
            }
            maxLength={10000}
            rows={4}
          />
        </div>

        <div className="research-editor-field">
          <label htmlFor="draft-limitations">Limitations</label>
          <textarea
            id="draft-limitations"
            value={limitations}
            onChange={(event) =>
              setLimitations(event.target.value)
            }
            maxLength={10000}
            rows={4}
          />
        </div>

        {error && (
          <p className="research-editor-message error" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p
            className="research-editor-message success"
            role="status"
          >
            {success}
          </p>
        )}

        <div className="research-editor-actions">
          <button
            type="button"
            className="research-editor-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="research-editor-save"
            disabled={saving || !hasChanges}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
            <PublishStoryForm
        draftId={draft.id}
        onPublished={onPublished}
      />
    </section>
  );
}

export default ResearchDraftEditor;

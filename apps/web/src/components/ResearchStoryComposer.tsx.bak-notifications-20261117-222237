
import { useState } from "react";
import {
  createStoryDraft,
  type CreateDraftPayload,
  type DraftStory,
} from "../services/stories";
import "./ResearchStoryComposer.css";

interface ResearchStoryComposerProps {
  onCreated: (draft: DraftStory) => void;
  onCancel: () => void;
}

const classifications = [
  ["PEER_REVIEWED_ARTICLE", "Peer-reviewed article"],
  ["PREPRINT", "Preprint"],
  ["THESIS_DISSERTATION", "Thesis or dissertation"],
  ["CONFERENCE_PAPER", "Conference paper"],
  ["RESEARCH_REPORT", "Research report"],
  ["AUTHOR_DESCRIBED_PROJECT", "Author-described project"],
  ["PRELIMINARY_UNPUBLISHED", "Preliminary unpublished research"],
] as const;

function ResearchStoryComposer({
  onCreated,
  onCancel,
}: ResearchStoryComposerProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [classification, setClassification] =
    useState<CreateDraftPayload["classification"]>(
      "AUTHOR_DESCRIBED_PROJECT",
    );
  const [researchQuestion, setResearchQuestion] = useState("");
  const [methodology, setMethodology] = useState("");
  const [findings, setFindings] = useState("");
  const [significance, setSignificance] = useState("");
  const [limitations, setLimitations] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (!title.trim() || !summary.trim()) {
      setError("Research title and summary are required.");
      return;
    }

    setSaving(true);

    try {
      const result = await createStoryDraft({
        title: title.trim(),
        summary: summary.trim(),
        classification,
        researchQuestion: researchQuestion.trim(),
        methodology: methodology.trim(),
        findings: findings.trim(),
        significance: significance.trim(),
        limitations: limitations.trim(),
      });

      onCreated(result.story);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your research draft.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="research-composer panel">
      <div className="research-composer-header">
        <div>
          <p className="research-composer-eyebrow">
            MY RESEARCH
          </p>
          <h2>Create a research story</h2>
          <p>
            Capture your research, explain your findings and
            share your knowledge with the research community.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="research-composer-field">
          <label htmlFor="new-story-title">
            Research title
          </label>
          <input
            id="new-story-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            placeholder="Give your research a clear title"
            required
          />
          <small>{title.length}/200 characters</small>
        </div>

        <div className="research-composer-field">
          <label htmlFor="new-story-summary">
            Research summary
          </label>
          <textarea
            id="new-story-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Briefly explain what your research is about..."
            required
          />
          <small>{summary.length}/500 characters</small>
        </div>

        <div className="research-composer-field">
          <label htmlFor="new-story-classification">
            Research classification
          </label>
          <select
            id="new-story-classification"
            value={classification}
            onChange={(event) =>
              setClassification(
                event.target.value as CreateDraftPayload["classification"],
              )
            }
          >
            {classifications.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="research-composer-divider" />

        <h3>Additional research details</h3>
        <p className="research-composer-description">
          These fields are optional. You can complete them now
          or return to your draft later.
        </p>

        {[
          {
            id: "new-story-question",
            label: "Research question or objective",
            value: researchQuestion,
            setter: setResearchQuestion,
          },
          {
            id: "new-story-methodology",
            label: "Methodology",
            value: methodology,
            setter: setMethodology,
          },
          {
            id: "new-story-findings",
            label: "Findings",
            value: findings,
            setter: setFindings,
          },
          {
            id: "new-story-significance",
            label: "Significance of the research",
            value: significance,
            setter: setSignificance,
          },
          {
            id: "new-story-limitations",
            label: "Limitations",
            value: limitations,
            setter: setLimitations,
          },
        ].map((field) => (
          <div className="research-composer-field" key={field.id}>
            <label htmlFor={field.id}>{field.label}</label>
            <textarea
              id={field.id}
              value={field.value}
              onChange={(event) => field.setter(event.target.value)}
              maxLength={10000}
              rows={4}
            />
          </div>
        ))}

        {error && (
          <p className="research-composer-error" role="alert">
            {error}
          </p>
        )}

        <div className="research-composer-actions">
          <button
            type="button"
            className="research-composer-cancel"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="research-composer-submit"
            disabled={saving}
          >
            {saving ? "Saving draft..." : "Save as draft"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default ResearchStoryComposer;

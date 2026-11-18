import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import {
  deletePublishedStory,
  getPublicStory,
  StoriesServiceError,
  updatePublishedStory,
  type PublicStory,
} from "../services/stories";
import "./published-story-owner-actions.css";

interface PublishedStoryOwnerActionsProps {
  story: PublicStory;
  onStoryUpdated: (story: PublicStory) => void;
}

const EDIT_WINDOW_MS = 15 * 60 * 1000;

export function PublishedStoryOwnerActions({
  story,
  onStoryUpdated,
}: PublishedStoryOwnerActionsProps) {
  const { user, loading: authLoading } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState(story.title);
  const [summary, setSummary] = useState(story.summary);
  const [researchQuestion, setResearchQuestion] = useState(
    story.researchQuestion ?? "",
  );
  const [methodology, setMethodology] = useState(story.methodology ?? "");
  const [findings, setFindings] = useState(story.findings ?? "");
  const [significance, setSignificance] = useState(story.significance ?? "");
  const [limitations, setLimitations] = useState(story.limitations ?? "");
  const [changeNote, setChangeNote] = useState("");

  if (authLoading || !user || user.id !== story.creator.id) {
    return null;
  }

  const publishedAt = new Date(story.publishedAt).getTime();
  const editWindowOpen =
    Number.isFinite(publishedAt) &&
    Date.now() - publishedAt < EDIT_WINDOW_MS;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      await updatePublishedStory(story.id, {
        title,
        summary,
        researchQuestion: researchQuestion || null,
        methodology: methodology || null,
        findings: findings || null,
        significance: significance || null,
        limitations: limitations || null,
        changeNote: changeNote || undefined,
      });

      const refreshedStory = await getPublicStory(story.slug);
      onStoryUpdated(refreshedStory.story);
      setEditing(false);
      notify("Your published research story has been updated.", {
        type: "success",
      });
    } catch (error) {
      notify(
        error instanceof StoriesServiceError
          ? error.message
          : "We couldn't update your story. Please try again.",
        { type: "error" },
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;

    const confirmed = window.confirm(
      "Delete this published research story? It will be removed from public discovery. This action cannot be undone from your account.",
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      await deletePublishedStory(story.id);
      notify("Your research story has been deleted.", { type: "success" });
      navigate("/");
    } catch (error) {
      notify(
        error instanceof StoriesServiceError
          ? error.message
          : "We couldn't delete your story. Please try again.",
        { type: "error" },
      );
      setDeleting(false);
    }
  }

  return (
    <section className="cf-owner-actions" aria-label="Your story controls">
      <div className="cf-owner-actions__bar">
        <div>
          <strong>Your published story</strong>
          <p>
            {editWindowOpen
              ? "You can make direct edits during the first 15 minutes after publishing."
              : "The direct editing window has closed. Use the correction process for subsequent changes."}
          </p>
        </div>

        <div className="cf-owner-actions__buttons">
          {editWindowOpen && (
            <button
              type="button"
              className="cf-owner-actions__edit"
              onClick={() => setEditing((current) => !current)}
              disabled={saving || deleting}
            >
              {editing ? "Close editor" : "Edit story"}
            </button>
          )}

          <button
            type="button"
            className="cf-owner-actions__delete"
            onClick={handleDelete}
            disabled={deleting || saving}
          >
            {deleting ? "Deleting…" : "Delete story"}
          </button>
        </div>
      </div>

      {editing && editWindowOpen && (
        <form className="cf-owner-actions__form" onSubmit={handleSave}>
          <label>
            Story title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              required
            />
          </label>

          <label>
            Summary
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              maxLength={500}
              rows={3}
              required
            />
          </label>

          <label>
            Research question
            <textarea
              value={researchQuestion}
              onChange={(event) => setResearchQuestion(event.target.value)}
              maxLength={10000}
              rows={3}
            />
          </label>

          <label>
            Methodology
            <textarea
              value={methodology}
              onChange={(event) => setMethodology(event.target.value)}
              maxLength={10000}
              rows={3}
            />
          </label>

          <label>
            Findings
            <textarea
              value={findings}
              onChange={(event) => setFindings(event.target.value)}
              maxLength={10000}
              rows={3}
            />
          </label>

          <label>
            Significance
            <textarea
              value={significance}
              onChange={(event) => setSignificance(event.target.value)}
              maxLength={10000}
              rows={3}
            />
          </label>

          <label>
            Limitations
            <textarea
              value={limitations}
              onChange={(event) => setLimitations(event.target.value)}
              maxLength={10000}
              rows={3}
            />
          </label>

          <label>
            Change note <span>(optional)</span>
            <input
              value={changeNote}
              onChange={(event) => setChangeNote(event.target.value)}
              maxLength={1000}
              placeholder="Briefly describe what you changed"
            />
          </label>

          <div className="cf-owner-actions__form-buttons">
            <button
              type="button"
              className="cf-owner-actions__cancel"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cf-owner-actions__save"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
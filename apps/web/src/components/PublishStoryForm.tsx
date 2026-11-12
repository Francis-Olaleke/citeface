
import { useState } from "react";
import {
  publishStory,
  type PublishStoryAuthor,
  type PublishedStory,
  type StoryAuthorRole,
} from "../services/stories";

interface PublishStoryFormProps {
  draftId: string;
  onPublished: (story: PublishedStory) => void;
}

interface AuthorEntry extends PublishStoryAuthor {
  id: number;
}

const authorRoles: {
  value: StoryAuthorRole;
  label: string;
}[] = [
  { value: "LEAD_AUTHOR", label: "Lead author" },
  { value: "CO_AUTHOR", label: "Co-author" },
  { value: "CONTRIBUTOR", label: "Contributor" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "ADVISER", label: "Adviser" },
  { value: "OTHER", label: "Other" },
];

function PublishStoryForm({
  draftId,
  onPublished,
}: PublishStoryFormProps) {
  const [authors, setAuthors] = useState<AuthorEntry[]>([
    {
      id: 1,
      displayName: "",
      affiliationText: "",
      role: "LEAD_AUTHOR",
      isCorresponding: false,
    },
  ]);

  const [attestation, setAttestation] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  function updateAuthor(
    id: number,
    changes: Partial<PublishStoryAuthor>,
  ) {
    setAuthors((current) =>
      current.map((author) =>
        author.id === id
          ? { ...author, ...changes }
          : author,
      ),
    );
  }

  function addAuthor() {
    if (authors.length >= 20) return;

    setAuthors((current) => [
      ...current,
      {
        id: Math.max(...current.map((author) => author.id)) + 1,
        displayName: "",
        affiliationText: "",
        role: "CO_AUTHOR",
        isCorresponding: false,
      },
    ]);
  }

  function removeAuthor(id: number) {
    setAuthors((current) =>
      current.filter((author) => author.id !== id),
    );
  }

  async function handlePublish(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    const validAuthors = authors.filter(
      (author) => author.displayName.trim(),
    );

    if (validAuthors.length !== authors.length) {
      setError("Please provide a name for every listed author.");
      return;
    }

    if (validAuthors.length === 0) {
      setError("Add at least one author before publishing.");
      return;
    }

    if (
      validAuthors.filter(
        (author) => author.role === "LEAD_AUTHOR",
      ).length !== 1
    ) {
      setError("Exactly one author must be designated as the lead author.");
      return;
    }

    if (!attestation) {
      setError("Please confirm the author attribution declaration.");
      return;
    }

    const payload = {
      attestation: true as const,
      authors: validAuthors.map((author) => ({
        displayName: author.displayName.trim(),
        affiliationText:
          author.affiliationText?.trim() || undefined,
        role: author.role,
        isCorresponding: author.isCorresponding ?? false,
      })),
    };

    setPublishing(true);

    try {
      const result = await publishStory(draftId, payload);
      onPublished(result.story);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to publish your research story. Please try again.",
      );
    } finally {
      setPublishing(false);
    }
  }

  return (
    <section className="publish-story-section">
      <div className="research-editor-divider" />

      <h3>Publish your research story</h3>

      <p className="research-editor-section-description">
        Add the people responsible for this research before making
        your story publicly available.
      </p>

      <form onSubmit={handlePublish}>
        <div className="publish-authors-list">
          {authors.map((author, index) => (
            <div className="publish-author-card" key={author.id}>
              <div className="publish-author-heading">
                <h4>Author {index + 1}</h4>

                {authors.length > 1 && (
                  <button
                    type="button"
                    className="research-editor-secondary"
                    onClick={() => removeAuthor(author.id)}
                    disabled={publishing}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="research-editor-field">
                <label htmlFor={`author-name-${author.id}`}>
                  Full name
                </label>
                <input
                  id={`author-name-${author.id}`}
                  value={author.displayName}
                  onChange={(event) =>
                    updateAuthor(author.id, {
                      displayName: event.target.value,
                    })
                  }
                  minLength={1}
                  maxLength={200}
                  required
                  disabled={publishing}
                />
              </div>

              <div className="research-editor-field">
                <label htmlFor={`author-affiliation-${author.id}`}>
                  Affiliation (optional)
                </label>
                <input
                  id={`author-affiliation-${author.id}`}
                  value={author.affiliationText ?? ""}
                  onChange={(event) =>
                    updateAuthor(author.id, {
                      affiliationText: event.target.value,
                    })
                  }
                  maxLength={300}
                  placeholder="University, institution or organisation"
                  disabled={publishing}
                />
              </div>

              <div className="research-editor-field">
                <label htmlFor={`author-role-${author.id}`}>
                  Contribution role
                </label>
                <select
                  id={`author-role-${author.id}`}
                  value={author.role}
                  onChange={(event) =>
                    updateAuthor(author.id, {
                      role: event.target.value as StoryAuthorRole,
                    })
                  }
                  disabled={publishing}
                >
                  {authorRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="publish-corresponding-option">
                <input
                  type="checkbox"
                  checked={author.isCorresponding ?? false}
                  onChange={(event) =>
                    updateAuthor(author.id, {
                      isCorresponding: event.target.checked,
                    })
                  }
                  disabled={publishing}
                />
                Corresponding author
              </label>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="research-editor-secondary publish-add-author"
          onClick={addAuthor}
          disabled={publishing || authors.length >= 20}
        >
          + Add another author
        </button>

        <div className="publish-attestation">
          <label>
            <input
              type="checkbox"
              checked={attestation}
              onChange={(event) =>
                setAttestation(event.target.checked)
              }
              disabled={publishing}
            />
            <span>
              I confirm that I have the authority to submit this
              research story and to list the named co-authors and
              contributors.
            </span>
          </label>
        </div>

        {error && (
          <p className="research-editor-message error" role="alert">
            {error}
          </p>
        )}

        <div className="research-editor-actions">
          <button
            type="submit"
            className="research-editor-save publish-submit"
            disabled={publishing || !attestation}
          >
            {publishing
              ? "Publishing..."
              : "Publish research story"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default PublishStoryForm;

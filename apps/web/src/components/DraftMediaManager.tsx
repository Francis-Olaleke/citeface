import { useEffect, useRef, useState } from "react";
import {
  getDraftMedia,
  uploadMedia,
  StoryMediaError,
  type DraftMediaAttachment,
} from "../services/story-media";
import "./DraftMediaManager.css";

interface DraftMediaManagerProps {
  draftId: string;
}

export default function DraftMediaManager({
  draftId,
}: DraftMediaManagerProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  const [attachments, setAttachments] = useState<
    DraftMediaAttachment[]
  >([]);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");

    try {
      setAttachments(await getDraftMedia(draftId));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load draft media."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [draftId]);

  const mediaType = attachments.find(
    (item) => item.media.status !== "FAILED"
  )?.media.type;

  const imageCount = attachments.filter(
    (item) => item.media.type === "IMAGE"
  ).length;

  const hasVideo = attachments.some(
    (item) => item.media.type === "VIDEO"
  );

  const accept = hasVideo
    ? "video/mp4"
    : "image/jpeg,image/png,image/webp,video/mp4";

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setMessage("");

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type === "video/mp4";

    if (!isImage && !isVideo) {
      setError("Choose a JPEG, PNG, WebP image or MP4 video.");
      event.target.value = "";
      return;
    }

    if (mediaType && mediaType !== (isImage ? "IMAGE" : "VIDEO")) {
      setError("A draft cannot mix image and video attachments.");
      event.target.value = "";
      return;
    }

    if (isVideo && file.size > 500 * 1024 * 1024) {
      setError("The video exceeds the 500 MB upload limit.");
      event.target.value = "";
      return;
    }

    if (isImage && file.size > 10 * 1024 * 1024) {
      setError("The image exceeds the 10 MB upload limit.");
      event.target.value = "";
      return;
    }

    if (isVideo && hasVideo) {
      setError("Only one video can be attached to a story.");
      event.target.value = "";
      return;
    }

    if (isImage && imageCount >= 10) {
      setError("A story can contain up to 10 images.");
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      await uploadMedia(draftId, file, caption);
      setCaption("");
      setMessage("Upload completed. Refreshing attachment status...");
      await refresh();
    } catch (err) {
      setError(
        err instanceof StoryMediaError || err instanceof Error
          ? err.message
          : "The upload failed."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <section className="draft-media-manager">
      <div className="draft-media-heading">
        <div>
          <h3>Story media</h3>
          <p>
            Attach up to 10 images or one MP4 video to this draft.
          </p>
        </div>
        <button
          type="button"
          className="draft-media-refresh"
          onClick={() => void refresh()}
          disabled={loading || uploading}
        >
          Refresh
        </button>
      </div>

      <label className="draft-media-caption-label" htmlFor="media-caption">
        Caption (optional)
      </label>
      <input
        id="media-caption"
        className="draft-media-caption"
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        maxLength={500}
        placeholder="Add a caption for this media"
        disabled={uploading}
      />

      <div className="draft-media-upload">
        <input
          ref={fileInput}
          type="file"
          accept={accept}
          onChange={(event) => void handleUpload(event)}
          disabled={uploading || hasVideo || imageCount >= 10}
        />
        {uploading && <span>Uploading media...</span>}
      </div>

      {error && (
        <p className="draft-media-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="draft-media-message" role="status">
          {message}
        </p>
      )}

      {loading ? (
        <p>Loading attachments...</p>
      ) : attachments.length === 0 ? (
        <p className="draft-media-empty">
          No media attached to this draft yet.
        </p>
      ) : (
        <ul className="draft-media-list">
          {attachments.map((attachment) => (
            <li key={attachment.id}>
              <div>
                <strong>
                  {attachment.media.type === "VIDEO" ? "Video" : "Image"}{" "}
                  {attachment.sortOrder + 1}
                </strong>
                {attachment.caption && <p>{attachment.caption}</p>}
                <small>
                  {attachment.media.mimeType} ·{" "}
                  {attachment.media.status}
                  {attachment.media.durationSeconds
                    ? ` · ${attachment.media.durationSeconds}s`
                    : ""}
                </small>
                {attachment.media.errorCode && (
                  <small className="draft-media-error">
                    {attachment.media.errorCode}
                  </small>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
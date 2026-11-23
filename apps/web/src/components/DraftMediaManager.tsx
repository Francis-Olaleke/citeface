import { useEffect, useRef, useState } from "react";
import {
  getDraftMedia,
  removeDraftMedia,
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
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [previewErrors, setPreviewErrors] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function refresh(showLoading = true) {
    if (showLoading) setLoading(true);
    setError("");

    try {
      setAttachments(await getDraftMedia(draftId));
      setPreviewErrors({});
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

  useEffect(() => {
    const hasPendingMedia = attachments.some((item) =>
      ["PENDING_UPLOAD", "UPLOADING", "PROCESSING"].includes(item.media.status),
    );

    if (!hasPendingMedia || uploading) return;

    const intervalId = window.setInterval(() => {
      void refresh(false);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [attachments, draftId, uploading]);

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

  async function handleRemove(attachment: DraftMediaAttachment) {
    setError("");
    setMessage("");
    setRemovingId(attachment.id);

    try {
      await removeDraftMedia(draftId, attachment.id);
      setAttachments((current) =>
        current
          .filter((item) => item.id !== attachment.id)
          .map((item, index) => ({ ...item, sortOrder: index })),
      );
      setConfirmRemoveId(null);
      setMessage("Media removed from this draft.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not remove this media. Please try again.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "PENDING_UPLOAD":
        return "Waiting for upload";
      case "UPLOADING":
        return "Uploading";
      case "PROCESSING":
        return "Processing";
      case "READY":
        return "Ready to publish";
      case "FAILED":
        return "Processing failed";
      default:
        return status.replaceAll("_", " ").toLowerCase();
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
        {uploading && (
          <span role="status">Uploading media to secure storage...</span>
        )}
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
          {attachments.map((attachment) => {
            const isReady = attachment.media.status === "READY";

            return (
              <li key={attachment.id}>
                {isReady &&
                  attachment.media.deliveryUrl &&
                  !previewErrors[attachment.id] && (
                  attachment.media.type === "VIDEO" ? (
                    <video
                      className="draft-media-preview"
                      src={attachment.media.deliveryUrl}
                      controls
                      preload="metadata"
                      aria-label={attachment.caption || "Draft research video"}
                      onError={() =>
                        setPreviewErrors((current) => ({
                          ...current,
                          [attachment.id]: true,
                        }))
                      }
                    />
                  ) : (
                    <img
                      className="draft-media-preview"
                      src={attachment.media.deliveryUrl}
                      alt={attachment.caption || "Draft research image"}
                      onError={() =>
                        setPreviewErrors((current) => ({
                          ...current,
                          [attachment.id]: true,
                        }))
                      }
                    />
                  )
                )}

                <div className="draft-media-details">
                  <div className="draft-media-title">
                    <strong>
                      {attachment.media.type === "VIDEO" ? "Video" : "Image"}{" "}
                      {attachment.sortOrder + 1}
                    </strong>
                    <span
                      className={`draft-media-status draft-media-status-${attachment.media.status.toLowerCase()}`}
                      role="status"
                    >
                      {getStatusLabel(attachment.media.status)}
                    </span>
                  </div>
                  {attachment.caption && <p>{attachment.caption}</p>}
                  <small>
                    {attachment.media.mimeType}
                    {attachment.media.width && attachment.media.height
                      ? ` · ${attachment.media.width} × ${attachment.media.height}`
                      : ""}
                    {attachment.media.durationSeconds
                      ? ` · ${attachment.media.durationSeconds}s`
                      : ""}
                  </small>
                  {!isReady && ["PENDING_UPLOAD", "UPLOADING", "PROCESSING"].includes(attachment.media.status) && (
                    <p className="draft-media-processing">
                      {attachment.media.status === "PROCESSING"
                        ? "Your media is being prepared. This list updates automatically."
                        : "Upload is in progress."}
                    </p>
                  )}
                  {attachment.media.errorCode && (
                    <p className="draft-media-error" role="alert">
                      {attachment.media.errorCode}. Remove this attachment and
                      upload it again.
                    </p>
                  )}
                  {isReady &&
                    (!attachment.media.deliveryUrl ||
                      previewErrors[attachment.id]) && (
                      <p className="draft-media-error" role="status">
                        The media is ready, but its preview could not be loaded.
                        Refresh the attachment status or remove and upload it
                        again.
                      </p>
                    )}
                  {confirmRemoveId === attachment.id ? (
                    <div className="draft-media-remove-confirm">
                      <span>Remove this media from the draft?</span>
                      <button
                        type="button"
                        onClick={() => void handleRemove(attachment)}
                        disabled={removingId === attachment.id}
                      >
                        {removingId === attachment.id ? "Removing..." : "Confirm remove"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveId(null)}
                        disabled={removingId === attachment.id}
                      >
                        Keep media
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="draft-media-remove"
                      onClick={() => setConfirmRemoveId(attachment.id)}
                      disabled={uploading || removingId !== null}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
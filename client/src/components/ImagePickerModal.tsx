import { Dispatch, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ConfirmationModal, Loading } from "@/components";
import { ActionType } from "@/context/types";
import { backendAPI } from "@/utils/backendAPI";
import { setErrorMessage } from "@/utils/setErrorMessage";

// ──────────────────────────────────────────────────────────────────────────
//  IMAGE PICKER MODAL
// ──────────────────────────────────────────────────────────────────────────
//  All image-editing affordances live here: paste a URL, upload to S3, or
//  browse previously-uploaded images. Each option funnels through `onChange`
//  so the parent state is always in sync — the modal stays open after a
//  selection so the admin can keep editing, and closes on its own Close
//  button (or Escape).
//
//  Rendered via createPortal so it lifts above whatever parent modal opened
//  it, regardless of nested stacking contexts.
// ──────────────────────────────────────────────────────────────────────────

interface UploadItem {
  key: string;
  url: string;
  fileName: string;
  ownerProfileId: string;
  ownedByMe: boolean;
  size: number;
  lastModified: string | null;
}

interface ImagePickerModalProps {
  value: string;
  onChange: (next: string) => void;
  onClose: () => void;
  dispatch: Dispatch<ActionType> | null;
  initialTab?: "browse" | "upload";
  title?: string;
}

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const isAllowedFile = (file: File): { ok: boolean; reason?: string } => {
  if (!ALLOWED_MIME.includes(file.type)) {
    return { ok: false, reason: "Only PNG, JPG, WebP, and GIF images are allowed." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, reason: `File too large. Max ${MAX_BYTES / 1024 / 1024} MB.` };
  }
  return { ok: true };
};

export const ImagePickerModal = ({
  value,
  onChange,
  onClose,
  dispatch,
  initialTab = "upload",
  title = "Choose an image",
}: ImagePickerModalProps) => {
  const [tab, setTab] = useState<"browse" | "upload">(initialTab);
  const [items, setItems] = useState<UploadItem[] | null>(null);
  const [filterText, setFilterText] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<UploadItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchList = useCallback(async () => {
    try {
      const res = await backendAPI.get("/uploads");
      setItems(res.data?.items || []);
    } catch (err) {
      setItems([]);
      setErrorMessage(dispatch, err as Parameters<typeof setErrorMessage>[1]);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Close on Escape unless a destructive action is in flight
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy && !pendingDelete) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy, pendingDelete]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    const needle = filterText.trim().toLowerCase();
    return items.filter((it) => {
      if (onlyMine && !it.ownedByMe) return false;
      if (needle && !it.fileName.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [items, filterText, onlyMine]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await backendAPI.delete("/uploads", { data: { key: pendingDelete.key } });
      setItems((prev) => (prev || []).filter((i) => i.key !== pendingDelete.key));
      // If the deleted file was the currently-selected URL, clear it.
      if (value === pendingDelete.url) onChange("");
    } catch (err) {
      setErrorMessage(dispatch, err as Parameters<typeof setErrorMessage>[1]);
    } finally {
      setBusy(false);
      setPendingDelete(null);
    }
  };

  const uploadFile = async (file: File) => {
    const check = isAllowedFile(file);
    if (!check.ok) {
      setUploadError(check.reason || "Invalid file");
      return;
    }
    setUploadError(null);
    setBusy(true);
    setUploadProgress(0);
    try {
      const signRes = await backendAPI.post("/uploads/sign", {
        filename: file.name,
        contentType: file.type,
        size: file.size,
      });
      const { url, fields, publicUrl } = signRes.data as {
        url: string;
        fields: Record<string, string>;
        publicUrl: string;
      };

      const form = new FormData();
      for (const [k, v] of Object.entries(fields)) form.append(k, v);
      form.append("file", file);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(form);
      });

      onChange(publicUrl);
      await fetchList();
    } catch (err) {
      setUploadError((err as Error).message || "Upload failed");
    } finally {
      setBusy(false);
      setUploadProgress(null);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  return createPortal(
    <div className="modal-container" role="dialog" aria-modal="true" aria-labelledby="image-picker-title">
      <div className="modal" style={{ maxHeight: "90vh", display: "flex", flexDirection: "column", maxWidth: 720 }}>
        <h4 id="image-picker-title">{title}</h4>

        {/* URL input + Clear — always visible; live-updates the parent. */}
        <label htmlFor="image-picker-url" className="text-left mt-2">
          Image URL
        </label>
        <div className="flex gap-2 items-center">
          <input
            id="image-picker-url"
            className="input"
            type="text"
            placeholder="https://example.com/image.png or pick one below"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            style={{ flex: 1 }}
          />
          {value && (
            <a className="p3" onClick={() => onChange("")} aria-label="Clear image URL">
              Clear
            </a>
          )}
        </div>

        <div className="tab-container mt-3">
          <button type="button" className={tab === "upload" ? "btn" : "btn btn-text"} onClick={() => setTab("upload")}>
            Upload
          </button>
          <button type="button" className={tab === "browse" ? "btn" : "btn btn-text"} onClick={() => setTab("browse")}>
            Browse
          </button>
        </div>

        {tab === "browse" && (
          <div className="mt-3" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div className="flex items-center" style={{ gap: 8 }}>
              <input
                className="input"
                type="text"
                placeholder="Filter by name…"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                aria-label="Filter images by name"
                style={{ flex: 1 }}
              />
              <label className="flex items-center" style={{ gap: 6, whiteSpace: "nowrap" }}>
                <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
                Only mine
              </label>
            </div>

            {items === null ? (
              <Loading />
            ) : filteredItems.length === 0 ? (
              <p className="p2 mt-4 text-center">
                {items.length === 0
                  ? "No uploads yet — switch to the Upload tab to add one."
                  : "No images match that filter."}
              </p>
            ) : (
              <div
                className="mt-3"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: 12,
                  overflowY: "auto",
                  paddingRight: 4,
                }}
              >
                {filteredItems.map((item) => {
                  const isSelected = item.url === value;
                  return (
                    <div
                      key={item.key}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        border: `2px solid ${isSelected ? "#1b3dcd" : "var(--paper-line, #e6decf)"}`,
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "#fff",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onChange(item.url)}
                        aria-label={`Use ${item.fileName}`}
                        aria-pressed={isSelected}
                        style={{
                          position: "relative",
                          padding: 0,
                          border: "none",
                          background: "#f5f5f5",
                          aspectRatio: "1 / 1",
                          cursor: "pointer",
                        }}
                      >
                        <img
                          src={item.url}
                          alt={item.fileName}
                          loading="lazy"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </button>
                      <div style={{ padding: "6px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
                        <span
                          title={item.fileName}
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.fileName}
                        </span>
                        <div className="flex items-center justify-between" style={{ fontSize: 11, opacity: 0.7 }}>
                          <span>{formatBytes(item.size)}</span>
                          {item.ownedByMe ? (
                            <button
                              type="button"
                              className="btn btn-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingDelete(item);
                              }}
                              aria-label={`Delete ${item.fileName}`}
                              title="Delete this upload"
                              style={{ width: 26, height: 26, minHeight: 26, padding: 0 }}
                            >
                              <img
                                src="https://sdk-style.s3.amazonaws.com/icons/delete.svg"
                                alt=""
                                aria-hidden="true"
                                style={{ width: 14, height: 14 }}
                              />
                            </button>
                          ) : (
                            <span title="Uploaded by another admin">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "upload" && (
          <div className="mt-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Drag an image here or click to choose a file"
              style={{
                border: `2px dashed ${dragOver ? "#1b3dcd" : "#bbb"}`,
                background: dragOver ? "#eef2ff" : "#fafafa",
                borderRadius: 12,
                padding: "32px 16px",
                textAlign: "center",
                cursor: "pointer",
                transition: "background 120ms, border-color 120ms",
              }}
            >
              <p className="p2" style={{ marginBottom: 4, fontWeight: 600 }}>
                Drag an image here, or click to choose a file
              </p>
              <p className="p3" style={{ opacity: 0.7 }}>
                PNG, JPG, WebP, or GIF · max {MAX_BYTES / 1024 / 1024} MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_MIME.join(",")}
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadFile(file);
                  e.target.value = "";
                }}
              />
            </div>

            {uploadProgress !== null && (
              <div className="mt-3" aria-live="polite">
                <div
                  style={{
                    width: "100%",
                    height: 6,
                    borderRadius: 999,
                    background: "#eee",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${uploadProgress}%`,
                      height: "100%",
                      background: "#1b3dcd",
                      transition: "width 120ms linear",
                    }}
                  />
                </div>
                <p className="p3 mt-1">{uploadProgress < 100 ? `Uploading… ${uploadProgress}%` : "Finalizing…"}</p>
              </div>
            )}

            {uploadError && (
              <p className="p2 text-error mt-3" role="alert">
                {uploadError}
              </p>
            )}
          </div>
        )}

        <div className="actions mt-4">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Done
          </button>
        </div>

        {pendingDelete && (
          <ConfirmationModal
            title="Delete this image?"
            message={`Delete "${pendingDelete.fileName}" from S3? Other places that reference this image will break.`}
            handleOnConfirm={handleDelete}
            handleToggleShowConfirmationModal={() => !busy && setPendingDelete(null)}
          />
        )}
      </div>
    </div>,
    document.body,
  );
};

export default ImagePickerModal;

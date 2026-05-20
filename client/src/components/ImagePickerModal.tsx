import { Dispatch, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ConfirmationModal, Loading } from "@/components";
import { ActionType } from "@/context/types";
import { backendAPI } from "@/utils/backendAPI";
import { setErrorMessage } from "@/utils/setErrorMessage";
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

// Split "my-photo.png" → { name: "my-photo", ext: "png" } so the tile can
// show the filename without its extension and surface the type separately.
const splitFileName = (fileName: string): { name: string; ext: string } => {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0) return { name: fileName, ext: "" };
  return { name: fileName.slice(0, dot), ext: fileName.slice(dot + 1).toLowerCase() };
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
    if (!needle) return items;
    return items.filter((it) => it.fileName.toLowerCase().includes(needle));
  }, [items, filterText]);

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

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error || new Error("Could not read file"));
      reader.readAsDataURL(file);
    });

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
      const data = await readFileAsDataUrl(file);
      const res = await backendAPI.post(
        "/uploads",
        { filename: file.name, contentType: file.type, data },
        {
          onUploadProgress: (e) => {
            if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
          },
        },
      );
      const { publicUrl } = res.data as { publicUrl: string };
      onChange(publicUrl);
      onClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        "Upload failed";
      setUploadError(message);
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
            <input
              className="input"
              type="text"
              placeholder="Filter by name…"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              aria-label="Filter images by name"
            />

            {items === null ? (
              <Loading />
            ) : filteredItems.length === 0 ? (
              <p className="p2 mt-4 text-center">
                {items.length === 0
                  ? "No uploads yet — switch to the Upload tab to add one."
                  : "No images match that filter."}
              </p>
            ) : (
              <div className="mt-3 grid gap-3 text-left">
                {filteredItems.map((item) => {
                  const isSelected = item.url === value;
                  const { name, ext } = splitFileName(item.fileName);
                  return (
                    <div
                      key={item.key}
                      className={`card small ${isSelected && "success"} min-w-[0] cursor-pointer`}
                      onClick={() => onChange(item.url)}
                      aria-label={`Use ${item.fileName}`}
                      aria-pressed={isSelected}
                    >
                      <div className="card-image">
                        <img className="m-auto" src={item.url} alt={item.fileName} loading="lazy" />
                      </div>
                      <div className="card-details overflow-hidden">
                        <h4 className="card-title truncate" title={item.fileName} style={{ maxWidth: "100%" }}>
                          {name}
                        </h4>

                        <p className="card-description p2">
                          {ext && `Type: ${ext}`}
                          <br />
                          Size: {formatBytes(item.size)}
                        </p>
                        <div className="card-actions">
                          {item.ownedByMe && (
                            <button
                              className="btn btn-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingDelete(item);
                              }}
                              aria-label={`Delete ${item.fileName}`}
                              title="Delete this upload"
                            >
                              <img src="https://sdk-style.s3.amazonaws.com/icons/delete.svg" />
                            </button>
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

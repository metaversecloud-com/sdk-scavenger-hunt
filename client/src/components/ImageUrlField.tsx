import { useContext, useState } from "react";

import { ImagePickerModal } from "@/components";
import { GlobalDispatchContext } from "@/context/GlobalContext";

// ──────────────────────────────────────────────────────────────────────────
//  IMAGE FIELD
// ──────────────────────────────────────────────────────────────────────────
//  The visible field is intentionally minimal: it shows the current image
//  preview (or a call-to-action when empty), with a single button that opens
//  ImagePickerModal. Every editing affordance (URL paste, upload, browse,
//  clear) lives inside the modal so all image options sit in one place.
// ──────────────────────────────────────────────────────────────────────────

interface ImageUrlFieldProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  previewMaxSize?: number;
  emptyCtaLabel?: string;
  editLabel?: string;
}

export const ImageUrlField = ({
  label,
  value,
  onChange,
  previewMaxSize = 200,
  emptyCtaLabel = "Add Image",
  editLabel = "Edit",
}: ImageUrlFieldProps) => {
  const dispatch = useContext(GlobalDispatchContext);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div>
      <label>{label}</label>
      {value ? (
        <div className="mt-2">
          <img
            src={value}
            alt={`${label} preview`}
            className="m-auto mb-2"
            style={{
              display: "block",
              maxWidth: `${previewMaxSize}px`,
              maxHeight: `${previewMaxSize}px`,
              objectFit: "contain",
            }}
          />
          <button type="button" className="btn btn-outline" onClick={() => setPickerOpen(true)}>
            {editLabel}
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-outline mt-2" onClick={() => setPickerOpen(true)}>
          {emptyCtaLabel}
        </button>
      )}

      {pickerOpen && (
        <ImagePickerModal
          dispatch={dispatch ?? null}
          value={value}
          onChange={onChange}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
};

export default ImageUrlField;

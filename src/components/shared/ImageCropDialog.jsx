/**
 * ImageCropDialog.jsx
 * --------------------------------------------------------------------------
 * A modal dialog that lets the user crop, zoom, and rotate a single selected
 * image before it's uploaded. It loads the chosen File into an HTMLImage,
 * renders a live preview using the current aspect ratio / zoom / rotation, and
 * on confirm hands the final cropped+rotated <canvas> back to the parent via
 * onConfirm (the parent turns it into a File and uploads it).
 */

import React, { useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RotateCcw, RotateCw } from "lucide-react";
import { cropImageElement, loadImageFromFile } from "@/lib/image-upload";

// Rotate an already-cropped canvas by 0/90/180/270 degrees, returning a new
// canvas. For 90/270 the output width/height are swapped. The transform
// translates to the new center, rotates, then draws the source centered so the
// rotation pivots about the middle.
function applyRotation(canvas, rotation) {
  if (rotation === 0) return canvas; // no-op fast path
  const swap = rotation === 90 || rotation === 270; // these swap w/h
  const rc = document.createElement("canvas");
  rc.width = swap ? canvas.height : canvas.width;
  rc.height = swap ? canvas.width : canvas.height;
  const ctx = rc.getContext("2d");
  ctx.translate(rc.width / 2, rc.height / 2);     // move origin to output center
  ctx.rotate((rotation * Math.PI) / 180);          // degrees → radians
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2); // draw centered
  return rc;
}

// Props:
//   open        - whether the dialog is shown.
//   file        - the source File to crop (null when closed).
//   aspectRatio - crop aspect ratio (width/height), default 4:3.
//   isPrivate   - swaps the description copy for private uploads.
//   onCancel    - called when the dialog is dismissed.
//   onConfirm   - async callback receiving the final cropped+rotated canvas.
export default function ImageCropDialog({
  open,
  file,
  aspectRatio = 4 / 3,
  isPrivate = false,
  onCancel,
  onConfirm,
}) {
  const { t } = useTranslation();
  const zoomInputId = useId();                       // unique id linking label ↔ zoom slider
  const [image, setImage] = useState(null);          // loaded HTMLImageElement source
  const [zoom, setZoom] = useState(1);               // zoom factor (1–3)
  const [rotation, setRotation] = useState(0);       // rotation in degrees (0/90/180/270)
  const [error, setError] = useState("");            // load/save error message
  const [isSaving, setIsSaving] = useState(false);   // confirm in-flight guard

  // Load the file into an Image whenever the dialog opens with a file; reset
  // all editing state when closed or when there's no file. The `cancelled`
  // flag prevents setting state after unmount / a newer load superseding it.
  useEffect(() => {
    if (!open || !file) {
      setImage(null);
      setZoom(1);
      setRotation(0);
      setError("");
      return undefined;
    }

    let cancelled = false;

    loadImageFromFile(file)
      .then((loaded) => {
        if (!cancelled) {
          setImage(loaded);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError.message || t("image_crop.load_failed"));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [file, open, t]);

  // Derived live preview: crop the image to the aspect/zoom, apply rotation,
  // and export a JPEG data URL. Recomputed only when its inputs change; returns
  // "" if there's no image yet or rendering throws.
  const previewUrl = useMemo(() => {
    if (!image) {
      return "";
    }

    try {
      const canvas = cropImageElement(image, { aspectRatio, zoom });
      return applyRotation(canvas, rotation).toDataURL("image/jpeg", 0.82);
    } catch {
      return "";
    }
  }, [aspectRatio, image, zoom, rotation]);

  // Produce the final canvas the same way as the preview and hand it to the
  // parent. Guards against double-submits and surfaces errors inline.
  const handleConfirm = async () => {
    if (!image || isSaving) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const canvas = cropImageElement(image, { aspectRatio, zoom });
      await onConfirm(applyRotation(canvas, rotation));
    } catch (confirmError) {
      setError(confirmError.message || t("image_crop.save_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // Dialog: closing it (onOpenChange false) routes to onCancel.
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onCancel(); }}>
      <DialogContent className="max-w-[min(100vw-1.5rem,32rem)] gap-4 p-4 sm:p-6">
        {/* Header: title + context-dependent (private vs public) description */}
        <DialogHeader>
          <DialogTitle>{t("image_crop.title")}</DialogTitle>
          <DialogDescription>
            {isPrivate ? t("image_crop.private_description") : t("image_crop.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview area: shows the cropped/rotated image, or a loading/error message */}
          <div
            className="relative mx-auto w-full overflow-hidden rounded-xl border border-border bg-muted"
            style={{ aspectRatio: String(aspectRatio) }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={t("image_crop.preview_alt")}
                className="h-full w-full object-cover"
              />
            ) : (
              // Fallback while loading, or the error text if loading failed.
              <div className="flex h-full min-h-[12rem] items-center justify-center px-4 text-sm text-muted-foreground">
                {error || t("image_crop.loading_preview")}
              </div>
            )}
          </div>

          {/* Controls row: zoom slider + rotate-left / rotate-right buttons */}
          <div className="space-y-2">
            <Label htmlFor={zoomInputId}>{t("image_crop.zoom_label")}</Label>
            <div className="flex items-center gap-2">
              {/* Zoom slider (1x–3x in 0.05 steps), fully ARIA-annotated */}
              <input
                id={zoomInputId}
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="h-11 flex-1 accent-primary"
                aria-valuemin={1}
                aria-valuemax={3}
                aria-valuenow={zoom}
                aria-valuetext={t("image_crop.zoom_value", { value: zoom.toFixed(1) })}
              />
              {/* Rotate left: -90° (mod 360, +360 keeps it non-negative) */}
              <button
                type="button"
                onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                aria-label="Rotate left"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-foreground hover:bg-muted"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              {/* Rotate right: +90° (mod 360) */}
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                aria-label="Rotate right"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-foreground hover:bg-muted"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">{t("image_crop.zoom_help")}</p>
          </div>

          {/* Inline error alert (e.g. if saving fails) */}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Footer: Cancel + Confirm. Confirm is disabled until an image loads / while saving */}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!image || isSaving}>
            {isSaving ? t("image_crop.saving") : t("image_crop.use_photo")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

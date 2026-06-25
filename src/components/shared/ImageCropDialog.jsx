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
import { cropImageElement, loadImageFromFile } from "@/lib/image-upload";

export default function ImageCropDialog({
  open,
  file,
  aspectRatio = 4 / 3,
  isPrivate = false,
  onCancel,
  onConfirm,
}) {
  const { t } = useTranslation();
  const zoomInputId = useId();
  const [image, setImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open || !file) {
      setImage(null);
      setZoom(1);
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

  const previewUrl = useMemo(() => {
    if (!image) {
      return "";
    }

    try {
      const canvas = cropImageElement(image, { aspectRatio, zoom });
      return canvas.toDataURL("image/jpeg", 0.82);
    } catch {
      return "";
    }
  }, [aspectRatio, image, zoom]);

  const handleConfirm = async () => {
    if (!image || isSaving) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const canvas = cropImageElement(image, { aspectRatio, zoom });
      await onConfirm(canvas);
    } catch (confirmError) {
      setError(confirmError.message || t("image_crop.save_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onCancel(); }}>
      <DialogContent className="max-w-[min(100vw-1.5rem,32rem)] gap-4 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{t("image_crop.title")}</DialogTitle>
          <DialogDescription>
            {isPrivate ? t("image_crop.private_description") : t("image_crop.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="relative mx-auto w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
            style={{ aspectRatio: String(aspectRatio) }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={t("image_crop.preview_alt")}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[12rem] items-center justify-center px-4 text-sm text-slate-500">
                {error || t("image_crop.loading_preview")}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={zoomInputId}>{t("image_crop.zoom_label")}</Label>
            <input
              id={zoomInputId}
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="h-11 w-full accent-primary"
              aria-valuemin={1}
              aria-valuemax={3}
              aria-valuenow={zoom}
              aria-valuetext={t("image_crop.zoom_value", { value: zoom.toFixed(1) })}
            />
            <p className="text-xs text-slate-500">{t("image_crop.zoom_help")}</p>
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

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

/**
 * Photo uploader with crop, validation, progress, and accessible previews.
 *
 * --------------------------------------------------------------------------
 * PhotoUploader manages a list of uploaded image URLs (`photos`) for a form.
 * Users add images via drag-and-drop or a file picker; each is validated
 * (type/size), optionally cropped via ImageCropDialog, then uploaded one by
 * one with a progress indicator. Existing photos render as a reorderable
 * (drag-and-drop) grid where each can be replaced, removed, or promoted to the
 * "cover" (first) image. All state changes are communicated upward via
 * onChange(nextPhotos); this component does not own the canonical list.
 */

import React, { useId, useRef, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { GripVertical, ImagePlus, Loader2, LockKeyhole, RefreshCw, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { appClient } from "@/api/appClient";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import ImageCropDialog from "@/components/shared/ImageCropDialog";
import {
  canvasToFile,
  formatFileSize,
  IMAGE_UPLOAD_LIMITS,
  validateImageFile,
} from "@/lib/image-upload";

// Props:
//   photos      - current array of uploaded image URLs (controlled).
//   onChange    - called with the next photos array on any add/remove/reorder.
//   maxPhotos   - maximum number of photos allowed (default 5).
//   label       - field label; falls back to a translated default.
//   aspectRatio - preview/crop aspect ratio (default 4:3).
//   isPrivate   - marks the field as private (badge + alt-text variant).
//   enableCrop  - if true, route new files through the crop dialog first.
export default function PhotoUploader({
  photos = [],
  onChange,
  maxPhotos = 5,
  label,
  aspectRatio = 4 / 3,
  isPrivate = false,
  enableCrop = true,
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const inputId = useId();                              // id linking the field label ↔ file input
  const [isDragging, setIsDragging] = useState(false);  // is a file being dragged over the dropzone?
  const [uploading, setUploading] = useState(false);    // upload in progress?
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 }); // per-batch progress
  const [cropFile, setCropFile] = useState(null);       // file currently shown in the crop dialog
  const [pendingFiles, setPendingFiles] = useState([]); // queued files awaiting their turn to crop
  const fileInputRef = useRef(null);                    // hidden <input type=file> ref
  const dragDepthRef = useRef(0);                       // nested dragenter/leave counter (see below)
  const displayLabel = label || t("photo_uploader.upload_photos");

  // Derived counts: free slots left and whether the limit is reached.
  const remainingSlots = Math.max(0, maxPhotos - photos.length);
  const isFull = photos.length >= maxPhotos;

  // Show a toast describing why a rejected file failed validation (type or size).
  const notifyInvalidFile = (result) => {
    if (result.code === "type") {
      toast({
        title: t("photo_uploader.invalid_type_title"),
        description: t("photo_uploader.invalid_type_description"),
        variant: "destructive",
      });
      return;
    }

    if (result.code === "size") {
      toast({
        title: t("photo_uploader.invalid_size_title"),
        description: t("photo_uploader.invalid_size_description", {
          limit: formatFileSize(IMAGE_UPLOAD_LIMITS.maxBytes),
          size: formatFileSize(result.size),
        }),
        variant: "destructive",
      });
    }
  };

  // Entry point for newly selected/dropped files: validate, clamp to remaining
  // slots, then either start cropping the first (queuing the rest) or upload all.
  const queueFiles = (files) => {
    if (uploading || isFull) {
      return; // ignore while busy or already at the limit
    }

    // Keep only files that pass validation; toast about the ones that don't.
    const validFiles = [];
    Array.from(files || []).forEach((file) => {
      const result = validateImageFile(file);
      if (result.valid) {
        validFiles.push(file);
      } else {
        notifyInvalidFile(result);
      }
    });

    if (validFiles.length === 0) {
      return;
    }

    // Trim to the number of free slots; warn if some were dropped for the limit.
    const allowed = validFiles.slice(0, remainingSlots);
    if (allowed.length < validFiles.length) {
      toast({
        title: t("photo_uploader.limit_reached_title"),
        description: t("photo_uploader.limit_reached_description", { count: maxPhotos }),
      });
    }

    if (enableCrop) {
      // Crop flow: open the dialog on the first file, queue the remainder.
      setPendingFiles(allowed.slice(1));
      setCropFile(allowed[0]);
      return;
    }

    // No-crop flow: upload everything directly.
    void uploadFiles(allowed);
  };

  // Upload a batch of files sequentially, tracking progress, then push the
  // returned URLs into the photos list via onChange. Stops early if the max is hit.
  const uploadFiles = async (files) => {
    if (!files.length) {
      return;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    const nextPhotos = [...photos]; // work on a copy, commit once at the end

    try {
      for (let index = 0; index < files.length; index += 1) {
        if (nextPhotos.length >= maxPhotos) {
          break; // respect the limit even mid-batch
        }

        setUploadProgress({ current: index + 1, total: files.length });
        // Upload one file; the API returns the hosted file URL.
        const { file_url: fileUrl } = await appClient.integrations.Core.UploadFile({ file: files[index] });
        if (fileUrl) {
          nextPhotos.push(fileUrl);
        }
      }

      onChange(nextPhotos); // commit the new list to the parent
    } catch (error) {
      toast({
        title: t("photo_uploader.upload_failed_title"),
        description: error.message || t("photo_uploader.upload_failed_description"),
        variant: "destructive",
      });
    } finally {
      // Always reset progress UI and clear the input so the same file can be re-picked.
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Called when the crop dialog confirms: convert the cropped canvas back to a
  // File (preserving the original type/extension), upload it, then advance to
  // the next queued file (if any) to keep cropping.
  const handleCropConfirm = async (canvas) => {
    const sourceFile = cropFile;
    if (!sourceFile) {
      return;
    }

    // Preserve PNG/WEBP; otherwise default to JPEG.
    const extension = sourceFile.type === "image/png" ? "png" : sourceFile.type === "image/webp" ? "webp" : "jpg";
    const mimeType = sourceFile.type === "image/png" ? "image/png" : sourceFile.type === "image/webp" ? "image/webp" : "image/jpeg";
    const baseName = (sourceFile.name || "photo").replace(/\.[^.]+$/, ""); // strip original extension
    const croppedFile = await canvasToFile(canvas, `${baseName}-cropped.${extension}`, mimeType);

    setCropFile(null);
    await uploadFiles([croppedFile]);

    // Pull the next queued file into the crop dialog to process them one at a time.
    if (pendingFiles.length > 0) {
      const [nextFile, ...rest] = pendingFiles;
      setPendingFiles(rest);
      setCropFile(nextFile);
    }
  };

  // Cancel cropping: discard the current file and any queued files, reset input.
  const handleCropCancel = () => {
    setCropFile(null);
    setPendingFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove the photo at `index` by emitting a filtered list.
  const removePhoto = (index) => {
    onChange(photos.filter((_, photoIndex) => photoIndex !== index));
  };

  // Replace: drop the photo, then reopen the file picker to choose a new one.
  const replacePhoto = (index) => {
    removePhoto(index);
    fileInputRef.current?.click();
  };

  // Drop handler: reset drag state and feed the dropped files into queueFiles.
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);
    queueFiles(event.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      {/* Field label row + optional "Private" badge */}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {displayLabel}
        </label>
        {isPrivate && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
            <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
            {t("photo_uploader.private_badge")}
          </span>
        )}
      </div>

      {/* Dropzone: drag-and-drop target wrapping the hidden file input.
          dragDepthRef counts nested enter/leave events (children fire their own)
          so the "dragging" highlight only clears when the cursor truly leaves. */}
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
          dragDepthRef.current += 1; // entered an element (possibly a child)
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          event.dataTransfer.dropEffect = "copy"; // show the copy cursor
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          dragDepthRef.current = Math.max(0, dragDepthRef.current - 1); // left an element
          if (dragDepthRef.current === 0) {
            setIsDragging(false); // only un-highlight once fully out
          }
        }}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed p-4 text-center transition-colors sm:p-6 ${
          isDragging
            ? "border-primary bg-muted"
            : "border-border bg-muted/50 hover:border-primary/60 hover:bg-muted"
        } ${isFull ? "opacity-60" : ""}`}
      >
        {/* Visually hidden native file input; triggered by the Browse button / drag-drop */}
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept={IMAGE_UPLOAD_LIMITS.acceptAttribute}
          multiple={maxPhotos > 1}
          onChange={(event) => queueFiles(event.target.files)}
          disabled={uploading || isFull}
          className="sr-only"
        />

        {/* Dropzone body: shows an upload spinner+progress, or the idle prompt */}
        {uploading ? (
          <div className="space-y-3" role="status" aria-live="polite">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-600" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">{t("photo_uploader.uploading")}</p>
            {uploadProgress.total > 0 && (
              <>
                <p className="text-xs text-muted-foreground">
                  {t("photo_uploader.upload_progress", {
                    current: uploadProgress.current,
                    total: uploadProgress.total,
                  })}
                </p>
                {/* Progress bar; width = current/total as a percentage */}
                <div className="mx-auto h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-teal-600 transition-[width]"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                    aria-hidden="true"
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          // Idle prompt: icon, drag-drop hint, limits, and a Browse button.
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card border border-border">
              <ImagePlus className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{t("photo_uploader.drag_drop")}</p>
              <p className="text-xs text-muted-foreground">{t("photo_uploader.max_photos", { count: maxPhotos })}</p>
              <p className="text-xs text-muted-foreground">First image is shown on item cards</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              disabled={isFull}
              onClick={() => fileInputRef.current?.click()}
            >
              {t("photo_uploader.browse_button")}
            </Button>
          </div>
        )}
      </div>

      {/* Existing photos: a horizontally reorderable (drag-and-drop) preview grid */}
      {photos.length > 0 && (
        <DragDropContext
          onDragEnd={(result) => {
            if (!result.destination) return; // dropped outside / no move
            // Move the dragged item from its old index to the new one, then commit.
            const reordered = [...photos];
            const [moved] = reordered.splice(result.source.index, 1);
            reordered.splice(result.destination.index, 0, moved);
            onChange(reordered);
          }}
        >
          <Droppable droppableId="photos" direction="horizontal">
            {(provided) => (
              <ul
                className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                aria-label={t("photo_uploader.preview_list_label")}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {photos.map((url, index) => (
                  <Draggable key={url} draggableId={url} index={index}>
                    {(dragProvided) => (
                      <li
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className="space-y-2"
                      >
                        {/* Thumbnail with a drag handle and a "Cover" badge on the first image */}
                        <div
                          className="relative overflow-hidden rounded-xl border border-border bg-card"
                          style={{ aspectRatio: String(aspectRatio) }}
                        >
                          {/* Grab handle for reordering */}
                          <div
                            {...dragProvided.dragHandleProps}
                            className="absolute left-1.5 top-1.5 z-10 flex h-7 w-7 cursor-grab items-center justify-center rounded bg-black/40 text-white active:cursor-grabbing"
                            aria-label="Drag to reorder"
                          >
                            <GripVertical className="h-4 w-4" aria-hidden="true" />
                          </div>
                          {/* First photo is the card cover image */}
                          {index === 0 && (
                            <span className="absolute top-1.5 right-1.5 z-10 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              Cover
                            </span>
                          )}
                          <img
                            src={url}
                            alt={
                              isPrivate
                                ? t("photo_uploader.private_photo_alt", { count: index + 1 })
                                : t("photo_uploader.uploaded_photo", { count: index + 1 })
                            }
                            className="h-full w-full object-cover"
                          />
                        </div>
                        {/* Per-photo actions: Replace, Set as cover (non-first only), Remove */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="min-h-10 flex-1 gap-1.5"
                            onClick={() => replacePhoto(index)}
                            aria-label={t("photo_uploader.replace_photo", { count: index + 1 })}
                          >
                            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                            {t("photo_uploader.replace")}
                          </Button>
                          {/* Promote this photo to cover by moving it to the front of the list */}
                          {index > 0 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="min-h-10 flex-1 gap-1.5 text-emerald-700"
                              onClick={() => onChange([photos[index], ...photos.filter((_, i) => i !== index)])}
                              aria-label={`Set photo ${index + 1} as cover`}
                            >
                              Set as cover
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="min-h-10 gap-1.5 text-red-700"
                            onClick={() => removePhoto(index)}
                            aria-label={t("photo_uploader.remove_photo", { count: index + 1 })}
                          >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                            {t("photo_uploader.remove")}
                          </Button>
                        </div>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Crop dialog, mounted when a file is queued for cropping (cropFile set) */}
      <ImageCropDialog
        open={Boolean(cropFile)}
        file={cropFile}
        aspectRatio={aspectRatio}
        isPrivate={isPrivate}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
}

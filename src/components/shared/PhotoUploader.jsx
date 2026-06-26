/**
 * Photo uploader with crop, validation, progress, and accessible previews.
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

export default function PhotoUploader({
  photos = [],
  onChange,
  maxPhotos = 3,
  label,
  aspectRatio = 4 / 3,
  isPrivate = false,
  enableCrop = true,
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [cropFile, setCropFile] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const fileInputRef = useRef(null);
  const dragDepthRef = useRef(0);
  const displayLabel = label || t("photo_uploader.upload_photos");

  const remainingSlots = Math.max(0, maxPhotos - photos.length);
  const isFull = photos.length >= maxPhotos;

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

  const queueFiles = (files) => {
    if (uploading || isFull) {
      return;
    }

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

    const allowed = validFiles.slice(0, remainingSlots);
    if (allowed.length < validFiles.length) {
      toast({
        title: t("photo_uploader.limit_reached_title"),
        description: t("photo_uploader.limit_reached_description", { count: maxPhotos }),
      });
    }

    if (enableCrop) {
      setPendingFiles(allowed.slice(1));
      setCropFile(allowed[0]);
      return;
    }

    void uploadFiles(allowed);
  };

  const uploadFiles = async (files) => {
    if (!files.length) {
      return;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    const nextPhotos = [...photos];

    try {
      for (let index = 0; index < files.length; index += 1) {
        if (nextPhotos.length >= maxPhotos) {
          break;
        }

        setUploadProgress({ current: index + 1, total: files.length });
        const { file_url: fileUrl } = await appClient.integrations.Core.UploadFile({ file: files[index] });
        if (fileUrl) {
          nextPhotos.push(fileUrl);
        }
      }

      onChange(nextPhotos);
    } catch (error) {
      toast({
        title: t("photo_uploader.upload_failed_title"),
        description: error.message || t("photo_uploader.upload_failed_description"),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCropConfirm = async (canvas) => {
    const sourceFile = cropFile;
    if (!sourceFile) {
      return;
    }

    const extension = sourceFile.type === "image/png" ? "png" : sourceFile.type === "image/webp" ? "webp" : "jpg";
    const mimeType = sourceFile.type === "image/png" ? "image/png" : sourceFile.type === "image/webp" ? "image/webp" : "image/jpeg";
    const baseName = (sourceFile.name || "photo").replace(/\.[^.]+$/, "");
    const croppedFile = await canvasToFile(canvas, `${baseName}-cropped.${extension}`, mimeType);

    setCropFile(null);
    await uploadFiles([croppedFile]);

    if (pendingFiles.length > 0) {
      const [nextFile, ...rest] = pendingFiles;
      setPendingFiles(rest);
      setCropFile(nextFile);
    }
  };

  const handleCropCancel = () => {
    setCropFile(null);
    setPendingFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index) => {
    onChange(photos.filter((_, photoIndex) => photoIndex !== index));
  };

  const replacePhoto = (index) => {
    removePhoto(index);
    fileInputRef.current?.click();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);
    queueFiles(event.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
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

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
          dragDepthRef.current += 1;
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          event.dataTransfer.dropEffect = "copy";
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
          if (dragDepthRef.current === 0) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed p-4 text-center transition-colors sm:p-6 ${
          isDragging
            ? "border-primary bg-muted"
            : "border-border bg-muted/50 hover:border-primary/60 hover:bg-muted"
        } ${isFull ? "opacity-60" : ""}`}
      >
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
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card border border-border">
              <ImagePlus className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{t("photo_uploader.drag_drop")}</p>
              <p className="text-xs text-muted-foreground">{t("photo_uploader.max_photos", { count: maxPhotos })}</p>
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

      {photos.length > 0 && (
        <DragDropContext
          onDragEnd={(result) => {
            if (!result.destination) return;
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
                        <div
                          className="relative overflow-hidden rounded-xl border border-border bg-card"
                          style={{ aspectRatio: String(aspectRatio) }}
                        >
                          <div
                            {...dragProvided.dragHandleProps}
                            className="absolute left-1.5 top-1.5 z-10 flex h-7 w-7 cursor-grab items-center justify-center rounded bg-black/40 text-white active:cursor-grabbing"
                            aria-label="Drag to reorder"
                          >
                            <GripVertical className="h-4 w-4" aria-hidden="true" />
                          </div>
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

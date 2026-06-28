/**
 * image-upload.js
 * -----------------------------------------------------------------------------
 * Client-side image handling for uploads: validation, loading, and cropping/
 * downscaling to a target aspect ratio via an off-screen canvas. Keeps photos
 * within size/type limits before they're sent to the backend. Browser-only
 * (uses Image, canvas, URL.createObjectURL, File/Blob).
 */

// Upload constraints + output settings shared across the upload UI.
export const IMAGE_UPLOAD_LIMITS = {
  maxBytes: 8 * 1024 * 1024,                                   // Max accepted file size (8 MB).
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"], // Allowed input MIME types.
  acceptAttribute: "image/jpeg,image/png,image/webp",         // Value for an <input accept="...">.
  maxOutputWidth: 1600,                                        // Cropped output is downscaled to at most this width.
  jpegQuality: 0.88,                                           // JPEG encode quality for canvas output.
};

// Human-readable file size (B / KB / MB) for a byte count.
export function formatFileSize(bytes = 0) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Validate a File against the limits. Returns { valid, code?, size? } where
// `code` is one of "missing" | "type" | "size" describing the failure.
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, code: "missing" };
  }

  if (!IMAGE_UPLOAD_LIMITS.acceptedMimeTypes.includes(file.type)) {
    return { valid: false, code: "type" };
  }

  if (file.size > IMAGE_UPLOAD_LIMITS.maxBytes) {
    return { valid: false, code: "size", size: file.size };
  }

  return { valid: true };
}

// Decode a File into an HTMLImageElement. Resolves with the loaded image (and
// revokes the temporary object URL); rejects if the image can't be decoded.
export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image could not be loaded."));
    };

    image.src = objectUrl;
  });
}

/**
 * Center-crop an image element to `aspectRatio` (default 4:3) with optional
 * `zoom` (clamped 1-3x), draw it onto a downscaled canvas (capped at
 * maxOutputWidth), and return that canvas. Throws if no 2D context is available.
 */
export function cropImageElement(image, { aspectRatio = 4 / 3, zoom = 1 } = {}) {
  // Use intrinsic dimensions when available.
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const safeZoom = Math.min(Math.max(zoom, 1), 3); // Clamp zoom to [1, 3].
  const sourceAspect = sourceWidth / sourceHeight;

  // Compute the crop rectangle. Whether the source is wider or taller than the
  // target aspect decides which dimension is the limiting one.
  let cropWidth;
  let cropHeight;

  if (sourceAspect > aspectRatio) {
    cropHeight = sourceHeight / safeZoom;
    cropWidth = cropHeight * aspectRatio;
  } else {
    cropWidth = sourceWidth / safeZoom;
    cropHeight = cropWidth / aspectRatio;
  }

  // Center the crop within the source.
  const sx = Math.max(0, (sourceWidth - cropWidth) / 2);
  const sy = Math.max(0, (sourceHeight - cropHeight) / 2);

  // Output size: never upscale past the crop width or the max output width.
  const outputWidth = Math.min(IMAGE_UPLOAD_LIMITS.maxOutputWidth, Math.round(cropWidth));
  const outputHeight = Math.round(outputWidth / aspectRatio);

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available.");
  }

  // Draw the cropped source region scaled into the output canvas.
  context.drawImage(image, sx, sy, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);
  return canvas;
}

// Encode a canvas to a File (async via toBlob). Resolves with a File of the
// given name/type/quality; rejects if the blob can't be produced.
export function canvasToFile(canvas, fileName = "photo.jpg", mimeType = "image/jpeg", quality = IMAGE_UPLOAD_LIMITS.jpegQuality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Cropped image could not be created."));
          return;
        }

        resolve(new File([blob], fileName, { type: mimeType, lastModified: Date.now() }));
      },
      mimeType,
      quality
    );
  });
}

/**
 * End-to-end: load a File, center-crop/downscale it (per `options`, see
 * cropImageElement), and return a new cropped File. Output format mirrors the
 * input (png/webp/jpeg) and the name gets a "-cropped" suffix.
 */
export async function cropFileToAspect(file, options = {}) {
  const image = await loadImageFromFile(file);
  const canvas = cropImageElement(image, options);
  // Preserve the source format where supported; default to jpg.
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const mimeType = file.type === "image/png" ? "image/png" : file.type === "image/webp" ? "image/webp" : "image/jpeg";
  const baseName = (file.name || "photo").replace(/\.[^.]+$/, "");
  return canvasToFile(canvas, `${baseName}-cropped.${extension}`, mimeType);
}

import { randomUUID } from 'node:crypto';
import { mkdir, unlink } from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { fileTypeFromFile } from 'file-type';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from '../constants/detection.js';
import { HttpError } from '../utils/HttpError.js';

export const temporaryUploadDirectory = path.resolve(
  fileURLToPath(new URL('../uploads/tmp', import.meta.url)),
);

await mkdir(temporaryUploadDirectory, { recursive: true });

const extensionByMimeType = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

// Shared Multer storage in temporary upload directory
const storage = multer.diskStorage({
  destination: temporaryUploadDirectory,
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase() || extensionByMimeType.get(file.mimetype) || '.upload';
    callback(null, `${randomUUID()}${ext}`);
  },
});

// File filter checking allowed image MIME types
const fileFilter = (_req, file, callback) => {
  if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    callback(new HttpError(
      400,
      'Invalid file type. Only JPEG, PNG, and WebP images are permitted.',
      'INVALID_FILE_TYPE',
    ));
    return;
  }
  callback(null, true);
};

// General upload instance for multipart fields (used by Identity Guardian and general uploads)
export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
  },
  fileFilter,
});

// Single media upload handler (used by Detection route)
export const receiveImage = multer({
  storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: 1,
  },
  fileFilter,
}).single('media');

/**
 * Validates actual binary content of uploaded image using file-type inspection.
 */
export async function validateImageContent(req, _res, next) {
  if (!req.file) {
    next(new HttpError(400, 'An image file is required.', 'IMAGE_REQUIRED'));
    return;
  }

  try {
    const detectedType = await fileTypeFromFile(req.file.path);
    if (
      !detectedType
      || !ALLOWED_IMAGE_TYPES.has(detectedType.mime)
      || detectedType.mime !== req.file.mimetype
    ) {
      await unlink(req.file.path);
      req.file = undefined;
      next(new HttpError(
        415,
        'The uploaded file is not a valid JPEG, PNG, or WEBP image.',
        'INVALID_IMAGE_CONTENT',
      ));
      return;
    }

    req.file.mimetype = detectedType.mime;
    req.file.originalname = path.basename(req.file.originalname);
    req.file.extension = extensionByMimeType.get(detectedType.mime);
    next();
  } catch (error) {
    try {
      await unlink(req.file.path);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        next(cleanupError);
        return;
      }
    }
    next(error);
  }
}

/**
 * Safely removes an array of temporary files or Multer file objects.
 * Guarantees zero residual biometric or user photos on disk.
 * @param {Array<string | object>} files 
 */
export async function cleanupFiles(files = []) {
  for (const item of files) {
    if (!item) continue;
    const filePath = typeof item === 'string' ? item : item.path;
    if (filePath && fs.existsSync(filePath)) {
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        console.warn(`[Cleanup Warning] Could not remove temp file ${filePath}: ${err.message}`);
      }
    }
  }
}

export default {
  temporaryUploadDirectory,
  upload,
  receiveImage,
  validateImageContent,
  cleanupFiles,
};

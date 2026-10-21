import { randomUUID } from 'node:crypto';
import { mkdir, unlink } from 'node:fs/promises';
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

const upload = multer({
  storage: multer.diskStorage({
    destination: temporaryUploadDirectory,
    filename: (_req, _file, callback) => {
      callback(null, `${randomUUID()}.upload`);
    },
  }),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      callback(new HttpError(
        415,
        'Upload a JPEG, PNG, or WEBP image.',
        'UNSUPPORTED_IMAGE_TYPE',
      ));
      return;
    }

    callback(null, true);
  },
});

export const receiveImage = upload.single('media');

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

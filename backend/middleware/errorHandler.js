import multer from 'multer';
import { HttpError } from '../utils/HttpError.js';

export function errorHandler(error, _req, res, _next) {
  if (res.headersSent) return;

  if (error instanceof multer.MulterError) {
    const isOversized = error.code === 'LIMIT_FILE_SIZE';
    res.status(isOversized ? 413 : 400).json({
      error: isOversized
        ? 'Image must be 10 MB or smaller.'
        : 'Upload exactly one image using the media field.',
      code: isOversized ? 'IMAGE_TOO_LARGE' : 'INVALID_UPLOAD',
    });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
    return;
  }

  console.error('Unhandled request error:', error.message);
  res.status(500).json({
    error: 'An unexpected server error occurred.',
    code: 'INTERNAL_ERROR',
  });
}

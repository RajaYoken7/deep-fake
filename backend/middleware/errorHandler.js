import multer from 'multer';
import { HttpError } from '../utils/HttpError.js';

export function errorHandler(error, _req, res, _next) {
  if (res.headersSent) return;

  if (error instanceof multer.MulterError || error.name === 'MulterError') {
    const isOversized = error.code === 'LIMIT_FILE_SIZE';
    res.status(isOversized ? 413 : 400).json({
      success: false,
      error: isOversized
        ? 'Image must be 10 MB or smaller.'
        : `Upload error: ${error.message || 'Upload exactly one image using the media field.'}`,
      code: isOversized ? 'IMAGE_TOO_LARGE' : 'INVALID_UPLOAD',
      errorCode: isOversized ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR',
    });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      errorCode: error.code,
    });
    return;
  }

  // Handle generic validation or file errors
  if (error.message && error.message.includes('Invalid file type')) {
    res.status(400).json({
      success: false,
      error: error.message,
      code: 'INVALID_FILE_TYPE',
      errorCode: 'INVALID_FILE_TYPE',
    });
    return;
  }

  console.error('Unhandled request error:', error.message);
  res.status(500).json({
    success: false,
    error: 'An unexpected server error occurred.',
    code: 'INTERNAL_ERROR',
    errorCode: 'INTERNAL_ERROR',
  });
}

export default errorHandler;

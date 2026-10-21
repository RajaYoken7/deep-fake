import multer from 'multer';
import { HttpError } from '../utils/HttpError.js';
import { AuthError } from '../services/authService.js';

export function errorHandler(error, _req, res, _next) {
  if (res.headersSent) return;

  if (error instanceof multer.MulterError || error.name === 'MulterError') {
    const isOversized = error.code === 'LIMIT_FILE_SIZE';
    const msg = isOversized
      ? 'Image must be 10 MB or smaller.'
      : `Upload error: ${error.message || 'Upload exactly one image using the media field.'}`;

    return res.status(isOversized ? 413 : 400).json({
      success: false,
      message: msg,
      error: msg,
      code: isOversized ? 'IMAGE_TOO_LARGE' : 'INVALID_UPLOAD',
      errorCode: isOversized ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR',
    });
  }

  if (error instanceof AuthError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: error.message,
      code: error.code,
      errorCode: error.code,
    });
  }

  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: error.message,
      code: error.code,
      errorCode: error.code,
    });
  }

  // Handle Mongoose duplicate key error (11000)
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    const msg = `An account with that ${field} already exists.`;
    return res.status(409).json({
      success: false,
      message: msg,
      error: msg,
      code: 'DUPLICATE_KEY_ERROR',
      errorCode: 'DUPLICATE_KEY_ERROR',
    });
  }

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((e) => e.message);
    const msg = messages.join(', ');
    return res.status(400).json({
      success: false,
      message: msg,
      error: msg,
      code: 'VALIDATION_ERROR',
      errorCode: 'VALIDATION_ERROR',
    });
  }

  // Handle generic validation or file errors
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: error.message,
      code: 'INVALID_FILE_TYPE',
      errorCode: 'INVALID_FILE_TYPE',
    });
  }

  console.error('Unhandled request error:', error.message);
  return res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.',
    error: 'An unexpected server error occurred.',
    code: 'INTERNAL_ERROR',
    errorCode: 'INTERNAL_ERROR',
  });
}

export default errorHandler;

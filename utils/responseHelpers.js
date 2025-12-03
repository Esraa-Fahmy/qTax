/**
 * Bilingual Response Wrapper Utility
 * 
 * هذا الملف يحتوي على دوال مساعدة جاهزة للاستخدام في أي Controller
 * لتحويل جميع الردود تلقائياً إلى ثنائية اللغة
 * 
 * الاستخدام:
 * const { success, error, notFound } = require("../utils/responseHelpers");
 * 
 * return success(res, "ride.accepted", rideData);
 * return error(next, "ride.notFound", 404);
 */

const { t, createResponse, createError } = require("./localization");

/**
 * Send a successful response with bilingual message
 * @param {object} res - Express response object
 * @param {string} messageKey - Translation key
 * @param {object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const success = (res, messageKey, data = null, statusCode = 200) => {
  return res.status(statusCode).json(
    createResponse("success", messageKey, data)
  );
};

/**
 * Send an error response with bilingual message
 * @param {function} next - Express next function
 * @param {string} messageKey - Translation key
 * @param {number} statusCode - HTTP status code (default: 400)
 */
const error = (next, messageKey, statusCode = 400) => {
  return next(createError(messageKey, statusCode));
};

/**
 * Send a not found error (404)
 * @param {function} next - Express next function
 * @param {string} resource - Resource name (e.g., "ride", "user")
 */
const notFound = (next, resource = "common") => {
  return next(createError(`${resource}.notFound`, 404));
};

/**
 * Send a validation error (400)
 * @param {function} next - Express next function
 * @param {string} messageKey - Translation key
 */
const validationError = (next, messageKey) => {
  return next(createError(messageKey, 400));
};

/**
 * Send unauthorized error (401)
 * @param {function} next - Express next function
 */
const unauthorized = (next) => {
  return next(createError("common.unauthorized", 401));
};

/**
 * Send forbidden error (403)
 * @param {function} next - Express next function
 */
const forbidden = (next) => {
  return next(createError("common.forbidden", 403));
};

/**
 * Create a list response with pagination info
 * @param {object} res - Express response object
 * @param {array} data - Array of items
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 */
const listResponse = (res, data, total = null, page = null, limit = null) => {
  const response = {
    status: "success",
    results: data.length,
    data
  };

  if (total !== null) {
    response.total = total;
    response.currentPage = page;
    response.totalPages = Math.ceil(total / limit);
  }

  return res.status(200).json(response);
};

module.exports = {
  success,
  error,
  notFound,
  validationError,
  unauthorized,
  forbidden,
  listResponse,
  t, // Export t for custom messages
  createResponse, // Export for advanced usage
  createError // Export for advanced usage
};

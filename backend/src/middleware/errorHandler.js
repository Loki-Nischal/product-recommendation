import logger from "../utils/logger.js";

export default function errorHandler(err, req, res, next) {
  logger.error("Unhandled error: %o", { message: err.message, stack: err.stack });
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
}
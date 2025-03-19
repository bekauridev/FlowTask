const colors = require("colors");
const AppError = require("../utils/AppError");

// ////////////////////////
// GLOBAL error handler

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 404);
};
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]; // Extract the value from errmsg

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400); // Use 400 for bad request, not 404
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

// Jwt token related
const handleJWTError = () => new AppError("Invalid token please log in again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrorProd = (err, res) => {
  console.log(`Send from production error handler 💥💥💥: `, err.message);
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // 1) Log Err
    console.error("Error 💥", err);
    //
    res.status(500).json({
      status: "error",
      message: "Something went wrong :/",
    });
  }
};
module.exports = (err, req, res, next) => {
  // Ensure err.statusCode and err.status are set
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = {
      ...err,
      // name: err.name,
      // code: err.code,
      // errmsg: err.errmsg,
      message: err.message,
    };

    // Handle specific errors
    if (err.name === "CastError") error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === "ValidationError") error = handleValidationErrorDB(err);
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError();
    // Handle validation errors or other errors as needed
    sendErrorProd(error, res);
  }
};

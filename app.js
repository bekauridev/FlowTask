const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");

const AppError = require("./utils/AppError");
const globalErrorHandler = require("./controllers/errorController");

const usersRouter = require("./routes/usersRouter");
const organizationRouter = require("./routes/organizationRouter");
const taskRouter = require("./routes/taskRouter");
const labelsRouter = require("./routes/labelRouter");
const authRouter = require("./routes/authRouter");
const initializeTaskReminderService = require("./services/taskReminderService");

// Initialize the Express app
const app = express();

// Middleware to handle CORS
app.use(
  cors({
    origin: "http://localhost:5173", // Allow your frontend domain
    methods: ["GET", "POST", "PATCH"], // Allow specific methods
    credentials: true, // Allow cookies
  })
);

// Use Helmet to set security-related HTTP headers
app.use(helmet());

// Initialize the task reminder service
initializeTaskReminderService();

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Rate limiter for general routes
const generalRateLimiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: "Too many requests from this IP, please try again in an hour!",
});

// Rate limiter for auth routes
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit to 10 attempts
  message: "Too many attempts, please try again later.",
});

// Apply rate limiters
app.use("/api", generalRateLimiter);
app.use("/api/v1/auth", authRateLimiter);

// Body parser middleware to read JSON data from requests
app.use(express.json({ limit: "100kb" }));

// Cookie parser to handle cookies
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS (cross-site scripting) attacks
app.use(xss());

// Define API routes
// app.use("/", (req, res) => res.send("Hello from the server!"));
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/organizations", organizationRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/labels", labelsRouter);

// Handle requests to undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;

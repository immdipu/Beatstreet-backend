const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const userRouter = require("./Routes/userRoutes");
const musicRouter = require("./Routes/musicRoutes");
const cors = require("cors");
const helmet = require("helmet"); // Security headers
const morgan = require("morgan"); // HTTP request logger
const winston = require("winston"); // Logger for application events
const rateLimit = require("express-rate-limit"); // Rate limiting

// Set up Winston for logging
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// CORS options
let corOptions = {
  origin: process.env.NODE_ENV === "production" ? process.env.BASE_URL : "*",
};

// Middleware
app.use(helmet()); // Use Helmet for security
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corOptions));
app.use(cookieParser());
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
); // Log HTTP requests

// Rate limiting middleware to protect against brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Route handlers
app.use("/beatstreet/api/users", userRouter);
app.use("/beatstreet/api/music", musicRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err); // Log the error using Winston
  console.log("Error occurred:", err.message);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  // Close server and cleanup
  process.exit(0);
});

module.exports = app;

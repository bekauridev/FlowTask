const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("./app");
const colors = require("colors");

// Load environment variables
dotenv.config({ path: "./config/config.env" });

// Catch synchronous errors
process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception! 💥 Shutting down...", err);
  try {
    await mongoose.connection.close();
    server.close(() => process.exit(1));
  } catch (error) {
    console.error("Error closing DB connection:", error);
    process.exit(1);
  }
});

const connectWithRetry = () => {
  return mongoose
    .connect(process.env.DATABASE)
    .then(() => console.log("DB connection successful".green))
    .catch((err) => {
      console.error("DB connection error:".red, err);
      setTimeout(connectWithRetry, 5000); // Retry after 5 seconds
    });
};

connectWithRetry();

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port} in ${process.env.NODE_ENV} mode`.cyan);
});

// Catch asynchronous unhandled rejections
process.on("unhandledRejection", async (reason, promise) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...", reason);
  try {
    await mongoose.connection.close();
    server.close(() => process.exit(1));
  } catch (error) {
    console.error("Error closing DB connection:", error);
    process.exit(1);
  }
});

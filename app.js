const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const userRouter = require("./Routes/userRoutes");
const musicRouter = require("./Routes/musicRoutes");
const cors = require("cors");

let corOptions = {
  origin: process.env.NODE_ENV === "production" ? process.env.BASE_URL : "*",
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corOptions));
app.use(cookieParser());

app.use("/beatstreet/api/users", userRouter);
app.use("/beatstreet/api/music", musicRouter);

app.use((err, req, res, next) => {
  console.log("Error occured");
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

module.exports = app;

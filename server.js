const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const app = require("./app");

const DB = process.env.DB;

mongoose
  .connect(DB)
  .then(() => {
    console.log("DB connection successful!");
    app.listen(process.env.PORT, () => {
      console.log(`server is running on ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });

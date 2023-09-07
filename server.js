import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import "dotenv/config";

const app = express();

app.use(express.json());
app.use(cors());

import routerAPI from "./api/index.js";
app.use("/api/contacts", routerAPI);

app.use((_, res, __) => {
  res.json({
    status: "error",
    code: 404,
    message: "Use api on routes: /api/contacts",
    data: "Not found",
  });
});

app.use((err, _, res, __) => {
  console.log(err.stack);
  res.json({
    status: "fail",
    code: 500,
    message: err.message,
    data: "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3000;
const uriDb = process.env.DB_HOST;

const connection = async () => {
  try {
    await mongoose.connect(uriDb, { dbName: "db-contacts" });
    console.log("Database connection successful");

    app.listen(PORT, () => {
      console.log(`Server running. Use our API on port: ${PORT}`);
    });
  } catch (err) {
    console.log(`Server not running. Error message: ${err.message}`);
    process.exit(1);
  }
};

connection();

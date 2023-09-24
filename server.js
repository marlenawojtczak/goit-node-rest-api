import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import fs from "fs/promises";

import "dotenv/config";
import "./config/config-passport.js";

import { uploadDir } from "./config/config-multer.js";

const app = express();

app.use(express.json());
app.use(cors());

import contactsRouter from "./api/contacts.js";
import usersRouter from "./api/users.js";

app.use("/api/contacts", contactsRouter);
app.use("/api/users", usersRouter);

app.use(express.static("public"));

app.use((_, res, __) => {
  res.json({
    status: "error",
    code: 404,
    message: "404 Not Found",
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

const isAccessible = async (path) => {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
};

const createFolderIsNotExist = async (folder) => {
  if (!(await isAccessible(folder))) {
    await fs.mkdir(folder);
  }
};

const connection = async () => {
  try {
    await mongoose.connect(uriDb, { dbName: "db-contacts" });
    console.log("Database connection successful");

    app.listen(PORT, () => {
      createFolderIsNotExist(uploadDir);
      console.log(`Server running. Use our API on port: ${PORT}`);
    });
  } catch (err) {
    console.log(`Server not running. Error message: ${err.message}`);
    process.exit(1);
  }
};

connection();

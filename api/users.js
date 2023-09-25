import express from "express";
const router = express.Router();
import * as ctrlUser from "../controller/users.js";
import { upload } from "../config/config-multer.js";

router.get("/", ctrlUser.getUsers);
router.post("/signup", ctrlUser.signup);
router.post("/login", ctrlUser.login);
router.get("/logout", ctrlUser.auth, ctrlUser.logout);
router.get("/current", ctrlUser.auth, ctrlUser.current);
router.patch(
  "/avatars",
  ctrlUser.auth,
  upload.single("avatar"),
  ctrlUser.avatar
);
router.post("/verify/:verificationToken", ctrlUser.verification);
router.get("/verify", ctrlUser.sendEmailAgain);

export default router;

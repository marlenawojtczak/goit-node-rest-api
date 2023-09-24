import multer from "multer";
import path from "path";

export const uploadDir = path.join(process.cwd(), "tmp");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const avatarFileName = `${req.user._id.toString()}${path.extname(
      file.originalname
    )}`;
    cb(null, avatarFileName);
  },
  limits: {
    fileSize: 1048576,
  },
});

export const upload = multer({
  storage: storage,
});

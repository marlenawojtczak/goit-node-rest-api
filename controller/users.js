import Joi from "joi";
import jwt from "jsonwebtoken";
import passport from "passport";
import gravatar from "gravatar";
import jimp from "jimp";
import path from "path";
import fs from "fs/promises";
import {
  sendVerificationEmail,
  generateVerificationToken,
} from "../config/config-nodemailer.js";
import { User } from "../service/schemas/users.js";

const secret = process.env.SECRET;

const addUserSchema = Joi.object({
  password: Joi.string()
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least 8 characters, one uppercase letter, one digit, and one special character.",
    }),
  email: Joi.string().email().required(),
});

const addEmailSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const auth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (error, user) => {
    if (!user || error) {
      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Unauthorized",
        data: "Unauthorized",
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};

export const getUsers = async (_, res, next) => {
  try {
    const users = await User.find({});
    res.status(200).json({
      status: "success",
      code: 200,
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const signup = async (req, res, next) => {
  const { email, password, subscription } = req.body;

  const user = await User.findOne({ email });

  if (user) {
    return res.status(409).json({
      status: "error",
      code: 409,
      message: "Email is already in use",
      data: "Conflict",
    });
  }

  const { error } = addUserSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      status: "error",
      code: 400,
      message: "Bad Request",
      data: `${error.details[0].message}`,
    });
  }

  try {
    const avatarURL = gravatar.url(email, { s: "100", d: "retro" });

    const newUser = new User({ email, subscription, avatarURL });
    newUser.setPassword(password);

    const verificationToken = generateVerificationToken();

    newUser.verificationToken = verificationToken;
    await newUser.save();

    sendVerificationEmail({
      email,
      verificationToken: newUser.verificationToken,
    });

    res.status(201).json({
      status: "success",
      code: 201,
      data: {
        user: {
          subscription: newUser.subscription || "starter",
          message: "Registration successful",
          avatarURL: newUser.avatarURL,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      status: "error",
      code: 404,
      message: "User not found",
      data: "Not Found",
    });
  }

  if (!user || !user.validPassword(password)) {
    return res.status(401).json({
      status: "error",
      code: 401,
      message: "Email or password is wrong",
      data: "Bad request",
    });
  }

  if (!user.verify) {
    return res.status(401).json({
      status: "error",
      code: 401,
      message: "Email is not verified",
      data: "Unauthorized",
    });
  }

  try {
    const payload = {
      id: user.id,
      email: user.email,
      subscription: user.subscription,
    };

    const token = jwt.sign(payload, secret, { expiresIn: "1h" });
    res.status(200).json({
      status: "success",
      code: 200,
      data: {
        token,
        user: {
          email: `${payload.email}`,
          subscription: `${payload.subscription}`,
        },
      },
    });
  } catch {
    return res.status(400).json({
      status: "Bad request",
      code: 400,
      message: "Login failed",
    });
  }
};

export const logout = async (req, res) => {
  const { user } = req;

  try {
    user.token = null;
    await user.save();

    return res.status(204).send();
  } catch (error) {
    return res.status(401).json({
      status: "Unauthorized",
      code: 401,
      message: `Incorrect login or password, ${error.message}`,
      data: "Bad request",
    });
  }
};
export const getUser = async (id) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      return null;
    } else {
      return user;
    }
  } catch (error) {
    console.log(error);
  }
};

export const current = (req, res) => {
  const { email, subscription } = req.user;

  try {
    const id = req.user.id;
    const user = getUser(id);

    if (!user) {
      return res.json({
        status: "error",
        code: 401,
        data: {
          message: `Unauthorized`,
        },
      });
    } else {
      return res.json({
        status: "success",
        code: 200,
        data: {
          message: `Authorization successful`,
          email,
          subscription,
        },
      });
    }
  } catch (error) {
    console.error(error);
  }
};

//AVATARS

const storeAvatar = path.join(process.cwd(), "public/avatars");

export const avatar = async (req, res, next) => {
  const { path: temporaryName, originalname } = req.file;
  const newAvatarFileName = `${req.user._id.toString()}.jpg`;
  const newAvatarPath = path.join(storeAvatar, newAvatarFileName);
  newAvatarPath;
  try {
    const avatar = await jimp.read(temporaryName);
    await avatar.cover(250, 250).quality(60).write(newAvatarPath);
    await fs.unlink(temporaryName);
  } catch (err) {
    return next(err);
  }

  try {
    const id = req.user.id;
    const user = getUser(id);
    if (!user) {
      return res.json({
        status: "error",
        code: 401,
        data: {
          message: `Unauthorized`,
        },
      });
    } else {
      user.avatarURL = `/avatars/${newAvatarFileName}`;
      return res.json({
        status: "success",
        code: 200,
        data: { avatarURL: user.avatarURL },
      });
    }
  } catch (error) {
    console.error(error);
  }
};

// EMAIL

export const verification = async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "User not found",
        data: "Not Found",
      });
    }

    await User.findByIdAndUpdate(user._id, {
      verificationToken: "",
      verify: true,
    });

    res.status(200).json({
      status: "success",
      code: 200,
      data: {
        message: "Verification successful",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      code: 500,
      message: "Internal Server Error",
      data: "Verification process failed",
    });
  }
};

export const sendEmailAgain = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    const { error } = addEmailSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Bad Request",
        data: `${error.details[0].message}`,
      });
    }

    if (!user) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "User not found",
        data: "Not Found",
      });
    }

    if (user.verify) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Verification has already been passed",
        data: "Bad Request",
      });
    }

    sendVerificationEmail({
      email,
      verificationToken: user.verificationToken,
    });

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Verification email sent",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      code: 500,
      message: "Internal Server Error",
      data: "Email Sending Failure",
    });
  }
};

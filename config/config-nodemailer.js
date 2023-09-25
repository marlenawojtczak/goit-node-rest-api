import nodemailer from "nodemailer";
import "dotenv/config";
import { v4 as uuidv4 } from "uuid";

export const generateVerificationToken = () => {
  return uuidv4();
};
const baseURL = "http://localhost:3000";

export const sendVerificationEmail = ({ email, verificationToken }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "kontotestowe4000@gmail.com",
      pass: process.env.APP_PASSWORD,
    },
    secure: true,
  });

  const emailOptions = {
    from: "kontotestowe4000@gmail.com",
    to: email,
    subject: "User verification",
    html: `<a href="${baseURL}/users/verify/${verificationToken}">Please click here to verify your email</a>`,
  };

  transporter.sendMail(emailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

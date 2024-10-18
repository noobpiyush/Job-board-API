import express from "express";
import { SigninBody, SignupBody, User } from "../db/SignupSchema";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendMail } from "../node-mailer";
// import { sendVerificationEmail } from "../utils/emailService";
export const userRouter = express.Router();

// Make sure to set this in your environment variables
const JWT_SECRET = process.env.JWT_SECRET || "Piyush_fullstack";

userRouter.get("/health", async (_, res) => {
  res.send("Hi there from userRouter");
});

// Signup route
userRouter.post("/signup", async (req, res) => {
  try {
    const result = SignupBody.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        issues: result.error.issues,
      });
      return;
    }

    const { name, phoneNumber, companyName, companyEmail, password } =
      result.data;

    const existingUser = await User.findOne({ companyEmail });
    if (existingUser) {
      res.status(409).json({
        message: "Email already taken",
      });
      return;
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      name,
      phoneNumber,
      companyName,
      companyEmail,
      isVerified: false,
      verificationToken,
      password,
    });

    // Send verification email
    // await sendVerificationEmail(companyEmail, verificationToken);

    const from: string = process.env.MAIL_USERNAME!;
    const to: string = companyEmail; // Assuming it's the user email
    const subject: string = "Please verify your email";
    const mailTemplate: string = `
      <p>Please verify your account using this token:</p>
      <a href="http://localhost:3000/api/v1/user/verify/${verificationToken}">Click here to verify your email</a>
    `;

    const emailResult = await sendMail(from, to, subject, mailTemplate);

    if (!emailResult.success) {
      res.status(500).json({
        error: "Failed to send verification email",
        details: emailResult.error,
      });
      return;
    }

    // Create JWT token and respond with success
    const token = jwt.sign(
      { userId: user._id, email: user.companyEmail },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message:
        "Signup successful. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Verification route
userRouter.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      res.status(400).json({
        message: "Invalid or expired verification token",
      });
      return;
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // Create a new JWT token for the verified user
    const jwtToken = jwt.sign(
      { userId: user._id, email: user.companyEmail },
      JWT_SECRET,
      { expiresIn: "1d" } // Token expires in 1 day
    );

    // Set the new token as a cookie
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      message: "Account verified successfully",
    });
    return;
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

userRouter.post("/signin", async (req, res) => {
  try {
    const result = SigninBody.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        message: "Please enter correct information",
        issues: result.error.issues,
      });
      return;
    }

    const { companyEmail, password } = result.data;

    const user = await User.findOne({ companyEmail });
    if (!user) {
      res.status(401).json({
        message: "No user found with this email",
      });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({
        message: "Please verify your email before signing in",
      });
      return;
    }

    // Check password
    const isPasswordValid = user.password === password ? true : false;
    if (!isPasswordValid) {
      res.status(401).json({
        message: "Invalid password",
      });
      return;
    }

    // Create and send JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.companyEmail },
      JWT_SECRET,
      { expiresIn: "1d" } // Token expires in 1 day
    );

    // Set the token as a cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      message: "Signin successful",
      user: {
        id: user._id,
        name: user.name,
        companyEmail: user.companyEmail,
        companyName: user.companyName,
      },
    });

    return;
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
    return;
  }
});

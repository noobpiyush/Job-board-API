import jwt, { JwtPayload } from "jsonwebtoken";
import express, { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "Piyush_fullstack";

// Extend the Request type to include the `user` property
declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload; // Updated to reflect that req.user is of type JwtPayload
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.token;

  if (!token) {
    res
      .status(401)
      .json({ message: "No token provided, authorization denied" });
    return;
  }

  try {
    // Verify the token and decode the payload
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Attach the decoded token to req.user
    req.user = decoded;

    console.log(req.user);
    

    res.locals.companyEmail = req.user.email;


    

    console.log("res.locals.email is ", res.locals.companyEmail);

    // Now you can access the email from req.user.email
    console.log("Extracted Email:", req.user.email);

    // Proceed to the next middleware/route handler
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
    return;
  }
};

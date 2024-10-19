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
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1] // Extract the token from the header
    : null;

    if (token === null) {
      res.status(400).json("plese login")
      return 
    }

  try {
    // Verify the token and decode the payload
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;


    req.user = decoded;

    console.log(req.user);
    
    res.locals.companyEmail = req.user.email;
    console.log(req.user.email);
    
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
    return;
  }
};

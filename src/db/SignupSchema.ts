import mongoose, { Document, Schema } from 'mongoose';
import { string, z } from "zod";

require('dotenv').config();

mongoose.connect(process.env.DB_URL!)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Zod schema for user signup body validation
 const SignupBody = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  companyName: z.string().min(1, "Company name is required"),
  companyEmail: z.string().email("Invalid email address"),
  password:z.string().min(6,"Min 6 length"),
});

// Zod schema for user signin body validation
 const SigninBody = z.object({
  companyEmail: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Zod schema for verification token
 const VerificationBody = z.object({
  token: z.string().min(1, "Verification token is required"),
});

// Zod schema for job posting
 const JobPostingBody = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  jobDescription: z.string().min(10, "Job description must be at least 10 characters"),
  experienceLevel: z.enum(["Entry", "Mid-level", "Senior", "Executive"]),
  candidates: z.array(z.string().email("Invalid email address")).optional(),
  endDate: z.string().datetime("Invalid date format"),
});

// Derive TypeScript types from Zod schemas
type SignupBodyType = z.infer<typeof SignupBody>;
type SigninBodyType = z.infer<typeof SigninBody>;
type VerificationBodyType = z.infer<typeof VerificationBody>;
type JobPostingBodyType = z.infer<typeof JobPostingBody>;

// User (Company) Interface extending both Document and SignupBodyType
interface IUser extends Document, SignupBodyType {
  password: string;
  isVerified: boolean;
  verificationToken?: string;
}

// User Schema
const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  companyName: { type: String, required: true },
  companyEmail: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
});

// Job Posting Interface
interface IJobPosting extends Document, JobPostingBodyType {
  company: IUser['_id'];
}

// Job Posting Schema
const JobPostingSchema: Schema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  jobTitle: { type: String, required: true },
  jobDescription: { type: String, required: true },
  experienceLevel: { type: String, required: true, enum: ["Entry", "Mid-level", "Senior", "Executive"] },
  candidates: [{ type: String }],
  endDate: { type: Date, required: true },
});

// Create models
const User = mongoose.model<IUser>('User', UserSchema);
const JobPosting = mongoose.model<IJobPosting>('JobPosting', JobPostingSchema);

export { 
  User, 
  JobPosting, 
  IUser, 
  IJobPosting, 
  SignupBody, 
  SigninBody, 
  VerificationBody, 
  JobPostingBody, 
  SignupBodyType, 
  SigninBodyType, 
  VerificationBodyType, 
  JobPostingBodyType 
};
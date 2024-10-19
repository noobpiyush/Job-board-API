import express from "express";
import { JobPostingBody, JobPosting, User } from "../db/SignupSchema";
import { authMiddleware } from "../middlewares/authMiddleware";
import { sendMail } from "../node-mailer";

export const jobRouter = express.Router();

// Define the type for the result of sendMail function
type EmailResult = {
  success: boolean;
  info?: string;
  error?: string;
};

jobRouter.get("/job-health", async (req, res) => {
  res.send("Hi from job router");
});

jobRouter.post("/post", authMiddleware, async (req, res) => {
  try {
    const result = JobPostingBody.safeParse(req.body);
    console.log(result);
    console.log(req.body);
    
    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        issues: result.error.issues,
      });
      return;
    }

    const { jobTitle, jobDescription, experienceLevel, candidates, endDate } = result.data;

    // Convert endDate to a Date object
    const endDateObject = new Date(endDate);

    // Check if endDate is a valid date
    if (isNaN(endDateObject.getTime())) {
      res.status(400).json({ error: "Invalid end date" });
      return;
    }

    const jobPosting = await JobPosting.create({
      jobTitle,
      jobDescription,
      experienceLevel,
      candidates,
      endDate: endDateObject, // Save as a Date object
    });

    let emailResults: EmailResult[] = [];
    let allEmailsSent = true;
    if (!req.user) {
     res.status(401).json({ message: "Unauthorized" });
     return;
    }

    // Send emails to candidates if any are provided
    if (candidates && candidates.length > 0) {
     
      const user = await User.findById(req.user.userId); // Assuming req.user contains user details from authMiddleware
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const emailPromises = candidates.map(async (candidateEmail) => {
        const from = process.env.MAIL_USERNAME!;
        const subject = `New Job Opportunity from ${user.companyName}`;
        const html = `
          <h1>New Job Opportunity</h1>
          <p>Dear Candidate,</p>
          <p>We have a new job opportunity that might interest you:</p>
          <h2>${jobTitle}</h2>
          <p><strong>Company:</strong> ${user.companyName}</p>
          <p><strong>Experience Level:</strong> ${experienceLevel}</p>
          <p><strong>Job Description:</strong></p>
          <p>${jobDescription}</p>
          <p><strong>Application Deadline:</strong> ${endDate}</p>
          <p>If you're interested, please apply through our platform.</p>
          <p>Best regards,<br>${user.name}<br>${user.companyName}</p>
        `;

        return sendMail(from, candidateEmail, subject, html);
      });

      emailResults = await Promise.all(emailPromises);
      allEmailsSent = emailResults.every((result) => result.success);
    }

    res.status(201).json({
      message: candidates && candidates.length > 0
        ? (allEmailsSent
          ? "Job posted successfully and emails sent to all candidates"
          : "Job posted successfully, but some emails failed to send")
        : "Job posted successfully",
      jobPosting,
      emailResults: emailResults.length > 0 ? emailResults : undefined,
    });
  } catch (error) {
    console.error("Error posting job:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

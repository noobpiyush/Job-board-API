import nodemailer from "nodemailer";
import winston from "winston";
import dotenv from "dotenv";
dotenv.config();

const logger = winston.createLogger({
  level: "debug",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

export const sendMail = async (
  from: string,
  to: string,
  subject: string,
  html: string
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.MAIL_HOST,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: from,
      to: to,
      subject: subject,
      html: html,
    };

    logger.info(`Sending mail to - ${to}`);

    const info = await transporter.sendMail(mailOptions);
    logger.info("Email sent: " + info.response);
    return { success: true, info: info.response };
  } catch (error) {
    // Type guard to check if 'error' has a 'message' property
    if (error instanceof Error) {
      logger.error("Error sending email:", error.message);
      return { success: false, error: error.message };
    } else {
      logger.error("Unexpected error:", error);
      return { success: false, error: "Unknown error occurred" };
    }
  }
};

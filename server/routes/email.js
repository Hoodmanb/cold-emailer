const express = require("express");
const emailRouter = express.Router();

const sendEmail = require("../services/emailService");
const { sendEmails } = require("../controller/email.js");

// Route to send emails
emailRouter.post("/send/bulk", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await sendEmails(email, req.body.emails);

    if (result.success) {
      return res.status(200).json({ message: "All emails sent successfully!" });
    } else {
      return res.status(500).json({ message: result.message });
    }
  } catch (error) {
    console.error("Error in /send/bulk:", error);
    res.status(500).json({ message: "An error occurred", error });
  }
});

emailRouter.post("/send", async (req, res) => {
  const { to, subject, body, email } = req.body;
  try {
    let errorMessage;
    if (!to || !subject || !body) {
      !to ? (errorMessage.to = "recipient is required") : "";
      !subject ? (errorMessage.subject = "subject is required") : "";
      !body ? (errorMessage.body = "body is required") : "";
      return res
        .status(400)
        .json({ message: "missing required field", error: errorMessage });
    }
    const result = await sendEmail({ email, to, subject, body });
    res.status(200).json({ message: "email sent successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "error sending email", error });
  }
});

module.exports = emailRouter;

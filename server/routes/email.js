const express = require("express");
const emailRouter = express.Router();
const templateModel = require("../models/Template.js")

const sendEmail = require("../services/emailService");
const { sendEmails } = require("../controller/email.js");

// Route to send bulk emails
emailRouter.post("/bulk", async (req, res) => {
  const { email } = req;
  const { emails, subject, body, attachment, templateId } = req.body
  let template;
  if (templateId) {
    const templateObj = templateModel.findById({ templateId })
    template = { subject: templateObj.subject, body: templateObj.body, attachment: templateObj.attachment || null }
  } else {
    template = { subject, body, attachment }
  }
  try {
    const results = await sendEmails(email, template, emails);

    if (results.success) {
      return res.status(200).json({ results });
    } else {
      return res.status(500).json({ message: results.message });
    }
  } catch (error) {
    console.error("Error in /send/bulk:", error);
    res.status(500).json(error);
  }
});

// Route to send email
emailRouter.post("/", async (req, res) => {
  const { to, templateId } = req.body;
  const { email } = req
  let template;
  if (templateId) {
    const templateObj = templateModel.findById({ templateId })
    if (!templateId) {
      return res
        .status(404)
        .json({ message: "template with this id not found" });
    }
    template = { subject: templateObj.subject, body: templateObj.body, attachment: templateObj.attachment || null }
  } else {
    const { subject, body, attachment } = req.body;
    template = { subject, body, attachment }
  }
  try {
    let errorMessage;
    if (!to || !template.subject || !template.body) {
      !to ? (errorMessage.to = "recipient is required") : "";
      !subject ? (errorMessage.subject = "subject is required") : "";
      !body ? (errorMessage.body = "body is required") : "";
      return res
        .status(400)
        .json({ message: "missing required field", error: errorMessage });
    }
    const result = await sendEmail({ email, to, subject: template.subject, body: template.body, attachment: template.attachment });

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

module.exports = emailRouter;

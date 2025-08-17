// const express = require("express");
// const emailRouter = express.Router();

// const sendEmail = require("../services/emailService");
// const { sendEmails } = require("../controller/email.js");

// // Route to send emails
// emailRouter.post("/send/bulk", async (req, res) => {
//   const { email } = req.body;
//   try {
//     const result = await sendEmails(email, req.body.emails);

//     if (result.success) {
//       return res.status(200).json({ message: "All emails sent successfully!" });
//     } else {
//       return res.status(500).json({ message: result.message });
//     }
//   } catch (error) {
//     console.error("Error in /send/bulk:", error);
//     res.status(500).json({ message: "An error occurred", error });
//   }
// });

// emailRouter.post("/send", async (req, res) => {
//   const { to, subject, body, email } = req.body;
//   try {
//     let errorMessage;
//     if (!to || !subject || !body) {
//       !to ? (errorMessage.to = "recipient is required") : "";
//       !subject ? (errorMessage.subject = "subject is required") : "";
//       !body ? (errorMessage.body = "body is required") : "";
//       return res
//         .status(400)
//         .json({ message: "missing required field", error: errorMessage });
//     }
//     const result = await sendEmail({ email, to, subject, body });
//     res.status(200).json({ message: "email sent successfully" });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "error sending email", error });
//   }
// });

// module.exports = emailRouter;

const express = require("express");
const emailRouter = express.Router();

const sendEmail = require("../services/emailService");
const { sendEmails } = require("../controller/email.js");

/**
 * @swagger
 * tags:
 *   name: Email
 *   description: API for sending cold emails
 */

/**
 * @swagger
 * /api/email/send/bulk:
 *   post:
 *     summary: Send multiple emails in one go
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - emails
 *             properties:
 *               email:
 *                 type: object
 *                 description: Sender configuration (SMTP or service data)
 *                 properties:
 *                   from:
 *                     type: string
 *                     format: email
 *                     example: coldmailer@startup.com
 *               emails:
 *                 type: array
 *                 description: Array of recipients with subject and body
 *                 items:
 *                   type: object
 *                   required:
 *                     - to
 *                     - subject
 *                     - body
 *                   properties:
 *                     to:
 *                       type: string
 *                       format: email
 *                       example: target@example.com
 *                     subject:
 *                       type: string
 *                       example: Collaboration Opportunity
 *                     body:
 *                       type: string
 *                       example: Hey, just reaching out to introduce myself!
 *     responses:
 *       200:
 *         description: All emails sent successfully
 *         content:
 *           application/json:
 *             example:
 *               message: All emails sent successfully!
 *       400:
 *         description: Missing fields in one or more recipients
 *         content:
 *           application/json:
 *             example:
 *               message: all fields are required
 *       500:
 *         description: Server error while attempting to send emails
 *         content:
 *           application/json:
 *             example:
 *               message: An error occurred
 *               error: {}
 */

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

/**
 * @swagger
 * /api/email/send:
 *   post:
 *     summary: Send a single email
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - body
 *               - email
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 example: recipient@example.com
 *               subject:
 *                 type: string
 *                 example: Let's connect!
 *               body:
 *                 type: string
 *                 example: Hey there! Just wanted to reach out and say hi.
 *               email:
 *                 type: string
 *                 description: Sender email config (e.g., from, smtp credentials)
 *                 example: me@mydomain.com
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             example:
 *               message: email sent successfully
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             example:
 *               message: missing required field
 *               error:
 *                 to: recipient is required
 *                 subject: subject is required
 *                 body: body is required
 *                 email: email is required
 *       500:
 *         description: Server error while sending the email
 *         content:
 *           application/json:
 *             example:
 *               message: error sending email
 *               error: {}
 */
emailRouter.post("/send", async (req, res) => {
  const { to, subject, body, email } = req.body;
  console.log(email);
  try {
    let errorMessage = {};
    if (!to || !subject || !body) {
      if (!to) errorMessage.to = "recipient is required";
      if (!subject) errorMessage.subject = "subject is required";
      if (!body) errorMessage.body = "body is required";

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

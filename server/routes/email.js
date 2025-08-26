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
    const templateObj = await templateModel.findById( templateId )
    if (!templateObj) {
      return res
        .status(404)
        .json({ message: "template not found" });
    }
    console.log("found the template", templateObj)
    template = { subject: templateObj.subject, body: templateObj.body, attachment: templateObj.attachment || null }
  } else {
    const { subject, body, attachment } = req.body;
    template = { subject, body, attachment }
  }
  try {
    let errorMessage = {};
    if (!to || !template.subject || !template.body) {
      !to ? (errorMessage.to = "recipient is required") : "";
      !template.subject ? (errorMessage.subject = "subject is required") : "";
      !template.body ? (errorMessage.body = "body is required") : "";
      return res
        .status(400)
        .json({ message: "missing required field", errors: errorMessage });
    }
    const result = await sendEmail({ email, to, subject: template.subject, body: template.body, attachment: template.attachment });

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

module.exports = emailRouter;



// const express = require("express");
// const emailRouter = express.Router();
// const templateModel = require("../models/Template.js");

// const sendEmail = require("../services/emailService");
// const { sendEmails } = require("../controller/email.js");

// // Route to send bulk emails
// emailRouter.post("/bulk", async (req, res) => {
//   try {
//     const { emails, subject, body, attachment, templateId } = req.body;

//     if (!emails || !Array.isArray(emails) || emails.length === 0) {
//       return res.status(400).json({ message: "emails array is required" });
//     }

//     let template = { subject, body, attachment };

//     if (templateId) {
//       const templateObj = await templateModel.findById(templateId);
//       if (!templateObj) {
//         return res.status(404).json({ message: "Template not found" });
//       }
//       template = {
//         subject: templateObj.subject,
//         body: templateObj.body,
//         attachment: templateObj.attachment || null,
//       };
//     }

//     // Call controller function
//     const results = await sendEmails(emails, template.subject, template.body);

//     return res.status(200).json({
//       message: "Bulk emails processed successfully",
//       results,
//     });
//   } catch (error) {
//     console.error("Error in /bulk route:", error);
//     return res.status(500).json({ error: error.message });
//   }
// });

// // Route to send single email
// emailRouter.post("/", async (req, res) => {
//   try {
//     const { to, subject, body, attachment, templateId } = req.body;

//     let template = { subject, body, attachment };

//     if (templateId) {
//       const templateObj = await templateModel.findById(templateId);
//       if (!templateObj) {
//         return res.status(404).json({ message: "Template not found" });
//       }
//       template = {
//         subject: templateObj.subject,
//         body: templateObj.body,
//         attachment: templateObj.attachment || null,
//       };
//     }

//     // Validate fields
//     if (!to || !template.subject || !template.body) {
//       return res.status(400).json({
//         message: "Missing required fields",
//         errors: {
//           ...(to ? {} : { to: "Recipient is required" }),
//           ...(template.subject ? {} : { subject: "Subject is required" }),
//           ...(template.body ? {} : { body: "Body is required" }),
//         },
//       });
//     }

//     const result = await sendEmail({
//       to,
//       subject: template.subject,
//       body: template.body,
//       attachment: template.attachment,
//     });

//     return res.status(200).json(result);
//   } catch (error) {
//     console.error("Error in / route:", error);
//     return res.status(500).json({ error: error.message });
//   }
// });

// module.exports = emailRouter;

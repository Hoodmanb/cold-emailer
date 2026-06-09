const emailRepo = require('../repositories/emailRepository');
const templateRepo = require('../repositories/templateRepository');
const { sendEmail } = require('../modules/email/emailService');
const { log, ACTION_TYPES } = require('../logs/auditLogger');
const { requireUserId } = require('../utils/requireUserId');

const listEmails = (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { jobId } = req.query;
  const emails = emailRepo.listEmails({ jobId, userId });
  return res.status(200).json({ message: 'retrieved successfully', data: emails });
};

const getEmail = (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const email = emailRepo.getEmail(req.params.id, userId);
  if (!email) return res.status(404).json({ message: 'Email not found' });
  return res.status(200).json({ message: 'retrieved successfully', data: email });
};

const sendSingle = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { to, subject, body, attachment, attachments, artifactId, artifactIds, templateId } = req.body;

  const emailId = req.body.emailId;

  let payload = { to, subject, body, attachment, attachments, artifactId, artifactIds, templateId };

  if (emailId) {
    const draft = emailRepo.getEmail(emailId, userId);
    if (!draft) return res.status(404).json({ message: 'Email draft not found' });
    if (draft.status !== 'approved') {
      return res.status(400).json({
        message: 'Email must be approved before sending. Please approve the draft first.',
      });
    }
    payload = {
      to: draft.to,
      subject: draft.subject,
      body: draft.body,
      attachment: draft.attachment ?? attachment,
      attachments: draft.attachments ?? attachments,
      artifactId: draft.artifactId ?? artifactId,
      artifactIds: draft.artifactIds ?? artifactIds,
      templateId: draft.templateId ?? templateId,
    };
  }

  if (payload.templateId && (!payload.subject || !payload.body)) {
    const tpl = templateRepo.getTemplate(payload.templateId, userId);
    if (!tpl) {
      return res.status(400).json({ message: 'Template not found', errors: { templateId: 'invalid template id' } });
    }
    payload.subject = payload.subject || tpl.subject;
    payload.body = payload.body || tpl.body;
  }

  if (!payload.to || !payload.subject || !payload.body) {
    return res.status(400).json({
      message: 'missing required field',
      errors: {
        to: !payload.to ? 'recipient is required' : undefined,
        subject: !payload.subject ? 'subject is required' : undefined,
        body: !payload.body ? 'body is required' : undefined,
      },
    });
  }

  const result = await sendEmail(payload);

  if (emailId) {
    emailRepo.markSent(emailId, result, userId);
  }

  if (result.success) {
    log(ACTION_TYPES.EMAIL_SENT, {
      module: 'email',
      entityId: emailId || null,
      entityType: 'email',
      details: `Email sent to ${payload.to}`,
    });
  } else {
    log(ACTION_TYPES.EMAIL_FAILED, {
      module: 'email',
      entityId: emailId || null,
      details: result.message,
    });
  }

  return res.status(result.success ? 200 : 500).json(result);
};

const sendBulk = async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const { emails, subject, body, attachment, attachments, artifactId, artifactIds, templateId } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ message: 'emails array is required' });
  }

  let subjectFinal = subject;
  let bodyFinal = body;
  if (templateId && (!subjectFinal || !bodyFinal)) {
    const tpl = templateRepo.getTemplate(templateId, userId);
    if (!tpl) {
      return res.status(400).json({ message: 'Template not found' });
    }
    subjectFinal = subjectFinal || tpl.subject;
    bodyFinal = bodyFinal || tpl.body;
  }

  if (!subjectFinal || !bodyFinal) {
    return res.status(400).json({ message: 'subject and body are required (or valid templateId)' });
  }

  const results = await Promise.allSettled(
    emails.map((to) =>
      sendEmail({
        to,
        subject: subjectFinal,
        body: bodyFinal,
        attachment,
        attachments,
        artifactId,
        artifactIds,
        templateId,
      }),
    ),
  );

  const summary = results.map((r, i) => ({
    to: emails[i],
    success: r.status === 'fulfilled' && r.value.success,
    message: r.value?.message || r.reason?.message,
  }));

  return res.status(200).json({
    message: 'Bulk send processed',
    success: true,
    results: summary,
  });
};

const approveEmail = (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const email = emailRepo.getEmail(req.params.id, userId);
  if (!email) return res.status(404).json({ message: 'Email not found' });

  const approved = emailRepo.approveEmail(req.params.id, userId);

  log(ACTION_TYPES.DRAFT_APPROVED, {
    module: 'email',
    entityId: req.params.id,
    entityType: 'email',
    details: 'Email draft approved for sending',
  });

  return res.status(200).json({ message: 'Email approved for sending', data: approved });
};

const updateEmail = (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const email = emailRepo.getEmail(req.params.id, userId);
  if (!email) return res.status(404).json({ message: 'Email not found' });

  const wasEdited = req.body.body !== undefined && req.body.body !== email.body;
  const updated = emailRepo.updateEmail(req.params.id, req.body, userId);

  if (wasEdited) {
    log(ACTION_TYPES.DRAFT_EDITED, {
      module: 'email',
      entityId: req.params.id,
      entityType: 'email',
      details: 'Email draft manually edited',
    });
  }

  return res.status(200).json({ message: 'updated successfully', data: updated });
};

const deleteEmail = (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const count = emailRepo.deleteEmail(req.params.id, userId);
  if (count === 0) return res.status(404).json({ message: 'Email not found' });
  return res.status(200).json({ message: 'deleted successfully' });
};

module.exports = { listEmails, getEmail, sendSingle, sendBulk, approveEmail, updateEmail, deleteEmail };

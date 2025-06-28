// const { schedule } = require("node-cron");
const Schedule = require("../models/Schedule");

const { prepareRecipients } = require("../utils/scheduleHelper");

exports.create = async (req, res) => {
  try {
    const { name, frequency, day, hour, recipients, templates } = req.body;
    const { template, templateOne, templateTwo, templateThree } = templates;
    const userId = req.userId;

    if (!template?.subject || !template?.body) {
      return res
        .status(400)
        .json({ message: "Main template (subject and body) is required." });
    }

    function getValidTemplates(...templates) {
      return templates.filter(
        (tpl) => tpl && tpl.subject?.trim() && tpl.body?.trim()
      );
    }

    const validTemplates = getValidTemplates(
      template,
      templateOne,
      templateTwo,
      templateThree
    );

    // Dynamically assign to schedule keys without reuse or gaps
    const availableTemplates = {};

    ["scheduleOne", "scheduleTwo", "scheduleThree", "scheduleFour"].forEach(
      (key, index) => {
        availableTemplates[key] = validTemplates[index] || null;
      }
    );

    const processedRecipients = prepareRecipients(
      recipients,
      availableTemplates
    );

    const scheduleData = {
      name,
      userId,
      frequency,
      day,
      hour,
      recipients: processedRecipients,
      template,
      templateOne,
      templateTwo,
      templateThree,
    };

    const schedule = await Schedule.create(scheduleData);
    return res.status(201).json({ message: "Schedule created", schedule });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

exports.addRecipient = async (req, res) => {
  const { id } = req.params;
  const { email, userId } = req.body;

  try {
    const scheduler = await Schedule.findById(id);

    if (!scheduler) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (scheduler.userId !== userId) {
      return res
        .status(401)
        .json({ message: "you dont have access to this data" });
    }

    // Check for duplicate email
    const alreadyExists = scheduler.recipients.some((r) => r.email === email);
    if (alreadyExists) {
      return res.status(400).json({ message: "Recipient already exists" });
    }

    // Build statuses from available templates
    const templates = {
      scheduleOne: scheduler.template,
      scheduleTwo: scheduler.templateOne,
      scheduleThree: scheduler.templateTwo,
      scheduleFour: scheduler.templateThree,
    };

    const statuses = {};
    Object.entries(templates).forEach(([key, tpl]) => {
      statuses[key] = tpl?.subject && tpl?.body ? "pending" : undefined;
    });

    const recipient = {
      email,
      statuses,
    };

    scheduler.recipients.push(recipient);
    await scheduler.save();

    return res.status(201).json({ message: "Recipient added successfully" });
  } catch (error) {
    console.error("❌ Error adding recipient:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

exports.get = async (req, res) => {
  try {
    const { userId } = req.body;
    const schedules = await Schedule.find({ userId });
    if (schedules.length === 0) {
      console.log("No schedules found.");
      return res.status(404).json({ message: "No schedules found" });
    }
    return res.json({ message: "Fetched", schedules });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching schedules", error });
  }
};

exports.update = async (req, res) => {
  try {
    const { userId } = req.body;
    const schedule = await Schedule.findOne(req.params.id);

    if (schedule.userId !== userId) {
      return res
        .status(401)
        .json({ message: "you dont have access to this data" });
    }

    await schedule.update(req.body);
    return res.json({ message: "Updated", schedule });
  } catch (error) {
    return res.status(500).json({ message: "Error updating schedule", error });
  }
};

exports.delete = async (req, res) => {
  try {
    const { userId } = req.body;
    const schedule = await Schedule.findById(req.params.id);
    if (schedule.userId !== userId) {
      return res
        .status(401)
        .json({ message: "you dont have access to this data" });
    }
    schedule.deleteOne();
    return res.json({ message: "Deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting schedule", error });
  }
};

const Schedule = require('../models/Schedule');

exports.create = async (req, res) => {
  try {
    const {
      frequency,
      day,
      hour,
      // timezone = 'UTC',
      recipients,
      round = 0,
      template,
      templateOne,
      templateTwo,
      templateThree
    } = req.body;

    // Required check for main template
    if (!template || !template.subject || !template.body) {
      return res.status(400).json({ message: 'Main template (subject and body) is required.' });
    }

    const scheduleData = {
      frequency,
      day,
      hour,
      // timezone,
      recipients,
      round,
      template,
      templateOne,
      templateTwo,
      templateThree
    };

    const schedule = await Schedule.create(scheduleData);

    return res.status(201).json({ message: 'Schedule created', schedule });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return res.status(500).json({ message: 'Error creating schedule', error });
  }
};


exports.get = async (req, res) => {
  try {
    const schedules = await Schedule.find();
    if (schedules.length === 0) {
      console.log("No schedules found.");
      return res.status(404).json({ message: "No schedules found" });
    }
    return res.json({ message: 'Fetched', schedules });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching schedules', error });
  }
};

exports.update = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.json({ message: 'Updated', schedule });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating schedule', error });
  }
};

exports.delete = async (req, res) => {
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting schedule', error });
  }
};

const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  body: { type: String, required: true },
  attachment: { type: String }
}, { _id: false });

const OptionalTemplateSchema = new mongoose.Schema({
  subject: { type: String, default: null },
  body: { type: String, default: null },
  attachment: { type: String, default: null }
}, { _id: false });

const ScheduleSchema = new mongoose.Schema({
  frequency: { type: String, enum: ['weekly', 'monthly'], required: true },
  day: { type: Number, required: true },
  hour: { type: Number, required: true },
  recipients: [{ type: String, required: true }],
  disabled:{type:Boolean},
  successful:{type:Number, default:0},
  failed:{type:Number, default:0},
  round: { type: Number, default: 0 },
  template: { type: TemplateSchema, required: true },
  templateOne: OptionalTemplateSchema,
  templateTwo: OptionalTemplateSchema,
  templateThree: OptionalTemplateSchema,
  createdAt: { type: Date, default: Date.now, expires: '90d' }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);

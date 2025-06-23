const mongoose = require("mongoose");

const TemplateSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    body: { type: String, required: true },
    attachment: { type: String },
  },
  { _id: false }
);

const OptionalTemplateSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    body: { type: String, required: true },
    attachment: { type: String },
  },
  { _id: false }
);

const StatusesSchema = new mongoose.Schema(
  {
    scheduleOne: {
      type: String,
      enum: ["sent", "failed", "pending"],
      default: "pending",
    },
    scheduleTwo: {
      type: String,
      enum: ["sent", "failed", "pending", "void"],
    },
    scheduleThree: {
      type: String,
      enum: ["sent", "failed", "pending", "void"],
    },
    scheduleFour: {
      type: String,
      enum: ["sent", "failed", "pending", "void"],
    },
  },
  { _id: false }
);

const RecipientsSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    statuses: StatusesSchema,
    disabled: { type: Boolean, default: false },
  },
  { _id: false }
);

const ScheduleSchema = new mongoose.Schema({
  frequency: { type: String, enum: ["weekly", "monthly"], required: true },
  day: { type: Number, required: true },
  hour: { type: Number, required: true },
  recipients: [RecipientsSchema],
  disabled: { type: Boolean },
  template: { type: TemplateSchema, required: true },
  templateOne: OptionalTemplateSchema,
  templateTwo: OptionalTemplateSchema,
  templateThree: OptionalTemplateSchema,
});

module.exports = mongoose.model("Schedule", ScheduleSchema);

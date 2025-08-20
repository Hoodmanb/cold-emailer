export type StatusType = "sent" | "failed" | "pending" | "void";

export interface Statuses {
  scheduleOne: "sent" | "failed" | "pending";
  scheduleTwo?: StatusType;
  scheduleThree?: StatusType;
  scheduleFour?: StatusType;
}

export interface Template {
  subject: string;
  body: string;
  attachment?: string;
}

export interface Recipient {
  email: string;
  statuses: Statuses;
  disabled?: boolean;
}

export interface Schedule {
  name: string;
  _id: string;
  userId: string;
  frequency: "weekly" | "monthly";
  sender: string;
  day: number;
  hour: number;
  recipients: Recipient[];
  disabled?: boolean;
  template: Template;
  templateOne?: Template;
  templateTwo?: Template;
  templateThree?: Template;
  createdAt?: string;
  updatedAt?: string;
}

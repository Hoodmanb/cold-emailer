require('dotenv').config();
const express = require('express');
const connectDB = require('./utils/db');

const recipientRouter = require('./routes/recipient.js');
const emailRouter = require('./routes/email.js');
const templateRouter = require('./routes/template.js');
const categoryRouter = require('./routes/category.js')

const { scheduleEmails } = require('./services/scheduler');

const app = express();
app.use(express.json());

// Connect DB
connectDB();

// Routes

app.use('/api/recipient', recipientRouter);

app.use('/api/email', emailRouter)

app.use('/api/template', templateRouter)

app.use('/api/category', categoryRouter)

// Start Scheduler
scheduleEmails();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
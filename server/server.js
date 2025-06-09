require('dotenv').config();
const express = require('express');
const connectDB = require('./utils/db');
const cors = require('cors')
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const recipientRouter = require('./routes/recipient.js');
const emailRouter = require('./routes/email.js');
const templateRouter = require('./routes/template.js');
const categoryRouter = require('./routes/category.js')

const scheduleRouter = require('./routes/schedule');
const runSchedule = require('./services/scheduler.js');

const swaggerDocument = YAML.load('./swagger.yaml');

const app = express();

app.use(express.json());
app.use(cors())

// Connect DB
connectDB();

// Routes

app.use('/api/recipient', recipientRouter);

app.use('/api/email', emailRouter)

app.use('/api/template', templateRouter)

app.use('/api/category', categoryRouter)

app.use('/api/schedule', scheduleRouter);

app.get("/api/schedule/run", runSchedule)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app
// env config
require("dotenv").config();

// packages
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

// db connection
const connectDB = require("./utils/db.js");

// routes imports
const recipientRouter = require("./routes/recipient.js");
const emailRouter = require("./routes/email.js");
const templateRouter = require("./routes/template.js");
const categoryRouter = require("./routes/category.js");
const scheduleRouter = require("./routes/schedule");
const userRouter = require("./routes/user.js");

// middleware
const verifyToken = require("./midddleware/verifyToken.js");

const runSchedule = require("./services/scheduler.js");

const PORT = process.env.PORT || 5000;
const path = require("path");
const swaggerDocument = YAML.load(path.join(__dirname, "swagger.yaml"));

const app = express();

app.use(express.json());
app.use(cors());

// let allowed;
// if (process.env.NODE_ENV === "production") {
//   allowed = "https://nike-recycle.vercel.app";
// } else {
//   allowed = "http://localhost:3000";
// }

// // Middleware
// app.use(
//   cors({
//     origin: allowed,
//     methods: "GET, POST, PUT, DELETE, OPTIONS",
//     allowedHeaders: "Content-Type, Authorization",
//   })
// );

connectDB();

// ping my server every 10 min
app.get("/api/ping", (req, res) => res.status(200).send("PONG"));

// Worker
app.get("/api/schedule/run", runSchedule);

// Swagger doc
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use("/api/template", templateRouter);

app.use(verifyToken); // middleware to verify user

app.use("/api/user", userRouter);

app.use("/api/recipient", recipientRouter);

app.use("/api/email", emailRouter);

app.use("/api/category", categoryRouter);

app.use("/api/schedule", scheduleRouter);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

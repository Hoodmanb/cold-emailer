// server/swagger.js
const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cold Emailer API",
      version: "1.0.0",
      description: "Send scheduled cold emails to multiple recipients",
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
  },
  apis: ["./routes/*.js"], // <- Put your route file paths here
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;

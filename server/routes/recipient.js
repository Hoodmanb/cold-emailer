const express = require("express");
const recipientRouter = express.Router();

const controller = require("../controller/recipient.js");

recipientRouter.post("/", controller.create);

recipientRouter.delete("/:email", controller.delete);

recipientRouter.patch("/:email", controller.update);

recipientRouter.get("/:email", controller.getOne);

recipientRouter.get("/", controller.get);

module.exports = recipientRouter;


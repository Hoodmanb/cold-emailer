const express = require("express");
const attachmentRouter = express.Router();
const verifyToken = require("../midddleware/verifyToken.js");

const controller = require("../controller/attachment.js");

attachmentRouter.post("/", verifyToken, controller.create);

attachmentRouter.put("/:id", verifyToken, controller.update);

attachmentRouter.delete("/:id", verifyToken, controller.delete);

attachmentRouter.get("/", controller.getAll);

attachmentRouter.get("/:id", controller.getOne);

module.exports = attachmentRouter;

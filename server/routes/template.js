const express = require("express");
const templateRouter = express.Router();
const verifyToken = require("../midddleware/verifyToken.js");

const controller = require("../controller/template.js");

templateRouter.post("/", verifyToken, controller.create);

templateRouter.put("/:id", verifyToken, controller.update);

templateRouter.delete("/:id", verifyToken, controller.delete);

templateRouter.get("/", controller.getAll);

templateRouter.get("/:id", controller.getOne);

module.exports = templateRouter;

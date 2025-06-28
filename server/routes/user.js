const express = require("express");
const userRouter = express.Router();

const controller = require("../controller/user");

userRouter.post("/", controller.create);

userRouter.put("/", controller.update);

module.exports = userRouter;

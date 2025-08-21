const express = require("express");
const router = express.Router();
const controller = require("../controller/schedule");

router.post("/", controller.create);

router.post("/:id/recipients", controller.addRecipient);

router.get("/", controller.get);

router.get("/:id", controller.getOne);

router.patch("/:id", controller.update);

router.delete("/:id", controller.delete);

module.exports = router;



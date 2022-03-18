module.exports = app => {
  const treasure = require("../controllers/treasure.controller.js");

  var router = require("express").Router();
  router.get("/", treasure.getAll);
  router.get("/code", treasure.getAllStockCode);
  router.get("/list", treasure.getStock);
  router.post("/", treasure.create);
  router.delete("/", treasure.delete);
  router.patch("/", treasure.update);

  app.use('/api/treasure', router);
};
module.exports = app => {
  const stockDaily = require("../controllers/stockDaily.controller.js");

  var router = require("express").Router();

  // Create a new Tutorial
  router.post("/", stockDaily.create);

  router.get("/all", stockDaily.findStock);

  // Retrieve all Tutorials
  router.get("/", stockDaily.findAll);

  router.get("/fialda", stockDaily.findFialdaFilter);

  // // Retrieve all published Tutorials
  // router.get("/published", tutorials.findAllPublished);

  // // Retrieve a single Tutorial with id
  // router.get("/:id", tutorials.findOne);

  // // Update a Tutorial with id
  // router.put("/:id", tutorials.update);

  // // Delete a Tutorial with id
  // router.delete("/:id", tutorials.delete);

  // // Create a new Tutorial
  // router.delete("/", tutorials.deleteAll);

  app.use('/api/stockDaily', router);
};
const dbConfig = require("../config/db.config.js");

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = dbConfig.url;
db.StockDaily = require("./stockDaily.model.js")(mongoose);
db.Treasure = require("./treasure.model.js")(mongoose);
db.Profit = require("./profit.model.js")(mongoose);

module.exports = db;
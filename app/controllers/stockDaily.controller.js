const { lowest } = require("technicalindicators");
const db = require("../models");
const vietstock = require("../vietstock/vietstock.js")
const StockDaily = db.StockDaily;
var indicator = require("../indicator/indicator.js")
const telegram = require("../telegram/telegram.js")
var dateFormat = require('dateformat');

exports.create = (req, res) => {
    const stockDaily = new StockDaily({
        date: req.body.date,
        stock: req.body.stock
    });

    stockDaily
        .save(stockDaily)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Tutorial."
            });
        });
};

exports.findStock = async(req, res) => {
    let stockList = require('../../stock-code.json');
    res.send('OK')
    let count = await loopList(stockList.data)
    var today = dateFormat(new Date(), "yyyy-mm-dd");
    let message = today + ' found: ' + count + '\nhttps://pdkhanh.github.io/stock-3k-fe/'
    console.log(message)
        // telegram.sendMessage(message)
};

async function loopList(list) {
    let count = 0
    await Promise.all(list.map(async(e) => {
        let patternResult = await findPattern(e.StockID);
        if (patternResult == undefined) return
        try {
            count++;
            let dailyDataAppended = await appendDailyData(e.StockID)
            patternResult.daily = patternResult.daily.concat(dailyDataAppended)
            console.log(patternResult.daily)
            saveStockPattern(patternResult)
        } catch (err) {
            console.log(patternResult)
        }
    }));
    return count
}

async function appendDailyData(stockId) {
    let dailyData = [];
    var today = new Date();
    let numberOfMonth = 3;
    let numberOfDayPerMonth = 28;
    for (let i = 1; i <= numberOfMonth; i++) {
        let fromDate = dateFormat(new Date().setDate(today.getDate() - (i + 1) * numberOfDayPerMonth), "yyyy-mm-dd");
        let toDate = dateFormat(new Date().setDate(today.getDate() - i * numberOfDayPerMonth + 1), "yyyy-mm-dd");
        let monthlyData = await vietstock.getStockDataByDate(stockId, fromDate, toDate)
        dailyData = dailyData.concat(monthlyData.daily)
    }
    return dailyData
}

async function findPattern(stockId) {
    let stock
    let data = await vietstock.getStockData(stockId);
    if (data.mTotalVol < 500000) return
    let indicatorResult = indicator.scanCandlestick(data)
    if (indicatorResult.pattern.length > 0) {
        stock = {
            code: data.stockCode,
            name: data.stockName,
            date: data.date,
            price: data.price,
            change: data.change,
            perChange: data.perChange,
            mTotalVol: data.mTotalVol,
            marketCap: data.marketCap,
            image: indicatorResult.image,
            daily: data.daily,
            pattern: indicatorResult.pattern,
        }
    }
    return stock
}

function saveStockPattern(data) {
    const stockDaily = new StockDaily({
        date: data.date,
        code: data.code,
        name: data.name,
        price: data.price,
        change: data.change,
        perChange: data.perChange,
        mTotalVol: data.mTotalVol,
        ptTotalVol: data.ptTotalVol,
        image: data.image,
        marketCap: data.marketCap,
        daily: data.daily,
        pattern: data.pattern
    });
    stockDaily
        .save(stockDaily)
}

// Retrieve all Tutorials from the database.
exports.findAll = (req, res) => {
    const date = req.query.date;
    var condition = date ? { date: { $regex: new RegExp(date), $options: "i" } } : {};

    StockDaily.find(condition)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving tutorials."
            });
        });
};

// Find a single Tutorial with an id
exports.findOne = (req, res) => {

};

// Update a Tutorial by the id in the request
exports.update = (req, res) => {

};

// Delete a Tutorial with the specified id in the request
exports.delete = (req, res) => {

};

// Delete all Tutorials from the database.
exports.deleteAll = (req, res) => {

};

// Find all published Tutorials
exports.findAllPublished = (req, res) => {

};
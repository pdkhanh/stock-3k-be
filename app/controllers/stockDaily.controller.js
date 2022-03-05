const { lowest } = require("technicalindicators");
const db = require("../models");
const vietstock = require("../vietstock/vietstock.js")
const fialda = require("../fialda/fialda.js")
const telegram = require("../telegram/telegram.js")
const StockDaily = db.StockDaily;
var indicator = require("../indicator/indicator.js")
var dateFormat = require('dateformat');
var jsonpath = require('jsonpath');

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

exports.findStock = async (req, res) => {
    let stockList = require('../../stock-code.json');
    res.send('OK')
    let count = await loopList(stockList.data)
    var today = dateFormat(new Date(), "yyyy-mm-dd");
    let message = today + ' found: ' + count + '\nhttps://pdkhanh.github.io/stock-3k-fe/'
    // telegram.sendMessage(message)
};

async function loopList(list) {
    let count = 0
    await Promise.all(list.map(async (e) => {
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
    const stockDaily = new StockDaily(data);
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


exports.findFialdaFilter = async (req, res) => {
    let filterName = req.query.filterName
    let filterResult = await fialda.getFilterResult(filterName)
    let stockList = jsonpath.query(JSON.parse(filterResult), '$.result')[0]
    let result = await getAndSaveStockDataSequence(filterName, stockList)
    res.send(result)
    let message = generateMessageMACD(filterName, result)
    console.log(message)
    telegram.sendMessage(message)
};

async function getAndSaveStockDataParallel(stockList) {
    let data = []
    await Promise.all(stockList.map(async (e) => {
        try {
            let stockData = await vietstock.getStockData(e)
            saveStockPattern(stockData)
            delete stockData.daily
            data.push(stockData)
        } catch (err) {
            console.log(err)
        }
    }));
    return data
}

async function getAndSaveStockDataSequence(filterName, stockList) {
    let data = []
    for (const stockName of stockList) {
        console.log(stockName)
        let stockData = await vietstock.getStockData(stockName)
        if (filterName != 'MACD') saveStockPattern(stockData)
        delete stockData.daily
        data.push(stockData)
    }
    return data
}

function generateMessageMACD(filterName, data) {
    let today = dateFormat(new Date(), "yyyy-mm-dd");
    let count = data.length
    let stockData = ''
    let url = 'https://pdkhanh.github.io/stock-3k-fe/?date=' + today
    data.forEach(element => {
        stockData += `${element.code} ${addDotToCurrency(element.price)} (${addDotToCurrency(element.change)} ${element.perChange}%) ${addLetterToCurrency(element.mTotalVal)}\n`
    });
    let message = `${filterName} - ${today} found ${count} \n${stockData}${url}`
    return message
}


function addLetterToCurrency(labelValue) {
    // Nine Zeroes for Billions
    return Math.abs(Number(labelValue)) >= 1.0e+9
        ? (Math.abs(Number(labelValue)) / 1.0e+9).toFixed(2) + "B"
        // Six Zeroes for Millions 
        : Math.abs(Number(labelValue)) >= 1.0e+6
            ? (Math.abs(Number(labelValue)) / 1.0e+6).toFixed(2) + "M"
            // Three Zeroes for Thousands
            : Math.abs(Number(labelValue)) >= 1.0e+3
                ? (Math.abs(Number(labelValue)) / 1.0e+3).toFixed(2) + "K"
                : Math.abs(Number(labelValue));
}

function addDotToCurrency(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + '.' + '$2');
    }
    return x1 + x2;
}
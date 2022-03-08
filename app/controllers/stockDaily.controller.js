const db = require("../models");
const vietstock = require("../vietstock/vietstock.js")
const fialda = require("../fialda/fialda.js")
const telegram = require("../telegram/telegram.js")
const StockDaily = db.StockDaily;
var dateFormat = require('dateformat');
var jsonpath = require('jsonpath');
var request = require("request");

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

function saveStockPattern(data) {
    const stockDaily = new StockDaily(data);
    stockDaily
        .save(stockDaily)
}

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
    callTreasureApi(result, filterName)
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

async function callTreasureApi(data, filter) {
    let body = await generateTreasureBody(data, filter)
    return new Promise(function (resolve, reject) {
        URL = `https://stock-3k-be.herokuapp.com/api/treasure`;
        console.log(URL)
        request({
            url: URL,
            method: "POST",
            json: true,
            body: body
        }, function (error, response, body) {
            if (error) reject(error)
            resolve(response)
        })
    });
}

async function generateTreasureBody(data, filter) {
    let today = dateFormat(new Date(), "mm/dd/yyyy");
    let treasureList = []
    data.forEach(e => {
        let treasure = {
            code: e.code,
            addedDate: today,
            initPrice: 0,
            filter: filter
        }
        treasureList.push(treasure)
    });
    return treasureList
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
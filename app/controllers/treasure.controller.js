const db = require("../models");
const vietstock = require("../vietstock/vietstock.js")
const properties = require("../file-helper/propertiesReader.js")
const Treasure = db.Treasure;
const Profit = db.Profit;
var dateFormat = require('dateformat');
const telegram = require("../telegram/telegram.js")

exports.create = async (req, res) => {
    Array.isArray(req.body) ? createMultiple(req, res) : createSingle(req, res)
};

async function createSingle(req, res) {
    let body = req.body
    let data = await initTreasureData(body)
    const treasure = new Treasure(data);
    if (data.message) {
        res.send(data)
        return
    }
    treasure.save(treasure).then(() => {
        res.send(data)
    }).catch(err => {
        if (err.code == 11000) res.send({ message: err.keyValue.code + ' already existed' })
    })
};

let createMultiple = async (req, res) => {
    let body = req.body
    if (body.length == 0) {
        res.send('OK')
        return
    }
    let result = []
    let filterName = body[0].filter
    let existingData = await Treasure.find({ filter: filterName }, { code: 1 })
    let existingStock = []
    existingData.forEach(element => {
        existingStock.push(element.code)
    });

    for (const stock of body) {
        if (!existingStock.includes(stock.code)) {
            let data = await initTreasureData(stock)
            result.push(data)
        }
    }

    Treasure.create(result).then(() => {
        res.send(result)
    })
};

exports.getAll = async (req, res) => {
    let filterName = req.query.filter
    let query = { filter: filterName }
    console.log(query)
    let data = JSON.parse(JSON.stringify(await Treasure.find(query).select(['-_id', '-createdAt', '-updatedAt'])))
    for (let e of data) {
        await calculateStockData(e)
    }
    res.send(data)
};

exports.getAllStockCode = async (req, res) => {
    let filterName = req.query.filter
    let mode = req.query.mode == 'Treasure' ? Treasure : Profit
    let query = { filter: filterName }
    console.log(query)
    let data = JSON.parse(JSON.stringify(await mode.find(query).select(['code'])))
    let stockList = []
    data.forEach(e => stockList.push(e.code))
    res.send(stockList)
};

exports.getStock = async (req, res) => {
    let filterName = req.query.filter
    let mode = req.query.mode == 'Treasure' ? Treasure : Profit
    let stockList = req.query.stockList
    let query = { filter: filterName, code: { $in: stockList } }
    console.log(query)
    let data = JSON.parse(JSON.stringify(await mode.find(query).select(['-_id', '-createdAt', '-updatedAt'])))
    if (mode == Treasure) {
        for (let e of data) {
            await calculateStockData(e)
        }
    }
    res.send(data)
};

exports.delete = async (req, res) => {
    Treasure.deleteOne(req.body, function (err) {
        if (err) res.send(err)
    });
    res.send({ status: 'Deleted ' + req.body.code })
};

exports.update = async (req, res) => {
    let stockCode = req.body.code
    let newPrice = req.body.initPrice
    Treasure.updateOne({ code: stockCode },
        { initPrice: newPrice }, function (err) {
            if (err) res.send(err)
        });
    res.send({ status: 'OK' })
};

async function initTreasureData(initData) {
    try {
        let vietstockData = await vietstock.getStockData(initData.code)
        initData.initPrice = initData.initPrice == 0 ? vietstockData.price : initData.initPrice
        let profit = vietstockData.price - initData.initPrice
        let profitPercent = profit * 100 / initData.initPrice
        let data = {
            code: initData.code,
            addedDate: initData.addedDate,
            initPrice: initData.initPrice == 0 ? vietstockData.price : initData.initPrice,
            filter: initData.filter,
            profit: profit,
            profitPercent: profit == 0 ? 0 : profitPercent.toFixed(2),
            price: vietstockData.price,
            change: vietstockData.change,
            perChange: vietstockData.perChange
        }
        return data
    } catch (err) {
        console.log(err)
        return { message: `${initData.code} not found` }
    }
}

exports.takeProfit = async (req, res) => {
    let takeProfitDates = getTakeProfitDate()
    console.log(takeProfitDates)
    let response = []
    for (const date of takeProfitDates) {
        let query = { filter: { $ne: 'Self' }, addedDate: date[1] }
        console.log(query)
        let data = JSON.parse(JSON.stringify(await Treasure.find(query).select(['-_id', '-createdAt', '-updatedAt'])))
        for (let e of data) {
            await calculateStockData(e)
            e.T = date[0]
        }
        response.push([date[0], data])
        await Profit.create(data)
    }
    let query = { filter: { $ne: 'Self' }, addedDate: takeProfitDates[2][1] }
    await Treasure.deleteMany(query)
    let message = generateTakeProfitMessage(response)
    telegram.sendMessage(message)
    res.send({ message: message })
};

function generateTakeProfitMessage(data) {
    let today = dateFormat(new Date(), "yyyy-mm-dd");
    let message = today
    data.forEach(e => {
        message += `\nT${e[0]}`
        let stockDetail = ''
        let totalProfitPercent = 0
        if (e[1].length == 0) {
            stockDetail += `\nNo Taking Profit`
        } else {
            e[1].forEach(element => {
                stockDetail += `\n${element.code} ${addDotToCurrency(element.price)} (${addDotToCurrency(element.change)} ${element.perChange}%) => ${element.profitPercent}%`
                totalProfitPercent += element.profitPercent
            })
        }
        totalProfitPercent = e[1].length == 0 ? ' 0.00%' : ` ${(totalProfitPercent / e[1].length).toFixed(2)}%`
        message += totalProfitPercent
        message += stockDetail
    });
    return message
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

async function calculateStockData(data) {
    let vietstockData = await vietstock.getStockData(data.code)
    let profit = vietstockData.price - data.initPrice
    let profitPercent = profit * 100 / data.initPrice
    data.profit = profit
    data.profitPercent = profit == 0 ? 0 : parseFloat(profitPercent.toFixed(2))
    data.price = vietstockData.price
    data.change = vietstockData.change
    data.perChange = vietstockData.perChange
    return data
}

const publicHolidays = ["2022-01-01", "2022-01-29", "2022-01-30", "2022-01-31", "2022-02-01", "2022-02-02", "2022-02-03", "2022-04-10", "2022-04-30", "2022-05-01", "2022-09-01", "2022-09-02"]

function getTakeProfitDate() {
    let output = []
    let takeProfitDays = [3, 5, 7]
    for (const takeProfitDay of takeProfitDays) {
        output.push([takeProfitDay, calculateWeekDay(takeProfitDay)])
    }
    return output
}

function calculateWeekDay(day) {
    let i = 1
    let actualMinusDay = 0
    while (i <= day) {
        let counter = ++actualMinusDay
        if (!isWeekend(minusDay(counter)) && !isPublicHoliday(minusDay(counter))) i++
    }
    return dateFormat(minusDay(actualMinusDay), "mm/dd/yyyy")
}

function isWeekend(date) {
    return [0, 6].includes(date.getDay())
}

function isPublicHoliday(date) {
    for (const holiday of publicHolidays) {
        let holidate = new Date(dateFormat(holiday, "mm/dd/yyyy"))
        if (holidate.getTime() == date.getTime()) {
            return true
        }
    }
    return false
}

function minusDay(day) {
    let today = new Date()
    today.setDate(today.getDate() - day)
    return new Date(dateFormat(today, "mm/dd/yyyy"));
}
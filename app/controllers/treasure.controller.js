const db = require("../models");
const vietstock = require("../vietstock/vietstock.js")
const Treasure = db.Treasure;

exports.create = async (req, res) => {
    let body = req.body
    let data = await initTreasureData(body)
    const treasure = new Treasure(data);
    if (data.message) {
        res.send(data)
        return
    }
    treasure.save(treasure).then(data => {
        res.send(data)
    }).catch(err => {
        if (err.code == 11000) res.send({ message: err.keyValue.code + ' already existed' })
    })
    // 
};

exports.getAll = async (req, res) => {
    let data = await Treasure.find({})
    for (const e of data) {
        await calculateStockData(e)
    }
    res.send(data)
};

exports.delete = async (req, res) => {
    let stockCode = req.body.code
    Treasure.deleteOne({ code: stockCode }, function (err) {
        if (err) res.send(err)
    });
    res.send('Deleted ' + stockCode)
};

exports.update = async (req, res) => {
    let stockCode = req.body.code
    let newPrice = req.body.initPrice
    Treasure.updateOne({ code: stockCode },
        { initPrice: newPrice }, function (err) {
            if (err) res.send(err)
        });
    res.send('OK')
};

async function initTreasureData(initData) {
    try {
        let vietstockData = await vietstock.getStockData(initData.code)
        let data = {
            code: initData.code,
            addedDate: initData.addedDate,
            initPrice: initData.initPrice == 0 ? vietstockData.price : initData.initPrice,
            change: 0,
            perChange: 0,
            currentPrice: vietstockData.price,
            currentChange: vietstockData.change,
            currentPerChange: vietstockData.perChange
        }
        return data
    } catch (err) {
        return { message: `${initData.code} not found` }
    }
}

async function calculateStockData(data) {
    let vietstockData = await vietstock.getStockData(data.code)
    let change = vietstockData.price - data.initPrice
    let perChange = change * 100 / data.initPrice
    data.change = change
    data.perChange = change == 0 ? 0 : perChange.toFixed(2)
    data.price = vietstockData.price
    data.currentChange = vietstockData.change
    data.currentPerChange = vietstockData.perChange
    console.log(data)
    return data
}
const db = require("../models");
const vietstock = require("../vietstock/vietstock.js")
const Treasure = db.Treasure;

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
    res.send({status: 'OK'})
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

async function calculateStockData(data) {
    let vietstockData = await vietstock.getStockData(data.code)
    let profit = vietstockData.price - data.initPrice
    let profitPercent = profit * 100 / data.initPrice
    data.profit = profit
    data.profitPercent = profit == 0 ? 0 : parseFloat(profitPercent.toFixed(2))
    data.price = vietstockData.price
    data.change = vietstockData.change
    data.perChange = vietstockData.perChange
    // console.log(data)
    return data
}
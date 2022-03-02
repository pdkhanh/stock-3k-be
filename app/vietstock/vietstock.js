var request = require("request");
var dateFormat = require('dateformat');
var jsonpath = require('jsonpath');
let stockList = require('../../stock-data.json');

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Cookie': '_ga=GA1.2.1511279543.1645889010; _gid=GA1.2.1394641294.1645889010; language=vi-VN; ASP.NET_SessionId=zj1pa3vr3pt3gwolkndt2q51; __RequestVerificationToken=0l9vXYyAmIqng6B77UgXqr98GEfUbKSa09LrxOtgmn6IJ7M_avnXjwSRHeRr5Iuq8srZMY50GQBQcdqpJracMtNpDnxij1Q8p17sUes_B741; Theme=Light; AnonymousNotification=; _gat_UA-1460625-2=1; isShowLogin=true; finance_viewedstock=AAA,; _gat_gtag_UA_1460625_2=1; ASP.NET_SessionId=ulc3pxqbrpfxkwkvxvea3pyr; __RequestVerificationToken=KzFpUDJZH9Ij4NdtrqXSSqHYFfjHdDI7QINUjXbykhoiU_eAWXL1yxQFI6LvHygum7F4JFqs57QKyH_fILUWo3ZuRxXEogOXvq6OTf6rZhQ1; language=vi-VN'
};

var today = dateFormat(new Date(), "yyyy-mm-dd");

var dayMinus28 = new Date();
dayMinus28.setDate(dayMinus28.getDate() - 200);
dayMinus28 = dateFormat(dayMinus28, "yyyy-mm-dd");

function getStockData(stockCode) {
    let body = `Code=${stockCode}&OrderBy=&OrderDirection=desc&PageIndex=1&PageSize=200&FromDate=${dayMinus28}&ToDate=${today}&ExportType=default&Cols=TKLGD%2CTGTGD%2CVHTT%2CTGG%2CDC%2CTGPTG%2CCN%2CTN%2CGYG%2CBQ%2CKLGDKL%2CGTGDKL&ExchangeID=1&__RequestVerificationToken=26vdjbEBBP-m_L6Jtwpf1k09RWCA4X61vQb6SvzXMfRsRjDdW1RuWWE9sxCsaDp72SCrU09lR2n2CCosd1_J53PGKcfy4ABjYAzKNdkBKUY1`
    return new Promise(function (resolve, reject) {
        URL = `https://finance.vietstock.vn/data/gettradingresult`;
        console.log(URL)
        request({
            url: URL,
            method: "POST",
            headers: headers,
            body: body
        }, function (error, response, body) {
            try {
                let resData = JSON.parse(response.body)
                resolve(getData(resData.Data))
            } catch (err) {
                console.log(err)
                console.log(stockCode)
                console.log(response.body)
                resolve(null)
            }
            if (error) reject(error)
        })
    });
}

function getData(body) {
    let stockCode = body[0]['StockCode']
    try {
        let stockOffflineData = jsonpath.query(stockList, `$..[?(@.code=="${stockCode}")]`)[0]
        open = []
        close = []
        high = []
        low = []
        daily = []
        var regExp = /\(([^)]+)\)/;
        body.forEach(element => {
            let openPrice = element['OpenPrice']
            let closePrice = element['ClosePrice']
            let highstPrice = element['ClosePrice']
            let lowestPrice = element['LowestPrice']
            let totalVol = element['MT_TotalVol']
            let timeStamps = regExp.exec(element['TradingDate'])[1]
            let date = dateFormat(new Date(parseInt(timeStamps)), "yyyy-mm-dd");
            open.push(openPrice)
            close.push(closePrice)
            high.push(highstPrice)
            low.push(lowestPrice)
            dailyData = [date, openPrice, highstPrice, lowestPrice, closePrice, totalVol]
            daily.push(dailyData)
        });
        var data = {
            'code': stockCode,
            'name': stockOffflineData == undefined ? '' : stockOffflineData.name,
            'exchange': stockOffflineData == undefined ? '' : stockOffflineData.exchange,
            'date': today,
            'price': body[0].ClosePrice,
            'change': body[0].Change,
            'perChange': body[0].PerChange,
            'mTotalVol': body[0].MT_TotalVol,
            'mTotalVal': body[0].MT_TotalVal,
            'marketCap': body[0].MarketCapital,
            'daily': daily
        }
        // for (let index = 1; index < 31; index++) {
        //     data[`dayInput${index}`] = {
        //         'open': open.slice(0, index).reverse(),
        //         'high': high.slice(0, index).reverse(),
        //         'close': close.slice(0, index).reverse(),
        //         'low': low.slice(0, index).reverse(),
        //     }
        // }
        return data
    } catch (err) {
        console.log(stockCode)
        console.log(err)
    }
}

exports.getData = getData;
exports.getStockData = getStockData;
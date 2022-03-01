var request = require("request");
var jsonpath = require('jsonpath');

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
};

const filter = {
    "MACD": '{\n    "faFilter": {\n        "AvgVol3M": {\n            "min": 50000,\n            "max": 33887231\n        },\n        "RS1M": {\n            "min": 1,\n            "max": 99\n        },\n        "LastPrice": {\n            "min": 0,\n            "max": 325\n        },\n        "TotalDealVol": {\n            "min": 50000.00,\n            "max": 39439790\n        }\n    },\n    "taFilter": {\n        "filterByKeys": [\n            "BreakUpperBound_MACDvsSignal_Daily"\n        ],\n        "filterByKeyAndValues": {\n            "MutationVolume_Today_AvgVol5D": 120\n        },\n        "compareResultOfTwoSMAs": null\n    },\n    "booleanFilter": null,\n    "pageNumber": 1,\n    "pageSize": 10000,\n    "exchanges": [\n        "HSX",\n        "HNX",\n        "UPCOM"\n    ],\n    "icbCodes": null,\n    "sortColumn": "Symbol",\n    "isDesc": false\n}',
    "Anzik": '{ "faFilter": { "AvgVol3M": { "min": 700000, "max": 29416078 }, "RS1M": { "min": 80, "max": 99 }, "LastPrice": { "min": 0, "max": 300 } }, "taFilter": { "filterByKeys": [], "filterByKeyAndValues": { "RSI14_Daily_T0_Values_Greater": 55, "MutationVolume_Today_AvgVol5D":250 }, "compareResultOfTwoSMAs": null }, "booleanFilter": null, "pageNumber": 1, "pageSize": 10000, "exchanges": ["HSX", "HNX", "UPCOM"], "icbCodes": null, "sortColumn": "Symbol", "isDesc": false }'
}


function getFilterResult(filterName) {
    var headers = {
        'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
        'content-type': 'application/json;charset=UTF-8',
        'accept': 'application/json, text/plain, */*',
        'cache-control': 'private, no-cache, no-store, must-revalidate',
        'x-alt-referer': 'https://fwt.fialda.com/search/tieu-chi-loc',
        '.aspnetcore.culture': 'en-US',
        'sec-ch-ua-platform': '"macOS"',
        'origin': 'https://fwt.fialda.com',
        'sec-fetch-site': 'same-site',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
        'referer': 'https://fwt.fialda.com/',
        'accept-language': 'en-US,en;q=0.9,vi;q=0.8'
    };
    let body = filter[filterName]

    return new Promise(function (resolve, reject) {
        URL = `https://fwtapi2.fialda.com/api/services/app/Stock/GetByFilter`;
        console.log(URL)
        request({
            url: URL,
            method: "POST",
            headers: headers,
            body: body
        }, function (error, response, body) {
            try {
                let responseData = {
                    filterName: filterName,
                    result: jsonpath.query(JSON.parse(response.body), '$.result.items')[0]
                }
                resolve(JSON.stringify(responseData))
            } catch (err) {
                console.log(err)
            }
            if (error) reject(error)
        })
    });
}

exports.getFilterResult = getFilterResult

/**************************************************
 *              NOTE                              *
 **************************************************/



/**************************************************
 *              FIRST INITIALZATION               *
 **************************************************/
var lineChart = new STOCKU.Chart("lineChartDiv", "line");
var candlestickChart = new STOCKU.Chart("candlestickChartDiv", "candlestick");
var accuracyHistoryChart = new STOCKU.Chart("accuracyHistoryDiv", "accuracy", "YYYY-MM-DD");
var searcherblock = new STOCKU.SearcherWithDate("searcherdiv");
var idtable = STOCKU.LoadSettings("tables/idtable.json");


/**************************************************
 *              GLOBAL FUNCTION                   *
 **************************************************/
function getPrice(stock, date) {
    var lastTimeUpdate = (stock == searcherblock.state.price) ?
        searcherblock.state.price.updateTime : undefined;
    log("Getting Price...");
    return new Promise((resolve, reject) => {
        $.get("/StockData/price", {
                stock: stock,
                date: date,
                lastTimeUpdate: lastTimeUpdate
            })
            .done((response) => {
                if (response.msg == "DataFound") {
                    $("#logmsg").trigger("set", ["找到價錢資料", "green"]);
                    searcherblock.state.price = {
                        updateTime: new Date().getTime(),
                        stock: stock
                    };
                    resolve(response.content);
                } else if (response.msg == "DataNotFound") {
                    $("#logmsg").trigger("set", ["沒有找到價錢資料", "red"]);
                    searcherblock.state.price = {
                        updateTime: undefined,
                        stock: stock
                    };
                    reject(response);
                } else {
                    $("#logmsg").trigger("set", ["價錢資料已是最新", "blue"]);
                    reject(response);
                }
            })
            .fail((response) => {
                reject(response);
            });
    });
}


function getForecast(stock, date) {
    var lastTimeUpdate = (stock == searcherblock.state.forecast) ?
        searcherblock.state.forecast.updateTime : undefined;

    log("Getting Forecast...");
    return new Promise((resolve, reject) => {
        $.get("/StockData/forecast", {
                stock: stock,
                date: date,
                lastTimeUpdate: lastTimeUpdate
            })
            .done((response) => {
                if (response.msg == "DataFound") {
                    $("#logmsg").trigger("add", ["找到預測資料", "green"]);
                    searcherblock.state.forecast = {
                        updateTime: new Date().getTime(),
                        stock: stock
                    };
                    resolve(response.content);
                } else if (response.msg == "DataNotFound") {
                    $("#logmsg").trigger("add", ["沒有找到預測資料", "red"]);
                    searcherblock.state.forecast = {
                        updateTime: undefined,
                        stock: stock
                    };
                    reject(response);
                } else {
                    $("#logmsg").trigger("add", ["預測資料已是最新", "blue"]);
                    reject(response);
                }
            })
            .fail((response) => {
                reject(response);
            });
    });
}

function getAccuracy(stock){
    log("Getting Accuracy...");
    return new Promise((resolve, reject) => {
        $.get("/StockData/AccuracyHistory", {
            stock: stock
        })
        .done((response) => {
            if (response.msg == "DataFound") {
                $("#logmsg").trigger("add", ["找到準確率資料", "green"]);
                searcherblock.state.accuracy = {
                    updateTime: new Date().getTime(),
                    stock: stock
                };
                resolve(response.content);
            } else if (response.msg == "DataNotFound") {
                $("#logmsg").trigger("add", ["沒有找到準確率資料", "red"]);
                searcherblock.state.accuracy = {
                    updateTime: undefined,
                    stock: stock
                };
                reject(response);
            } else {
                $("#logmsg").trigger("add", ["準確率資料已是最新", "blue"]);
                reject(response);
            }
        })
        .fail((response) => {
            reject(response);
        });
    });
}


function genNewData() {
    var arr = lineChart.arrayData();
    var currTime = new Date(arr[arr.length - 1].time);
    var nextTime = new Date(currTime);
    nextTime.setMinutes(currTime.getMinutes() + 1);

    var currPrice = STOCKU.randomDatum(arr[arr.length - 2].price, 5);
    var nextForecast = STOCKU.randomDatum(currPrice, 5);

    arr[arr.length - 1].price = currPrice;
    var nextData = {
        time: nextTime,
        forecast: nextForecast
    };
    arr.push(nextData);

    STOCKU.addRMSE(arr);
    lineChart.validateData();
}


/**************************************************
 *              DEBUG FUNCTION                    *
 **************************************************/
//If you wanna disable debugging, make var enable_debug
//false !!
var enable_debug = true;
//--------------------------------------------------
function log(msg, debug = true) {
    if (debug && enable_debug)
        console.log(msg);
}
/**************************************************
 *              DEPLOY EVENT                      *
 **************************************************/

$("#logmsg").on("set", function(event, msg, color) {
    var msg = '<div style="color:' + color + '">' + msg + '</div>'
    this.innerHTML = msg;
})

$("#logmsg").on("add", function(event, msg, color) {
    var msg = '<div style="color:' + color + '">' + msg + '</div>'
    this.innerHTML = this.innerHTML + "<br>" + msg;
});

$("#stockNameMsg").on("update", function() {
    var stockNum = searcherblock.$.input.val();
    this.innerHTML = stockNum ? idtable[stockNum] : "隨機";
});
$("#closeMsg").on("update", function() {
    this.innerHTML = "TWD$ "
    this.innerHTML += STOCKU.getLastElementAppear(lineChart.arrayData(), "price").element.price;
});
$("#deltaMsg").on("update", function() {
    var arr = lineChart.arrayData();
    var lastElement = STOCKU.getLastElementAppear(arr, "price");
    var delta = lastElement.element.price - arr[lastElement.index - 1].price;
    this.innerHTML = delta >= 0 ? '+' + delta.toFixed(2) : delta.toFixed(2);
    this.style["background-color"] = delta >= 0 ? "red" : "green";
});

$("#trendMsg").on("update", function(event, slope) {
    slope = slope || 0;
    this.innerHTML = (slope == 0 ? "持平" : slope > 0 ? "看漲" : "看跌") + "(" + slope.toFixed(2) + ")";
    this.style.color = slope > 0 ? "red" : slope < 0 ? "green" : "gray";
});


$("#accuracyMsg").on("update", function(event, val) {
    val *= 100;
    var bgcolor;
    switch (true) {
        case val < 60:
            bgcolor = "rgba(0, 0, 0, 0.5)";
            break;
        case val < 70:
            bgcolor = "rgba(255,0, 0, 0.5)";
            break;
        case val <= 80:
            bgcolor = "rgba(255, 125, 0, 0.5)";
            break;
        default:
            bgcolor = "rgba(0, 125, 0, 0.5)";
            break;
    }
    this.style["background-color"] = bgcolor;
    this.style.color = "white";
    this.innerHTML = val.toFixed(2) + "%";
});

$("#timeScale").on("modify", function(event, val) {
    var arr = STOCKU.JsonToArray(lineChart.jsonData);
    var timeScaleArr = STOCKU.TimeScale(arr, val);
    lineChart.arrayData(timeScaleArr);
    lineChart.validateData();
    // console.log(arr)
    candlestickChart.arrayData(STOCKU.ToOhlc(arr, val, "min"));
    candlestickChart.validateData();

});


// Override search();
searcherblock.searcher.search = function() {
    // clear data
    lineChart.jsonData = {};
    var stock = searcherblock.$.input.val();
    var date = searcherblock.$.date.val();
    getPrice(stock, date)
        .then(
            (data) => {
                if(searcherblock.state.price.stock !== stock)
                    lineChart.jsonData = {};
                lineChart.addJsonData(data);
                candlestickChart.arrayData(STOCKU.ToOhlc(lineChart.arrayData(), 1, "min"));
                $("#stockNameMsg").trigger("update");
                $("#deltaMsg").trigger("update");
                $("#closeMsg").trigger("update");
                return getForecast(stock, date);
            },
            (response) => getForecast(stock, date)
        )
        .then(
            (data) => {
                lineChart.addJsonData(data);
                STOCKU.addRMSE(lineChart.arrayData());

                var slope = STOCKU.TrendLine(lineChart.arrayData());
                $("#trendMsg").trigger("update", slope);

                lineChart.updateJsonFromArray();
                lineChart.validateData();
                candlestickChart.validateData();
                return getAccuracy(stock);
            }
        )
        .then(
            (data)=> {
                if(searcherblock.state.accuracy.stock !== stock)
                    accuracyHistoryChart.jsonData = {};
                accuracyHistoryChart.addJsonData(data);
                var arr = accuracyHistoryChart.arrayData();

                var prevData = arr[arr.length - 1];

                var accuracySoFar = STOCKU.addAccuracy(lineChart.arrayData(), prevData);
                $("#accuracyMsg").trigger("update", accuracySoFar);

                arr.forEach((element) => {
                    element.accuracy = (parseInt(element.numAcc) / parseInt(element.total)).toFixed(2);
                });
                accuracyHistoryChart.updateJsonFromArray();
                accuracyHistoryChart.validateData();
            }
        );
}

/**************************************************
 *              MAIN                              *
 **************************************************/
// set up searcher block
searcherblock.$.input.val(3057);
searcherblock.$.date.val("2016-12-23");
searcherblock.$.button.mouseup();
lineChart.validateData();
// //--------------------------------------------------

// // Random Data
// $("#logmsg").trigger("set", ["此為隨機產生之資料", "purple"]);
//
// var priceData = STOCKU.genJsonData("2016-11-07 09:00:00", "2016-11-07 13:00:00", "price", 1, "min");
// var forecastData = STOCKU.genJsonData("2016-11-07 09:00:00", "2016-11-07 13:01:00", "forecast", 1, "min", 4, priceData, "price");
// priceData = STOCKU.ObjectCombine(priceData, forecastData);
// lineChart.addJsonData(priceData);
// STOCKU.addRMSE(lineChart.arrayData());
// candlestickChart.arrayData(STOCKU.ToOhlc(lineChart.arrayData(), 5, "min"));
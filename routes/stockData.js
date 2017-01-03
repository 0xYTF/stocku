var express = require('express');
var path = require('path');
var fs = require('fs');
var iconv = require('iconv-lite');
var request = require('request');
var $ = require('jquery')(require("jsdom").jsdom().defaultView);



// Define prototype of date
Date.prototype.yyyymmdd = function() {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();
    var yyyy = this.getFullYear();
    return yyyy + "-" + (mm < 10 ? '0' + mm : mm) + "-" + (dd < 10 ? '0' + dd : dd)
}

var router = express.Router();

var updateTime = new Date();
// updateTime.setSeconds(updateTime.getSeconds() + 20);



/* GET stock data page. */
router.get('/price', function(req, res) {
    console.log("[GET] 'StockData/price'", req.query);
    var date = req.query.date.split('-').join('');
    var stock = req.query.stock;
    var lastTimeUpdate = req.query.lastTimeUpdate;
    var file_path = 'database/price/' + date + '_' + stock + '.csv';
    fs.stat(file_path, (err,stats)=>{
        if(!stats) return DataNotFoundMsg(res,err);
        var updateTime = new Date(stats.mtime);

        if (!lastTimeUpdate || (Number(lastTimeUpdate) < updateTime.getTime())) {
            fs.readFile(file_path, 'utf-8', (err, data) => {
                if (err) return DataNotFoundMsg(res,err);
                    res.send({
                        msg: 'DataFound',
                        stock: stock,
                        date: date,
                        content: parseCSVToJSON(data)
                    });
            });
        }
        else{
            res.send({
                msg: 'AlreadyUpdate'
            });
        }
    });
});


router.get('/forecast', function(req, res) {
    console.log("[GET] 'StockData/forecast'", req.query);
    var date = req.query.date.split('-').join('');
    var stock = req.query.stock;
    var lastTimeUpdate = req.query.lastTimeUpdate;
    var file_path = 'database/forecast/' + date + '_' + stock + '.fc.csv';
    fs.stat(file_path, (err,stats)=>{
        if(!stats) return DataNotFoundMsg(res,err);

        var updateTime = new Date(stats.mtime);

        if (!lastTimeUpdate || (Number(lastTimeUpdate) < updateTime.getTime())) {
            fs.readFile(file_path, 'utf-8', (err, data) => {
                if (err) return DataNotFoundMsg(res,err);
                    res.send({
                        msg: 'DataFound',
                        stock: stock,
                        date: date,
                        content: parseCSVToJSON(data)
                    });
            });
        }
        else{
            res.send({
                msg: 'AlreadyUpdate'
            });
        }
    });
});

router.get('/News', function(req, res) {
    request({
        url: 'https://tw.stock.yahoo.com/',
        encoding: null
    }, function(err, response, body) {
        if (!err && response.statusCode == 200) {
            var str = iconv.decode(new Buffer(body), "big5");
            var headline = $('<html>').html(str).find("#headlineContainer");
            res.send(headline.html());
        }
    });

});

router.get('/AccuracyHistory',function(req,res){
    var stock = req.query.stock;
    var lastTimeUpdate = req.query.lastTimeUpdate;
    var file_path = 'database/accuracy/acc_' + stock + '.csv';

    fs.stat(file_path, (err,stats)=>{
        if(!stats) return DataNotFoundMsg(res,err);
        var updateTime = new Date(stats.mtime);

        if (!lastTimeUpdate || (Number(lastTimeUpdate) < updateTime.getTime())) {
            fs.readFile(file_path, 'utf-8', (err, data) => {
                if (err) return DataNotFoundMsg(res,err);
                    res.send({
                        msg: 'DataFound',
                        stock: stock,
                        content: parseCSVToJSON(data)
                    });
            });
        }
        else{
            res.send({
                msg: 'AlreadyUpdate'
            });
        }
    });
});

router.get('/Rank', function(req,res){
    var rank_num = req.query.num || 1;
    rank_num = rank_num <=0 ? 1 : rank_num;
    fs.readFile('public/accur/LatestData', 'utf-8', (err,file_path)=>{
        if(err || !file_path)return DataNotFoundMsg(res,err);
        file_path = file_path.split('\n')[0];
        fs.readFile('public/accur/'+file_path, 'utf-8', (err,data)=>{
            if (err||!data) return DataNotFoundMsg(res,err);
            res.send({
                msg: 'DataFound',
                content: parseCSV(data, '\t')[rank_num - 1]
            });

        });
    })

});


function parseCSV(data, delimiter) {
    data = data.split('\n');
    delimiter = delimiter || ',';
    var KeyNames = data[0].split(delimiter);
    var objects = [];
    for (var i = 1; i < data.length; ++i) {
        var elements = data[i].split(delimiter);
        if (elements.length != KeyNames.length) continue;
        var obj = {};
        for (var k in KeyNames) {
            obj[KeyNames[k]] = elements[k];
        }
        objects.push(obj);
    }
    return objects;
}

function parseCSVToJSON(data, delimiter) {
    data = data.split('\n');
    delimiter = delimiter || ',';
    var KeyNames = data[0].split(delimiter);
    var objects = {};
    for (var i = 1; i < data.length; ++i) {
        var elements = data[i].split(delimiter);
        if (elements.length != KeyNames.length) continue;
        objects[elements[0]] = objects[elements[0]] || {};
        for (var k = 1; k < KeyNames.length; ++k) {
            objects[elements[0]][KeyNames[k]] = elements[k];
        }
    }
    return objects;
}

function filter(data, startTime, endTime) {
    startTime = new Date(startTime).getTime();
    endTime = new Date(endTime).getTime();
    return data.filter((element) => {
        var time = new Date(element.time).getTime();
        return time >= startTime && time <= endTime;
    });
}

router.setUpdateTime = function(date) {
    updateTime = date;
}

function DataNotFoundMsg(res,err){
    console.error(err);
    return res.send({
        msg: 'DataNotFound'
    });
}

module.exports = router;

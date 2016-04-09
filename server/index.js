//Server for hesaidshesaid

var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var expressValidator = require("express-validator");
var session = require("express-session");
var cors = require("cors");
var fs = require("fs");
var Analyzer = require("./models/Analyzer.js");
var routes = require("./routes.js");
var corsOptions = {
    origin : "*"
};

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressValidator());

app.use(session({
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 60 * 1000
    },
    secret: "none"
}));
app.use(cors(corsOptions));

Analyzer.getAnalyzer(function(analyzer){
    routes(app,analyzer);
});

module.exports = app;
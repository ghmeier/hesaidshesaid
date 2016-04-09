var request = require("request");
var Analyzer = require("./models/Analyzer.js");

module.exports = function(app,analyzer){

    app.get("/ping",function(req,res){
        res.json({message:"pong"});
    });

    app.post("/ping",function(req,res){
        res.json({message:"pong",text:req.query.text});
    });


    app.post("/guess",function(req,res){
        var text = req.query.text;
        console.log()

        if (!text){
            res.json({success:false,message:"text is a required parameter."});
        }

        analyzer.guess(text,function(guess){
            res.json(guess);
        });
    });

    app.post("/learn",function(req,res){
        var text = req.query.text;
        var author = req.query.author;
        var subject = req.query.subject;

        analyzer.learn(text,author,subject,function(success){
            res.json({success:success});
        });
    });
};
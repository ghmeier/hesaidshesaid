var request = require("request");
var Analyzer = require("./models/Analyzer.js");

module.exports = function(app,analyzer){

    app.get("/ping",function(req,res){
        res.json({message:"pong"});
    });

    app.post("/ping",function(req,res){
        res.json({message:"pong",text:req.body.text});
    });


    app.get("/guess",function(req,res){
        var text = req.body.text;

        if (!text){
            res.json({success:false,message:"text is a required parameter."});
        }

        analyzer.guess(text,function(guess){
            res.json(guess);
        });
    });

    app.get("/learn",function(req,res){
        var text = req.body.text;
        var author = req.body.author;
        var subject = req.body.subject;

        analyzer.learn(text,author,subject,function(success){
            res.json({success:success});
        });
    });
};
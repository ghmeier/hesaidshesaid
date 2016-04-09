var request = require("request");
var Analyzer = require("./models/Analyzer.js");

module.exports = function(app,analyzer){

    app.get("/ping",function(req,res){
        res.json({message:"pong"});
    });

    app.post("/ping",function(req,res){
        res.json({message:"pong",text:req.body.text});
    });


    app.post("/guess",function(req,res){
        var text = req.body.text;

        if (!text){
            res.json({success:false,message:"text is a required parameter."});
            return;
        }

        analyzer.guess(text,function(guess){
            res.json(guess);
        });
    });

    app.post("/learn",function(req,res){
        var text = req.body.text;
        var author = req.body.author;
        var subject = req.body.subject;

        if (!text){
            res.json({message:"text is a required parameter"});
            return;
        }

        if (!author){
            res.json({message:"author is a required parameter"});
            return;
        }

        if (!subject){
            res.json({message:"subject is a required parameter"});
            return;
        }

        analyzer.learn(text,author,subject,function(success){
            res.json({success:success});
        });
    });
};
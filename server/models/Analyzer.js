var fs = require("fs");
var bayes = require("bayes");
var extractor = require('unfluff');
var request = require("request");
var MongoStreamService = require("./MongoStreamService.js");
var path = require("path");
var indico = require("indico.io");
indico.apiKey = "7c494dbd995378039f6e01915e09a94a";

var MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectID;
var mongo_url = process.env["MONGOLAB_URI"] || "mongodb://heroku_7x8bk4nr:a6bmbkcih22skroj9f33hlfl25@ds021010.mlab.com:21010/heroku_7x8bk4nr";

var author_url = "authors";
var subject_url = "subjects";
var sentiment_url = "sentiments";
var GENDER_STRINGS = {"male":true,"female":true,"non-binary":true};

function Analyzer(callback){
    var self = this;
    self.authors = {};
    self.sentiments = {};
    self.subjects = {};
    Analyzer.getClassifier(self,author_url,function(){
        Analyzer.getClassifier(self,subject_url,function(){
            Analyzer.getClassifier(self,sentiment_url,function(){
                self.mongoStream = new MongoStreamService();

                callback(self);
            });
        });
    });
}

Analyzer.getAnalyzer = function(callback){
    new Analyzer(function(analyzer){

        callback(analyzer);
    });
}

Analyzer.getClassifier = function(analyzer,file,callback){
    MongoClient.connect(mongo_url,function(err,db){
        db.collection("classifiers").findOne({name:file},{},function(err,doc){
            var data = doc;
            var classifier = bayes();
            if (data && data.classifier){
                classifier = bayes.fromJson(JSON.stringify(data.classifier));
            }

            analyzer[file] = classifier;
            callback();

            db.close();

        });
    });
}

Analyzer.prototype.writeClassifier = function(file,classifier){
    var item = MongoStreamService.getStreamItem("classifiers",{name:file,classifier:JSON.parse(classifier.toJson())},{name:file});

    this.mongoStream.push(item);
}

Analyzer.getHTMLBody = function(url,callback){
    request(url,function(err,res,body){
        if (err){
            console.log(url+" failed getting text from here");
            callback(false);
            return;
        }

        callback(body);
    }).setMaxListeners(0);;
}

Analyzer.prototype.guess = function(url,callback){
    var self = this;
    Analyzer.getHTMLBody(url,function(raw){
        var text = extractor(raw).text;
        var authorGender = self.authors.categorize(text);
        var subjectGender = self.subjects.categorize(text);
        self.findSentiment(text,function(res){
            var sentiment = Analyzer.convertSentiment(res);
            var sentimentGender = self.sentiments.categorize(sentiment);
            callback({author:authorGender,subject:subjectGender,sentiment:sentiment,sentimentGender:sentimentGender});
        });
    });
}

Analyzer.prototype.learn = function(url,authorGender,subjectGender,callback){
    var self = this;

    Analyzer.getHTMLBody(url,function(raw){
        var text = extractor(raw).text;

        if (!text || text == ""){
            callback("Text from "+url+" was empty");
        }

        self.findSentiment(text,function(sentiment){
            var auth_res = self.learnAuthor(text,authorGender)
            var sub_res = self.learnSubject(text,authorGender+"_"+subjectGender)
            var sent_res = self.learnSentiment(sentiment,authorGender+"_"+subjectGender)

            var item = MongoStreamService.getStreamItem("article",{url:url,authorGender:authorGender,subjectGender:subjectGender,sentiment:sentiment});
            self.mongoStream.push(item);
            callback(auth_res && sub_res && sent_res);

        });

    });
}

Analyzer.prototype.learnFromValues = function(url,authorGender,subjectGender,sentiment,callback){
    var self = this;

    Analyzer.getHTMLBody(url,function(raw){
        var text = extractor(raw).text;

        if (!text || text == ""){
            callback("Text from "+url+" was empty");
            return;
        }

        var auth_res = self.learnAuthor(text,authorGender)
        var sub_res = self.learnSubject(text,authorGender+"_"+subjectGender)
        var sent_res = self.learnSentiment(sentiment,authorGender+"_"+subjectGender)

        callback(auth_res && sub_res && sent_res);

    });
}

Analyzer.prototype.fixLearning = function(callback){
    var self = this;
    MongoClient.connect(mongo_url,function(err,db){

        db.collection("article").find({}).toArray(function(err,docs){

            self.learnAll(docs);
            db.close();
        });
    });
}

Analyzer.prototype.learnAll = function(list,callback){
    if (list.length <= 0){
        return;
    }

    var cur = list.shift();
    var self = this;

    if (!cur || !cur.url || !cur.authorGender || !cur.subjectGender){
        self.learnAll(list);
        return;
    }
    console.log("Docs remaining: "+list.length);
    this.learnFromValues(cur.url,cur.authorGender,cur.subjectGender,cur.sentiment,function(){
        self.learnAll(list);
    });
}



Analyzer.prototype.learnAuthor = function(text,authorGender){
    if (Analyzer.validateGenderString(authorGender)){
        this.authors.learn(text,authorGender);
        this.writeClassifier(author_url,this.authors);
        return true;
    }

    return false;
}

Analyzer.prototype.findSentiment = function(text,callback){
    indico.sentiment(text).then(function(res){
        callback(res);
    });
}

Analyzer.prototype.learnSentiment = function(sentiment,gender){
    if (typeof sentiment !== 'number' || sentiment > 1 || sentiment < 0){
        console.log("Sentiment must be a number, was "+sentiment);
        return false;
    }

    if (Analyzer.validateGenderString(gender.split("_")[0])){
        this.sentiments.learn(Analyzer.convertSentiment(sentiment),gender);
        this.writeClassifier(sentiment_url,this.sentiments);
        return true;
    }

    return false;
}

Analyzer.prototype.learnSubject = function(text,subjectGender){
    if (Analyzer.validateGenderString(subjectGender.split("_")[0])){
        this.subjects.learn(text,subjectGender);
        this.writeClassifier(subject_url,this.subjects);
        return true;
    }

    return false;
}

Analyzer.validateGenderString = function(gender){
    return GENDER_STRINGS[gender.toLowerCase()];
}

Analyzer.convertSentiment = function(sentiment){
    return Math.floor(sentiment*10).toString();
}

module.exports = Analyzer;
var fs = require("fs");
var bayes = require("bayes");
var extractor = require('unfluff');
var request = require("request");
var MongoStreamService = require("./MongoStreamService.js");
var path = require("path");
var indico = require("indico.io");
indico.apiKey = "7c494dbd995378039f6e01915e09a94a";
var author_url = "./authors.json";
var subject_url = "./subjects.json";
var sentiment_url = "./sentiments.json";
var GENDER_STRINGS = {"male":true,"female":true,"non-binary":true};

function Analyzer(){
    this.authors = Analyzer.getClassifier(author_url);
    this.subjects = Analyzer.getClassifier(subject_url);
    this.sentiments = Analyzer.getClassifier(sentiment_url);
    this.mongoStream = new MongoStreamService();
}

Analyzer.getAnalyzer = function(){
    return new Analyzer();
}

Analyzer.getClassifier = function(file){
    if (!fs.existsSync(file)){
        fs.writeFileSync(file,"");
    }

    var data = fs.readFileSync(file,"utf8");
    var authors = {};

    if (data){
        authors = bayes.fromJson(data);
    }else{
        authors = bayes();
    }

    return  authors;
}

Analyzer.writeClassifier = function(file,classifier){
    fs.writeFileSync(file,classifier.toJson());
}

Analyzer.getHTMLBody = function(url,callback){
    request(url,function(err,res,body){
        if (err){
            console.log(url+" failed getting text from here");
            callback(false);
        }

        callback(body);
    });
}

Analyzer.prototype.guess = function(url,callback){
    var self = this;
    Analyzer.getHTMLBody(url,function(raw){
        var text = extractor(raw).text;
        var authorGender = self.authors.categorize(text);
        var subjectGender = self.subjects.categorize(text);
        self.findSentiment(text,function(res){
            var sentiment = self.sentiments.categorize(text);
            callback({author:authorGender,subject:subjectGender,sentiment:sentiment});
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

Analyzer.prototype.learnAuthor = function(text,authorGender){
    if (Analyzer.validateGenderString(authorGender)){
        this.authors.learn(text,authorGender);
        Analyzer.writeClassifier(author_url,this.authors);
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
        var senti_text = "negative";
        if (sentiment >= .5){
            senti_text = 'positive';
        }

        this.sentiments.learn(senti_text,gender);
        Analyzer.writeClassifier(sentiment_url,this.sentiments);
        return true;
    }

    return false;
}

Analyzer.prototype.learnSubject = function(text,subjectGender){
    if (Analyzer.validateGenderString(subjectGender.split("_")[0])){
        this.subjects.learn(text,subjectGender);
        Analyzer.writeClassifier(subject_url,this.subjects);
        return true;
    }

    return false;
}

Analyzer.validateGenderString = function(gender){
    return GENDER_STRINGS[gender.toLowerCase()];
}

module.exports = Analyzer;
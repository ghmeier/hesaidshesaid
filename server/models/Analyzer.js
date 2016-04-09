var fs = require("fs");
var bayes = require("bayes");
var extractor = require('unfluff');
var request = require("request");
var MongoStreamService = require("./MongoStreamService.js");
var path = require("path");
var author_url = "./authors.json";
var subject_url = "./subjects.json";
var GENDER_STRINGS = {"male":true,"female":true,"non-binary":true};

function Analyzer(){
    this.authors = Analyzer.getClassifier(author_url);
    this.subjects = Analyzer.getClassifier(subject_url);
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
    request("https://en.wikipedia.org/wiki/Computer_science",function(err,res,body){
        if (err){
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

        callback({author:authorGender,subject:subjectGender});
    });
}

Analyzer.prototype.learn = function(url,authorGender,subjectGender,callback){
    var self = this;

    Analyzer.getHTMLBody(url,function(raw){
        var text = extractor(raw).text;

        if (self.learnAuthor(text,authorGender)){
            if (self.learnSubject(text,subjectGender)){
                var item = MongoStreamService.getStreamItem("article",{url:url,authorGender:authorGender,subjectGender:subjectGender});
                self.mongoStream.push(item);
                callback(true);
                return;
            }
            console.log("ERROR: Failed to learn subject "+subjectGender);
        }

        console.log("ERROR: Failed to learn author "+authorGender);
        callback(false);
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

Analyzer.prototype.learnSubject = function(text,subjectGender){
    if (Analyzer.validateGenderString(subjectGender)){
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
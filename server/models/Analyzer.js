var fs = require("fs");
var bayes = require("bayes");
var extractor = require('unfluff');
var request = require("request");
var author_url = "./authors.json";
var subject_url = "./subjects.json";
var GENDER_STRINGS = ["male","female","non-binary"];

function Analyzer(){
    this.authors = Analyzer.getClassifier(author_url);
    this.subjects = Analyzer.getClassifier(subject_url);
}

Analyzer.getAnalyzer = function(){
    return new Analyzer();
}

Analyzer.getClassifier = function(file){
    var data = fs.readFileSync(file,"utf8");
    var authors = {};
    console.log("Getting from "+file);
    if (data){
        authors = bayes.fromJson(data);
    }else{
        authors = bayes();
    }

    return  authors;
}

Analyzer.writeClassifier = function(file,classifier){
    fs.writeFileSynce(file,classifier.toJosn());
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

    Analyzer.getHTMLBody(url,function(raw){
        var text = extractor(raw).text;
        console.log(text);
        var authorGender = this.authors.categorize(text);
        var subjectGender = this.subjects.categorize(text);
        callback({author:authorGender,subject:subjectGender});
    });
}

Analyzer.prototype.learn = function(raw,authorGender,subjectGender,callback){
    var text = extractor(raw).text;

    if (this.learnAuthor(text,authorGender)){
        if (this.learnSubject(text,subjectGender)){
            callback(true);
            return;
        }
        console.log("ERROR: Failed to learn subject "+subjectGender);
    }

    console.log("ERROR: Failed to learn author "+authorGender);
    callback(false);
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
    return GENDER_STRINGS.includes(gender.toLowerCase());
}

module.exports = Analyzer;
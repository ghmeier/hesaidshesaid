var MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectID;
var request = require("request");

var mongo_url = process.env["MONGOLAB_URI"] || "mongodb://heroku_7x8bk4nr:a6bmbkcih22skroj9f33hlfl25@ds021010.mlab.com:21010/heroku_7x8bk4nr";

function MongoStreamService(){
    this.stream = new Array();
    this.updating = false;
}

MongoStreamService.getStreamItem = function(type,update,identifier){
    if (!type){
        return null;
    }

    return {type:type,update:update,id:identifier};
}

MongoStreamService.prototype.commit = function(){
    //commit stuff in the stream
    if (this.stream.length < 1 || this.updating){
        return;
    }

    this.updating = true;
    var self = this;

    MongoClient.connect(mongo_url,function(err,db){
        if (err){
            console.log(err);
            return ;
        }

        self.commitDB(db);
    });
}

MongoStreamService.prototype.commitDB = function(db){
    var popped = this.stream.shift();
    var self = this;
    var collection_name = popped.type;
    var query = {name:-1};
    if (popped.update.url){
        query = {"url":popped.update.url};
    }

    if (popped.update.id){
        query = popped.update.id;
    }

    db.collection(collection_name).update(query,popped.update,{upsert:true},function(err,results){
        if (self.stream && self.stream.length > 0){
            self.commitDB(db);
        }else{
            self.updating = false;
            db.close();
        }
    });
}

MongoStreamService.prototype.push = function(item){
    this.merge(item);
    this.commit()
}

MongoStreamService.prototype.merge = function(item){
    var mp = this.getMergePosition(item.type);

    if (mp < 0 || (item.update._id && item.update._id == this.stream[mp].update._id)){
        this.stream.push(item);
        return;
    }

    var update_keys = Object.keys(item.update);

    for (i=0;i<update_keys.length;i++){
        var key = update_keys[i];
        var update_item = item.update[key];

        if (this.stream[mp].update[key]){
            update_item = this.getUpdateItem(mp,key,item.update[key]);
        }

        this.stream[mp].update[key] = update_item;
    }

}

MongoStreamService.prototype.getUpdateItem = function (merge_position,key,update_item){
    var new_item = {};
    var cur_keys = Object.keys(this.stream[merge_position].update[key]);

    // copy existing item
    for (i=0;i<cur_keys.length;i++){
        new_item[cur_keys[i]] = this.stream[merge_position].update[key][cur_keys[i]];
    }

    //add new values
    var new_keys = Object.keys(update_item);
    for (i=0;i<new_keys.length;i++){
        if (new_item[new_keys[i]] && typeof new_item[new_keys[i]] === "number"){
            new_item[new_keys[i]] += update_item[new_keys[i]];
        }else{
            new_item[new_keys[i]] = update_item[new_keys[i]];
        }
    }

}

MongoStreamService.prototype.getMergePosition = function(type){
    var merge_position = -1;
    var i = 0 ;
    while (i< this.size() && this.stream[i].type !== type){
        i++;
    }

    if (i < this.size()){
        merge_position = i;
    }

    return merge_position;
}

MongoStreamService.prototype.dump = function(){
    console.log(this.stream);
}

MongoStreamService.prototype.size = function(){
    return this.stream.length;
}

module.exports = MongoStreamService;
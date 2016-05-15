var MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectID;
var request = require("request");

var mongoUrl = process.env["MONGOLAB_URI"] || "mongodb://heroku_7x8bk4nr:a6bmbkcih22skroj9f33hlfl25@ds021010.mlab.com:21010/heroku_7x8bk4nr";

function MongoStreamService(){
    this.stream = new Array();
    this.updating = false;
}

MongoStreamService.getStreamItem = function(type,update,identifier){
    if (!type){
        return null;
    }

    return {type:type,update:update,id:identifier};
};

MongoStreamService.prototype.commit = function(){
    //commit stuff in the stream
    if (this.stream.length < 1 || this.updating){
        return;
    }

    this.updating = true;
    var self = this;

    MongoClient.connect(mongoUrl,function(err,db){
        if (err){
            //console.log(err);
            return ;
        }

        self.commitDB(db);
    });
};

MongoStreamService.prototype.commitDB = function(db){
    var popped = this.stream.shift();
    var self = this;
    var name = popped.type;
    var query = {name:-1};

    if (popped.id){
        query = popped.id;
    }

    db.collection(name).update(query,popped.update,{upsert:true},function(err,results){
        if (self.stream && self.stream.length > 0){
            self.commitDB(db);
        }else{
            self.updating = false;
            db.close();
        }
    });
};

MongoStreamService.prototype.push = function(item){
    this.merge(item);
    this.commit();
}

MongoStreamService.prototype.merge = function(item){
    var mp = this.getMergePosition(item.type);

    this.stream.push(item);
    return;
/*    }

    var update_keys = Object.keys(item.update);

    for (i=0;i<update_keys.length;i++){
        var key = update_keys[i];
        var updateItem = item.update[key];

        if (this.stream[mp].update[key]){
            updateItem = this.getUpdateItem(mp,key,item.update[key]);
        }

        this.stream[mp].update[key] = updateItem;
    }*/

}

MongoStreamService.prototype.getUpdateItem = function (mergePosition,key,updateItem){
    var newItem = {};
    var curKeys = Object.keys(this.stream[mergePosition].update[key]);

    // copy existing item
    for (var i=0;i<curKeys.length;i++){
        newItem[curKeys[i]] = this.stream[mergePosition].update[key][curKeys[i]];
    }

    //add new values
    var newKeys = Object.keys(updateItem);
    for (var i=0;i<newKeys.length;i++){
        if (newItem[newKeys[i]] && typeof newItem[newKeys[i]] === "number"){
            newItem[newKeys[i]] += updateItem[newKeys[i]];
        }else{
            newItem[newKeys[i]] = updateItem[newKeys[i]];
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
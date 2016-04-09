var app = require("./index.js");

app.set("port", process.env.PORT || 3000);

var server = app.listen(app.get("port"),function(){
    console.log("Hesaidshesaid analysis listening on port " + server.address().port);
});
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require('express-handlebars');
var request = require("request");
var cheerio = require("cheerio");

// var db = require("./models");
// var Comment = require("./models/comment.js");
// var Article = require("./models/article.js");



mongoose.Promise = Promise;


var app = express();
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(express.static("public"));

mongoose.connect("mongodb://localhost/mongonews");
var db = mongoose.connection;


db.on("error", function(error) {
    console.log("Mongoose Error: ", error);
});


db.once("open", function() {
    console.log("Mongoose connection successful.");
});


var routes = require("./controllers/routes.js");


app.use('/', routes); 


// Listen on port 3000
app.listen(3000, function() {
    console.log("App running on port 3000!");
});

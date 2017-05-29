var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require('express-handlebars');
var request = require("request");
var cheerio = require("cheerio");
var _ = require("lodash");

var Comment = require("./models/comment.js");
var Article = require("./models/article.js");



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



app.get('/', function(request, response) {
    Article.find({}, function(error, doc) {

        //Using lodash to reverse the entries so newest appear on page first
        var newdoc = _.reverse(doc);
        // Log any errors
        if (error) {
            console.log(error);
        }
        // Or send the doc to the browser as a json object
        else {
            response.render('index', { article: newdoc });
        }
    });
});

app.post("/comment", function(req, res) {
    Article
        .find({ "_id": req.body.id })
        // ..and on top of that, populate the comments (replace the objectIds in the notes array with bona-fide notes)
        .populate("comments")
        // Now, execute the query
        .exec(function(error, doc) {
            // Send any errors to the browser
            if (error) {
                res.send(error);
            }
            // Or send the doc to the browser
            else {
                console.log(doc);
                res.render("article", { article: doc });
            }
        });


})


// New Comment creation via POST route
app.post("/submit", function(req, res) {
    // Use our Comment model to make a new Comment from the req.body
    var newComment = new Comment(req.body);
    // Save the new Comment to mongoose
    newComment.save(function(error, doc) {
        // Send any errors to the browser
        if (error) {
            res.send(error);
        }
        // Otherwise
        else {
            // Find our user and push the new Comment id into the User's Comments array
            Article
                .findOneAndUpdate({ "_id": req.body.id }, { $push: { "comments": doc._id } }, { new: true }, function(err, newdoc) {
                    // Send any errors to the browser
                    if (err) {
                        res.send(err);
                    }
                    // Or send the newdoc to the browser
                    else {
                        res.redirect("/");
                    }
                })

        }
    });
});
////////////////////////////////////////////////////////////////////
//getting comment to which button associated
app.post('/mycomments', function(req, res) {
        Comment.findOne({ "_id": req.body.id }, function(error, doc) {
            // Log any errors
            if (error) {
                console.log(error);
            }
            // Or send the doc to the browser as a json object
            else {

                res.render("submitcomment", { comment: doc })
                    // response.json(doc);

            }
        });


    })
    //////////////////////////////////////////////////////////////////////////


app.post('/delete', function(req, res) {

    Comment.remove({ "_id": req.body.id }, function(error, doc) {
        // Log any errors
        if (error) {
            console.log(error);
        }
        // Or send the doc to the browser as a json object
        else {
            res.redirect('/');
        }
    });

});





app.post("/", function(req, res) {

    console.log(req.body);
    Article.findOne({ "_id": req.body.id }, function(error, doc) {
        // Log any errors
        if (error) {
            console.log(error);
        }
        // Or send the doc to the browser as a json object
        else {
            res.render('article', { article: doc });
        }
    });
})


// was /scrape
app.get("/", function(req, res) {
    // First, we grab the body of the html with request
    request("http://www.nytimes.com", function(error, response, html) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(html);
        // Now, we grab every h2 within an article tag, and do the following:
        $("article h2").each(function(i, element) {
            // Save an empty result object
            var result = {};
            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this).children("a").text();
            result.link = $(this).children("a").attr("href");
            // Using our Article model, create a new entry
            // This effectively passes the result object to the entry (and the title and link)
            Article.findOne({ title: result.title }, function(error, doc) {
                    console.log(result.title);
                    if (error) {
                        console.log(error)
                    } else if (doc === "null" || !doc) {
                        var entry = new Article(result);
                        // Now, save that entry to the db
                        entry.save(function(err, doc) {
                            // Log any errors
                            if (err) {
                                console.log(err);
                            }
                            // Or log the doc
                            else {
                                console.log(doc);
                            }
                        });
                    } else {

                    }
                })
        });
    });
    // Tell the browser that we finished scraping the text
    res.redirect('/home');

});

app.get("/scrape", function(req, res) {
    // First, we grab the body of the html with request
    request("http://www.nytimes.com", function(error, response, html) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(html);
        // Now, we grab every h2 within an article tag, and do the following:
        $("article h2").each(function(i, element) {

            // Save an empty result object
            var result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this).children("a").text();
            result.link = $(this).children("a").attr("href");

            // Using our Article model, create a new entry
            // This effectively passes the result object to the entry (and the title and link)

            Article.findOne({ title: result.title }, function(error, doc) {

                // console.log(result.title);
                if (error) {
                    console.log(error)
                } else if (doc === "null" || !doc) {

                    var entry = new Article(result);

                    // Now, save that entry to the db
                    entry.save(function(err, doc) {
                        // Log any errors
                        if (err) {
                            console.log(err);
                        }
                        // Or log the doc
                        else {
                            console.log(doc);

                        }
                    });
                }
            })

            // console.log('did it');
        });
    });
    // Tell the browser that we finished scraping the text
    res.redirect("/home");

});

app.get('/home', function(req, res){
    Article.find({}, function(error, doc){
        var newdoc = _.reverse(doc);

        res.render('index', {article: newdoc})    
    })
    
})

app.get("/submit", function(req, res) {
    console.log(req.body);
    console.log(req.params);
    Article.find({ "_id": req.body.id }, function(error, doc) {
        res.render("article", { article: doc })
    })
})


app.post("/key", function(req, res) {
    console.log(request.body);
    Article.find({ $text: { $search: req.body.keyword } }, function(error, doc) {
        console.log(doc);
        if (doc.length > 0) {
            res.render("index", { article: doc })
        } else if (doc.length === 0) {
            res.render("mycomments", { article: { title: "No Matches Found" } })
            console.log('no matches')
        }
    })


});

// app.get("/articles", function(request, response) {

//     Article.find({}, function(error, doc) {
//         // Log any errors
//         if (error) {
//             console.log(error);
//         }
//         // Or send the doc to the browser as a json object
//         else {
//             response.json(doc);
//         }
//     });
// })

// app.get("/mongonews", function(request, response) {
//     response.render('index');
// });



// // Route to see what user looks like WITH populating
// app.get("/specificarticle", function(req, res) {
//     // Prepare a query to find all users..
//     Article
//         .find({ title: "Trump Returns Home to Face Growing Crisis Over Kushner" })
//         // ..and on top of that, populate the comments (replace the objectIds in the notes array with bona-fide notes)
//         .populate("comments")
//         // Now, execute the query
//         .exec(function(error, doc) {
//             // Send any errors to the browser
//             if (error) {
//                 res.send(error);
//             }
//             // Or send the doc to the browser
//             else {
//                 res.send(doc);
//             }
//         });
// });








// Listen on port 3000
app.listen(3000, function() {
    console.log("App running on port 3000!");
});

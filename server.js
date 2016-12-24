
// Dependencies
var path = require('path');
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
// Requiring our Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");
// Override HTTP method
var methodOverride = require('method-override');
// Mongoose mpromise deprecated - use bluebird promises
var Promise = require("bluebird");

mongoose.Promise = Promise;


// Initialize Express
var app = express();

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));

app.use(methodOverride('_method'));

var MONGODB;
// If it's in production (i.e. on heroku)
// use environment variable MONGODB_URI
// else use localhost to connecto to mongo DB
if (process.env.NODE_ENV == "production") {
  MONGODB = process.env.MONGODB_URI;
} else {
  MONGODB = "mongodb://localhost/newsbuff";
}
// Database configuration with mongoose
mongoose.connect(MONGODB);
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});


// Routes
// ======

// Simple index route
app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, 'public/assets/html/index.html'));
});

// A GET request to scrape the CNET website
app.get("/scrape", function(req, res) {

  // Making a request call for CNET100, the top 100 products CNET reviewed. But pick only top 10.
  request("https://www.cnet.com/cnet100", function(error, response, html) {
    debugger;
   // Load the HTML into cheerio and save it to a variable
   // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
   var $ = cheerio.load(html);

   // An empty array to save the data that we'll scrape
   var results = [];
   var count = 0;

    // With cheerio, 
    // (i: iterator. element: the current element)
    $(".item").each(function(i, element) {
      // initialize result
      var result = {};
      // Save the text of the element (this) in a "title" variable
      result.title = $(this).find("div.title > h2").html();

      // Somehow sometime return entries are corrupted and title is null
      // and other attribute are undefined
      // Skip those entries and continue next iteration
      if (!result.title) return true;


      // In the currently selected element, look at its child elements (i.e., its a-tags),
      // then save the values for any "href" attributes that the child elements may have
      result.link = $(this).children().attr("href");

      result.summary = $(this).find("div.dek").html();

      result.rank = parseInt($(this).find("div.rankInner").html());

      // Using our Article model, create a new entry
      // This effectively passes the result object to the entry
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

      // Only top 10 entries are selected, break out the loop
      // if it reaches 10 entries
      count++;
      if (count == 10) return false;
    });

    // Log the result once cheerio analyzes each of its selected elements
    //console.log(results);
  });

  
  // Tell the browser that we finished scraping the text
  res.send("Scrape Complete");
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  // Sort it on rank,
  // the return order is non-deterministic
  // without proper sorting
  Article
  .find({})
  .sort({rank: 1})
  // ..and populate all of the notes associated with it
  .populate("note")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});

// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
  
    findArticleById(req.params.id, res);
});


// Create a new note or replace an existing note
// This ensure Article and Note has one to one relationship
app.post("/articles/:id", function(req, res) {
  Article.findOne({ "_id": req.params.id })
  .exec(function(error, article) {
    if (error) {
      console.log(error);
    } else {
      if (article.note) {
        // Replace the existing note which _id is saved in article.note
        updateNoteById(article, req.body, res);
      } else {
        // Create a new note and update Article.note with
        // new note's _id
        createNodeUpdateArticleNote(req.params.id, req, res);   
      }
    }
  })  
});

// Override POST with DELETE
app.delete("/note", function(req, res) {
  var article_id = req.body.article_id;
  var note_id = req.body.note_id;

  // Remove the note from Note collection first
  Note.remove({ "_id": note_id })
  .exec(function(error, note) {
    if (error) {
      console.log(error);
    } else {
      // After the note is removed, now pass null to remove article.note from the article
      updateArticleNoteById(article_id, null, res);
    }
  })  
});

// Function

// Using the id passed in the id parameter,
// prepare a query that finds the matching one in our db...
// and send the article back to client (browser)
function findArticleById(id, res) {
  // finds the matching one in our db
  Article.findOne({ "_id": id })
  // ..and populate all of the notes associated with it
  .populate("note")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
}

// Update note id in an article with article_id
// then send the article back to the browser
function updateArticleNoteById(article_id, note_id, res) {
    // Use the article id to find and update it's note
    Article.findOneAndUpdate({ "_id": article_id }, { "note": note_id })
    // Execute the above query
    .exec(function(err, doc) {
      // Log any errors
      if (err) {
        console.log(err);
      }  else {
        findArticleById(article_id, res);
      }
    });
}

// Create a new note, update the note id in the article with
// article_id, then send the article back to the browser  
function createNodeUpdateArticleNote(article_id, req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);

  // And save the new note the db
  newNote.save(function(error, savedNote) {
    // Log any errors
    if (error) {
      console.log(error);
    } else {
      // Otherwise
      updateArticleNoteById(article_id, savedNote._id, res);
    }
  });
}
// Update and existing note that its _id is saved in the article.note
// then send the article back to the browser
function updateNoteById(article, note, res) { 
  // Update the note with new contents
  Note.findOneAndUpdate({ "_id": article.note },
    { "title": note.title, "body": note.body})
    // Execute the above query
    .exec(function(err, doc) {
      // Log any errors
      if (err) {
        console.log(err);
      }  else {
        findArticleById(article._id, res);
      }
    });
}
// Listen to port
var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("App running on port " + port + " !");
});

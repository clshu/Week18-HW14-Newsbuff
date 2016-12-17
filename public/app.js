// Global variale
var CNET_URL = "https://www.cnet.com";
var articles = [];
var index = 0;

// Functions
function createArticleDisplayNoteHTML(item) {

      $("#article").empty();
      $("#displayNote").empty();
      $("#saveNote").empty();

      var article = $("#article");
      var titleLine = $("<h2>").addClass("articleTitle");
      titleLine.html(item.rank + ". " + item.title);
      var linkLine = $("<a>").attr("href", CNET_URL + item.link).html("Link");
      var summaryLine = $("<div>").html(item.summary + " ");
      article.append(titleLine);
      summaryLine.append(linkLine);
      article.append(summaryLine);
      article.attr("data-id", item._id);
      // save data-id in saveBtn so it can be retrieved later
      $("#saveBtn").attr("data-id", item._id)
      // If there's a note in the article
      if (item.note) {
        console.log(item.note);
        var noteHTML = $("<p>").html(item.note.body);
        $("#displayNote").append(noteHTML);
        // set data-id of deleteBtn with node's _id
        $("#deleteBtn").attr("data-id", item.note._id);
      } else {
        $("#deleteBtn").removeAttr("data-id");
      }
}

// Executions
$(document).ready(readyFn);

function readyFn() {

  // Grab the articles as a json

  $.getJSON("/articles", function(data) {
    
    articles = [];
    // Save data in array articles
    data.forEach(function(item) {
      //console.log(item);
      articles.push(item);
    });

    createArticleDisplayNoteHTML(articles[index]);
    index++;
    
  });

  // Register event listners

  // Click on article 
  $(document).on("click", "#article", function() {
    // Empty the notes from the saveNote section
    
    // get next article's id from array articles
    var thisId = articles[index]._id;
    index++;
    // Keep index between 0 and 9
    index = index % 10;

    // Now make an ajax call for the Article
    $.ajax({
      method: "GET",
      url: "/articles/" + thisId
    })
    // With that done, refresh article and add the note information to the page
    .done(function(data) {
      //console.log(data);
      
    
      createArticleDisplayNoteHTML(data);
      
    });
       
    
  });

  // When you click the save button
  $(document).on("click", "#saveBtn", function() {
    var note = $("#saveNote").val().trim();
    //console.log(note);
    // Don't save empty note
    if (!note) return;
    

    // Grab the id associated with the article from the save button
  
    var thisId = $(this).attr("data-id");

    // Run a POST request to change the note, using what's entered in the inputs
    $.ajax({
      method: "POST",
      url: "/articles/" + thisId,
      data: {
        // Value taken from article
        title: $(".articleTitle").html(),
        // Value taken from note textarea
        body: $("#saveNote").val()
      }
    })
    // With that done
    .done(function(data) {
      // Log the response
      //console.log(data);
      createArticleDisplayNoteHTML(data);
    });

    // Also, remove the values entered in the input and textarea for note entry
  
  });


};


/*
$(document).on("click", "p", function() {
  // Empty the notes from the note section
  $("#notes").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // With that done, add the note information to the page
    .done(function(data) {
      console.log(data);
      // The title of the article
      $("#notes").append("<h2>" + data.title + "</h2>");
      // An input to enter a new title
      $("#notes").append("<input id='titleinput' name='title' >");
      // A textarea to add a new note body
      $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");

      // If there's a note in the article
      if (data.note) {
        // Place the title of the note in the title input
        $("#titleinput").val(data.note.title);
        // Place the body of the note in the body textarea
        $("#bodyinput").val(data.note.body);
      }
    });
});
*/
/*
// When you click the savenote button
$(document).on("click", "#saveBtn", function() {
   var note = $("#saveNote").val().trim();
    console.log(note);
    // Don't save empty note
    if (!note) return;
  // Grab the id associated with the article from the submit button
  
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      // Value taken from title input
      title: $("#titleinput").val(),
      // Value taken from note textarea
      body: $("#bodyinput").val()
    }
  })
    // With that done
    .done(function(data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $("#notes").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
  
});
*/

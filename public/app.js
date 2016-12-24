// Global variale
var CNET_URL = "https://www.cnet.com";
var articles = [];
var index = 0;

// Functions
function createArticleDisplayNoteHTML(item) {

      $("#article").empty();
      $("#displayNote").empty();
      $("#saveNote").val("");

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
  console.log("index: " + index);
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
    
    $("#saveNote").val("");
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
        body: note
      }
    })
    // With that done
    .done(function(data) {
      // Log the response
      //console.log(data);
      createArticleDisplayNoteHTML(data);
    });
  
  });


};

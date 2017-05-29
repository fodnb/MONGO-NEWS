// Require mongoose
var mongoose = require("mongoose");
// Create a schema class
var Schema = mongoose.Schema;

// Create the Comment schema
var CommentSchema = new Schema({
  comment: {
    type: String
  },
  Articles:  [{
    type: String,
    ref: "Article"
  }]
});

// Remember, Mongoose will automatically save the ObjectIds of the Comments
// These ids are referred to in the Article model

// Create the Comment model with the NoteSchema
var Comment = mongoose.model("Comment", CommentSchema);

// Export the Comment model
module.exports = Comment;

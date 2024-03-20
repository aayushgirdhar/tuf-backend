const mongoose = require("mongoose");

const snippetSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
    },
    language_id: {
      type: Number,
      required: [true, "Language ID is required"],
    },
    language: {
      type: String,
      required: [true, "Language is required"],
    },
    stdin: {
      type: String,
      default: "",
    },
    code: {
      type: String,
      required: [true, "Code is required"],
    },
    stdout: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Snippet", snippetSchema);

const Snippet = require("../models/snippet");
const client = require("../redis/client");

const updateCache = async (newSnippet) => {
  const cachedData = await client.get("snippets");
  if (cachedData) {
    console.log("cache updated");
    const cachedSnippets = JSON.parse(cachedData);
    cachedSnippets.unshift(newSnippet);
    await client.set("snippets", JSON.stringify(cachedSnippets));
  }
};

const createSnippet = async (req, res) => {
  try {
    const { username, language_id, language, stdin, code, output } = req.body;

    const newSnippet = new Snippet({
      username,
      language_id,
      language,
      stdin,
      code,
      stdout: output,
    });

    await newSnippet.save();
    await updateCache(newSnippet);

    res.status(201).send(newSnippet);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

const getSnippets = async (req, res) => {
  try {
    const cachedData = await client.get("snippets");
    if (cachedData) {
      console.log("Cache hit");
      return res.status(200).json(JSON.parse(cachedData));
    }

    const snippets = await Snippet.find().sort({ createdAt: -1 });
    if (snippets.length === 0) {
      res.status(404).json({ message: "No snippets found" });
    }
    await client.set("snippets", JSON.stringify(snippets));
    res.status(200).json(snippets);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { createSnippet, getSnippets };

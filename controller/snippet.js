const Snippet = require("../models/snippet");
const client = require("../redis/client");
const axios = require("axios");
const base64 = require("base-64");

const updateCache = async (newSnippet) => {
  const cachedData = await client.get("snippets");
  if (cachedData) {
    console.log("cache updated");
    const cachedSnippets = JSON.parse(cachedData);
    cachedSnippets.unshift(newSnippet);
    await client.set("snippets", JSON.stringify(cachedSnippets));
  }
};

const codeRunner = async (base64Code, base64Stdin, language) => {
  const postOptions = {
    method: "POST",
    url: process.env.JUDGE0_API_URL + "submissions",
    params: {
      base64_encoded: "true",
      fields: "*",
    },
    headers: {
      "content-type": "application/json",
      "X-RapidAPI-Key": process.env.RAPID_API_KEY,
      "X-RapidAPI-Host": process.env.RAPID_API_HOST,
    },
    data: {
      language_id: language,
      source_code: base64Code,
      stdin: base64Stdin,
    },
  };

  const response = await axios.request(postOptions);

  const submissionId = response.data.token;

  const getOptions = {
    method: "GET",
    url: process.env.JUDGE0_API_URL + "submissions/" + `${submissionId}`,
    params: {
      base64_encoded: "true",
      fields: "*",
    },
    headers: {
      "X-RapidAPI-Key": process.env.RAPID_API_KEY,
      "X-RapidAPI-Host": process.env.RAPID_API_HOST,
    },
  };

  const res = await axios.request(getOptions);
  return base64.decode(res.data.stdout);
};

const createSnippet = async (req, res) => {
  try {
    const { username, language_id, language, stdin, code } = req.body;
    console.log(req.body);

    const newSnippet = new Snippet({
      username,
      language_id,
      language,
      stdin,
      code,
    });

    const base64Code = base64.encode(code);
    const base64Stdin = base64.encode(stdin);

    const stdout = await codeRunner(base64Code, base64Stdin, language_id);

    newSnippet.stdout = stdout;

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

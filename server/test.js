import { GoogleAIClient, GenerateContentConfig } from "@google/generative-ai";
import { config } from "dotenv";
import dotenv from "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const model = genAI.getGenerativeModel({
  model: "models/gemini-2.0-flash-exp",
});

const contents = [{ text: "Describe the process of photosynthesis." }];
const gem_config = new GenerateContentConfig({
  response_modalities: ["Text"], // Options: 'Text', 'Image', or both
});

const result = await model.generateContent({
  model: "models/gemini-2.0-flash-exp",
  contents: contents,
  config: gem_config,
});

console.log(result.response.text());

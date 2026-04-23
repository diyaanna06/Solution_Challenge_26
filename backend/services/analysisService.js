import { GoogleGenerativeAI } from '@google/generative-ai';
import { analysisSchema } from '../schemas/requestSchemas.js';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const analyzeRequest = async (description) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
    }
  });

  const analysisPrompt = `Analyze this community need and output strictly JSON. Description: "${description}"`;
  const result = await model.generateContent(analysisPrompt);
  return JSON.parse(result.response.text());
};
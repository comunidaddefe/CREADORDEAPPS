import express from 'express';
import { GoogleGenAI } from '@google/genai';


const app = express();
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.post('/api/generate-dashboard', async (req, res) => {
  const { prompt } = req.body;
  
  const systemInstruction = `You are a dashboard builder. Return a JSON structure representing a dashboard layout based on the user prompt.
  The JSON structure should be an array of objects, where each object has:
  {
    "id": "string",
    "type": "chart" | "list" | "stat",
    "props": {
      "title": "string",
      "data_source": "string"
    }
  }`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
    },
  });

  try {
    const dashboardLayout = JSON.parse(response.text || '[]');
    res.json(dashboardLayout);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate dashboard' });
  }
});

import { createServer } from 'vite';

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'spa',
});

if (process.env.NODE_ENV !== 'production') {
  app.use(vite.middlewares);
}


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

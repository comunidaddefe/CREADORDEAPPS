[1mdiff --git a/server.ts b/server.ts[m
[1mindex 1cda93e..847d535 100644[m
[1m--- a/server.ts[m
[1m+++ b/server.ts[m
[36m@@ -1,19 +1,40 @@[m
[32m+[m[32mimport 'dotenv/config';[m
 import express from 'express';[m
 import { GoogleGenAI } from '@google/genai';[m
 [m
 const app = express();[m
 app.use(express.json());[m
 [m
[31m-const ai = new GoogleGenAI({[m
[31m-  apiKey: process.env.GEMINI_API_KEY,[m
[31m-  httpOptions: {[m
[31m-    headers: {[m
[31m-      'User-Agent': 'aistudio-build',[m
[31m-    },[m
[31m-  },[m
[32m+[m[32m// Middleware CORS para integración en microservicios y API Gateways[m
[32m+[m[32mapp.use((req, res, next) => {[m
[32m+[m[32m  res.header('Access-Control-Allow-Origin', '*');[m
[32m+[m[32m  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');[m
[32m+[m[32m  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');[m
[32m+[m[32m  if (req.method === 'OPTIONS') {[m
[32m+[m[32m    return res.sendStatus(200);[m
[32m+[m[32m  }[m
[32m+[m[32m  next();[m
 });[m
 [m
[31m-app.post('/api/generate-dashboard', async (req, res) => {[m
[32m+[m[32m// Health check para el balanceador / gateway[m
[32m+[m[32mapp.get('/health', (_req, res) => {[m
[32m+[m[32m  res.json({ status: 'ok', service: 'appcraft-engine', version: '1.0.0' });[m
[32m+[m[32m});[m
[32m+[m
[32m+[m[32mconst getAiClient = () => {[m
[32m+[m[32m  const apiKey = process.env.GEMINI_API_KEY;[m
[32m+[m[32m  return new GoogleGenAI({[m
[32m+[m[32m    apiKey: apiKey || '',[m
[32m+[m[32m    httpOptions: {[m
[32m+[m[32m      headers: {[m
[32m+[m[32m        'User-Agent': 'aistudio-build',[m
[32m+[m[32m      },[m
[32m+[m[32m    },[m
[32m+[m[32m  });[m
[32m+[m[32m};[m
[32m+[m
[32m+[m[32m// Generación de layout canónico (disponible en /generate y /api/generate-dashboard)[m
[32m+[m[32mconst handleGenerateLayout = async (req: express.Request, res: express.Response) => {[m
   const { prompt, stack = 'react' } = req.body;[m
   [m
   const systemInstruction = `You are an expert dashboard architect specializing in multi-stack applications (${stack}).[m
[36m@@ -30,6 +51,7 @@[m [mapp.post('/api/generate-dashboard', async (req, res) => {[m
   }`;[m
 [m
   try {[m
[32m+[m[32m    const ai = getAiClient();[m
     const response = await ai.models.generateContent({[m
       model: 'gemini-3.8-flash',[m
       contents: prompt,[m
[36m@@ -44,9 +66,13 @@[m [mapp.post('/api/generate-dashboard', async (req, res) => {[m
   } catch (error) {[m
     res.status(500).json({ error: 'Failed to generate dashboard layout' });[m
   }[m
[31m-});[m
[32m+[m[32m};[m
 [m
[31m-app.post('/api/export-code', async (req, res) => {[m
[32m+[m[32mapp.post('/generate', handleGenerateLayout);[m
[32m+[m[32mapp.post('/api/generate-dashboard', handleGenerateLayout);[m
[32m+[m
[32m+[m[32m// Síntesis a código nativo políglota (disponible en /export y /api/export-code)[m
[32m+[m[32mconst handleExportCode = async (req: express.Request, res: express.Response) => {[m
   const { layout, stack = 'typescript', provider = 'gemini', model = 'llama3.2' } = req.body;[m
 [m
   const systemInstruction = `You are a Principal Software Architect generating native, production-grade code for the language/stack: "${stack}".[m
[36m@@ -87,6 +113,7 @@[m [mConvert the provided dashboard layout JSON specification into a complete, idioma[m
   }[m
 [m
   try {[m
[32m+[m[32m    const ai = getAiClient();[m
     const response = await ai.models.generateContent({[m
       model: 'gemini-3.8-flash',[m
       contents: JSON.stringify(layout, null, 2),[m
[36m@@ -104,7 +131,10 @@[m [mConvert the provided dashboard layout JSON specification into a complete, idioma[m
   } catch (error) {[m
     res.status(500).json({ error: 'Failed to synthesize code for target stack with Gemini' });[m
   }[m
[31m-});[m
[32m+[m[32m};[m
[32m+[m
[32m+[m[32mapp.post('/export', handleExportCode);[m
[32m+[m[32mapp.post('/api/export-code', handleExportCode);[m
 [m
 app.post('/api/ollama-generate', async (req, res) => {[m
   const { prompt, model = 'llama3.2', system } = req.body;[m
[36m@@ -149,7 +179,7 @@[m [mif (process.env.NODE_ENV !== 'production') {[m
 }[m
 [m
 [m
[31m-const PORT = 3000;[m
[32m+[m[32mconst PORT = Number(process.env.PORT) || 3000;[m
 app.listen(PORT, () => {[m
[31m-  console.log(`Server running on port ${PORT}`);[m
[32m+[m[32m  console.log(`[AppCraft Engine] Microservice active on port ${PORT}`);[m
 });[m
[1mdiff --git a/vite.config.ts b/vite.config.ts[m
[1mindex 9eb85fa..94a0b3b 100644[m
[1m--- a/vite.config.ts[m
[1m+++ b/vite.config.ts[m
[36m@@ -8,7 +8,7 @@[m [mexport default defineConfig(() => {[m
     plugins: [react(), tailwindcss()],[m
     resolve: {[m
       alias: {[m
[31m-        '@': path.resolve(__dirname, '.'),[m
[32m+[m[32m        '@': path.resolve(import.meta.dirname, '.'),[m
       },[m
     },[m
     server: {[m

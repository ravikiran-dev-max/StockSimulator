import { GoogleGenAI } from '@google/genai';

export const getAiInsights = async (req, res) => {
  const { portfolioData } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json({ 
      insights: 'AI Portfolio Insights are offline. To enable smart risk assessment and diversification suggestions, please add your GEMINI_API_KEY to the backend `.env` file.' 
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `You are an expert financial advisor. Here is the user's current stock portfolio data: ${JSON.stringify(portfolioData)}. 
    Please provide a brief, professional portfolio analysis, risk assessment, and 2-3 specific suggestions for diversification. Keep it concise.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.status(200).json({ insights: response.text });
  } catch (error) {
    console.error('Error generating AI insights:', error);
    res.status(500).json({ message: 'Error generating AI insights', error: error.message });
  }
};

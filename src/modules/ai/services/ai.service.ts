import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async parseTransaction(text: string): Promise<any> {
    const prompt = `
      Extract transaction details from the following text: "${text}".
      Return a JSON object with the following fields:
      - amount: number
      - description: string
      - categoryName: string (infer from text, e.g. Food, Transport, Shopping, etc.)
      - date: string (ISO date format, default to today if not specified)
      
      Only return the JSON object, no markdown formatting.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    try {
      // Clean up markdown code blocks if present
      const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse AI response", textResponse);
      throw new Error("Failed to parse transaction from text");
    }
  }
}

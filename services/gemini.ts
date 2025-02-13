import { GoogleGenerativeAI } from "@google/generative-ai";
import { NutritionData } from "@/types/nutrition";

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(
      process.env.EXPO_PUBLIC_GEMINI_API || ""
    );
  }

  private cleanGeminiResponse(responseText: string): NutritionData | null {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        return null;
      }
    }
    return null;
  }

  async processImage(base64Image: string): Promise<NutritionData | null> {
    const model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash-001",
    });
    const prompt =
      'Convert this nutritional information table into JSON using the following format. Create a new nutritionalInfo array entry for EACH \'Per X\' column in the table:\n{\n  "name": "Product Name",\n  "nutritionalInfo": [\n    {\n      "per": "per value as written",\n      "values": {\n        "energy": {\n          "kj": number,\n          "kcal": number\n        },\n        "fat": {\n          "total": number,\n          "saturates": number\n        },\n        "carbohydrate": {\n          "total": number,\n          "sugars": number\n        },\n        "fibre": number,\n        "protein": number,\n        "salt": number\n      }\n    }\n  ]\n}\n\nImportant instructions:\n1. Include ALL columns from the nutrition table, creating a new array entry for each \'Per X\' column\n2. Remove any % values and only use the numerical values\n3. Preserve the original units and precision of numbers as shown in the table\n4. Ensure all columns are processed in the order they appear in the table';

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    return this.cleanGeminiResponse(text);
  }
}

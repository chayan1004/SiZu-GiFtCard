import OpenAI from "openai";

// Check if OpenAI API key is provided
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Check if Perplexity API key is provided
const perplexityApiKey = process.env.PERPLEXITY_API_KEY;

export class AIService {
  async suggestDesign(prompt: string): Promise<{ design: string; explanation: string }> {
    if (!openai) {
      throw new Error("OpenAI API key not configured. Please provide OPENAI_API_KEY.");
    }

    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a gift card design expert. Based on the user's description, suggest the most appropriate gift card design from these options: classic, love, birthday, holiday, thank_you, congratulations, or premium. Respond in JSON format with 'design' (the design value) and 'explanation' (a brief explanation of why this design is perfect). Keep the explanation under 50 words and friendly.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 200
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Validate the design value
      const validDesigns = ["classic", "love", "birthday", "holiday", "thank_you", "congratulations", "premium"];
      if (!validDesigns.includes(result.design)) {
        result.design = "classic"; // Default fallback
      }

      return {
        design: result.design,
        explanation: result.explanation || "This design suits your occasion perfectly!"
      };
    } catch (error) {
      console.error("OpenAI design suggestion error:", error);
      throw new Error("Failed to generate design suggestion");
    }
  }

  async generateMessage(data: {
    occasion: string;
    recipient: string;
    tone: string;
    senderName?: string;
  }): Promise<{ message: string }> {
    if (!openai) {
      throw new Error("OpenAI API key not configured. Please provide OPENAI_API_KEY.");
    }

    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional greeting card writer. Create a heartfelt, personalized message for a gift card. The message should be appropriate for the occasion, match the requested tone, and be 2-4 sentences long. Be creative and genuine. Do not include any hashtags or emojis.`
          },
          {
            role: "user",
            content: `Write a ${data.tone} gift card message for ${data.occasion}. The recipient is my ${data.recipient}.${data.senderName ? ` The message is from ${data.senderName}.` : ''}`
          }
        ],
        temperature: 0.8,
        max_tokens: 150
      });

      const message = response.choices[0].message.content?.trim() || "";
      
      // Ensure message isn't too long
      if (message.length > 500) {
        return { message: message.substring(0, 497) + "..." };
      }

      return { message };
    } catch (error) {
      console.error("OpenAI message generation error:", error);
      throw new Error("Failed to generate message");
    }
  }

  async getGiftIdeas(query: string): Promise<{ ideas: string[] }> {
    if (!perplexityApiKey) {
      // Fallback to OpenAI if Perplexity is not available
      if (!openai) {
        throw new Error("Neither Perplexity nor OpenAI API keys are configured.");
      }

      try {
        // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a gift recommendation expert. Suggest 5 specific gift ideas that would pair well with a gift card. Be specific with product names or experiences. Keep each suggestion under 20 words."
            },
            {
              role: "user",
              content: query
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 200
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");
        return { ideas: result.ideas || [] };
      } catch (error) {
        console.error("OpenAI gift ideas error:", error);
        throw new Error("Failed to generate gift ideas");
      }
    }

    // Use Perplexity for real-time gift recommendations
    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${perplexityApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            {
              role: "system",
              content: "Be precise and concise. Suggest 5 specific, trending gift ideas that would pair well with a gift card. Focus on current popular products or experiences."
            },
            {
              role: "user",
              content: `Suggest gift ideas for: ${query}`
            }
          ],
          temperature: 0.7,
          max_tokens: 200,
          return_related_questions: false,
          search_recency_filter: "month"
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parse the response to extract gift ideas
      const ideas = content
        .split("\n")
        .filter((line: string) => line.trim())
        .map((line: string) => line.replace(/^\d+\.\s*/, "").trim())
        .filter((idea: string) => idea.length > 0)
        .slice(0, 5);

      return { ideas };
    } catch (error) {
      console.error("Perplexity gift ideas error:", error);
      
      // Fallback to OpenAI
      if (openai) {
        return this.getGiftIdeas(query); // Recursive call will use OpenAI
      }
      
      throw new Error("Failed to generate gift ideas");
    }
  }

  async analyzeRecipientPreferences(description: string): Promise<{
    interests: string[];
    suggestedAmount: number;
    personalityTraits: string[];
  }> {
    if (!openai) {
      throw new Error("OpenAI API key not configured. Please provide OPENAI_API_KEY.");
    }

    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Analyze the recipient description and provide insights in JSON format with:
            - interests: array of 3-5 key interests
            - suggestedAmount: recommended gift card amount (25, 50, 100, 250, or 500)
            - personalityTraits: array of 2-3 personality traits that might influence gift preferences`
          },
          {
            role: "user",
            content: description
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
        max_tokens: 200
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Validate suggested amount
      const validAmounts = [25, 50, 100, 250, 500];
      if (!validAmounts.includes(result.suggestedAmount)) {
        result.suggestedAmount = 50; // Default
      }

      return {
        interests: result.interests || [],
        suggestedAmount: result.suggestedAmount,
        personalityTraits: result.personalityTraits || []
      };
    } catch (error) {
      console.error("OpenAI preference analysis error:", error);
      throw new Error("Failed to analyze preferences");
    }
  }
}

export const aiService = new AIService();
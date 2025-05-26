
import { GoogleGenAI } from "@google/genai";
import { CaseData, GeminiCaseJSONStructure, Clue, Suspect, Riddle } from '../types';
import { GEMINI_MODEL_TEXT } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is not set. Please ensure the API_KEY environment variable is configured.");
  // Potentially throw an error or handle this state in the UI
}

const ai = new GoogleGenAI({ apiKey: API_KEY! }); // Use non-null assertion as we assume it's configured

const generateFullCasePrompt = `
You are a master detective storyteller. Generate a complete murder mystery case file.
The output MUST be a single JSON object. Do not include any text or markdown formatting outside this JSON object (e.g. no \`\`\`json ... \`\`\` fences).
The JSON object should strictly adhere to the following structure:
{
  "victimName": "string (e.g., 'Arthur Blackwood')",
  "causeOfDeath": "string (e.g., 'Single gunshot to the chest')",
  "locationDescription": "string (e.g., 'A dusty, old library in a Victorian mansion, late at night.')",
  "crimeSceneImageUrlSeed": "string (a one or two word theme for picsum.photos, e.g., 'library night')",
  "caseSummary": "string (a brief overview of the case, 2-3 sentences)",
  "clues": [
    {"id": "clue1", "description": "A mysterious coded note found in the victim's pocket.", "type": "physical", "details": "The note contains a sequence of numbers and symbols. Its meaning is initially unclear."},
    {"id": "clue2", "description": "A shattered teacup on the floor.", "type": "physical", "details": "Fine china, appears to have been dropped suddenly. No traces of poison detected."},
    {"id": "clue3", "description": "Witness heard a heated argument about 'a betrayal'.", "type": "testimonial", "details": "The housekeeper overheard part of an argument hours before the murder. Couldn't identify the other voice."}
  ],
  "suspects": [
    {"id": "suspect1", "name": "Eleanor Vance", "background": "The victim's estranged wife, a calculating businesswoman.", "motiveOrAlibi": "Claims she was at a charity gala. Stood to inherit a considerable fortune.", "imageUrlSeed": "businesswoman 1940s"},
    {"id": "suspect2", "name": "Dr. Alistair Croft", "background": "The victim's ambitious research partner.", "motiveOrAlibi": "Says he was working late at the lab. Recently had a major disagreement with the victim over intellectual property.", "imageUrlSeed": "scientist tense"},
    {"id": "suspect3", "name": "Silas \"Shadow\" Kane", "background": "A notorious smuggler the victim had dealings with.", "motiveOrAlibi": "Provides a vague alibi of 'being out of town'. The victim owed him a significant sum.", "imageUrlSeed": "noir detective shadow"}
  ],
  "culpritId": "suspect1", 
  "culpritReason": "Eleanor Vance, driven by greed and a desire to escape a failing marriage, orchestrated the murder. The 'betrayal' argument was with her. The coded note (clue1) was a red herring planted by her, its solution pointing to an innocent party. The shattered teacup (clue2) was knocked over during a struggle with the victim after he discovered her intentions.",
  "riddle": {
    "text": "I have a spine, but no bones. I tell many stories, but speak no words. The more I'm read, the thinner I grow. What am I?",
    "answer": "A book",
    "relatedClueId": "clue1" 
  }
}

Make the story engaging and the clues logical. Ensure the riddle is solvable and relevant to one of the clues, helping to decipher it or understand its significance.
The *ImageUrlSeed strings should be concise and suitable for picsum.photos (e.g., 'dark alley', 'vintage car').
The clue designated by 'relatedClueId' for the riddle should be initially somewhat obscure, with the riddle's solution providing a key insight into it.
Ensure IDs are unique and correctly referenced.
The culpritReason should clearly explain the motive and how the clues (or lack thereof) point to the culprit.
`;


export const generateNewCase = async (): Promise<CaseData | null> => {
  if (!API_KEY) {
    console.error("Gemini API Key not available. Cannot generate case.");
    // In a real app, you might want to throw an error or return a specific error object
    return null; 
  }
  try {
    console.log("Requesting new case from Gemini...");
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: generateFullCasePrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.8, // Add some creativity
      },
    });
    
    console.log("Raw Gemini response text:", response.text);

    let jsonStr = response.text.trim();
    // Remove markdown fences if present (though prompt asks not to include them)
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }

    const parsedResponse = JSON.parse(jsonStr) as GeminiCaseJSONStructure;
    console.log("Parsed Gemini response:", parsedResponse);

    // Transform Gemini response to CaseData structure
    const crimeSceneImageUrl = `https://picsum.photos/seed/${encodeURIComponent(parsedResponse.crimeSceneImageUrlSeed)}/1200/800?grayscale&blur=1`;

    const clues: Clue[] = parsedResponse.clues.map(c => ({
      ...c,
      isRevealed: c.id !== parsedResponse.riddle.relatedClueId, // Reveal all but the riddle-linked one initially or based on type
      isNewlyDiscovered: false,
    }));
    
    // Ensure the riddle related clue is initially not revealed if it's meant to be unlocked
    const riddleClue = clues.find(c => c.id === parsedResponse.riddle.relatedClueId);
    if (riddleClue) {
        riddleClue.isRevealed = false; 
        riddleClue.type = 'riddle_reward'; // Mark it as special
    }


    const suspects: Suspect[] = parsedResponse.suspects.map(s => ({
      ...s,
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(s.imageUrlSeed)}/400/500?grayscale`,
    }));

    const riddle: Riddle = {
      ...parsedResponse.riddle,
      isSolved: false,
    };

    return {
      victimName: parsedResponse.victimName,
      causeOfDeath: parsedResponse.causeOfDeath,
      locationDescription: parsedResponse.locationDescription,
      crimeSceneImageUrl: crimeSceneImageUrl,
      caseSummary: parsedResponse.caseSummary,
      clues: clues,
      suspects: suspects,
      culpritId: parsedResponse.culpritId,
      culpritReason: parsedResponse.culpritReason,
      riddle: riddle,
    };

  } catch (error) {
    console.error("Error generating case with Gemini:", error);
    // Fallback or error display
    // Try to parse error response from Gemini if available
    if (error instanceof Error) {
        // Additional logging for Gemini specific errors if they exist on the error object
        // const geminiError = error as any; // Potentially cast to a more specific error type if known
        // if (geminiError.message) { console.error("Gemini Error Message:", geminiError.message); }
    }
    return null;
  }
};

import { SchemaType } from '@google/generative-ai';

export const analysisSchema = {
  type: SchemaType.OBJECT,
  properties: {
    needSkill: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "List of specific skills required (e.g., 'First Aid', 'Heavy Lifting', 'Counseling')."
    },
    affectedCount: {
      type: SchemaType.INTEGER,
      description: "Estimated number of people affected based on the description."
    },
    criticalScore: {
      type: SchemaType.INTEGER,
      description: "Severity of the situation on a scale of 1 to 10."
    },
    requiredVolunteers: {
      type: SchemaType.INTEGER,
      description: "Estimated number of volunteers needed to handle this task."
    }
  },
  required: ["needSkill", "affectedCount", "criticalScore", "requiredVolunteers"]
};

export const teamSelectionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    selectedUids: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Array of exactly the requested number of volunteer UIDs. You MUST output the exact alphanumeric 'uid' string from the provided JSON list. Do NOT use placeholders like 'volunteer_1'."
    }
  },
  required: ["selectedUids"]
};
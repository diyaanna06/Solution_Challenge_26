import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../config/firebase.js';
import { calculateDistance } from '../utils/distance.js';
import { teamSelectionSchema } from '../schemas/requestSchemas.js';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getNearbyVolunteers = async (location) => {
  const volunteersSnapshot = await db.collection('users').where('role', '==', 'volunteer').get();

  let nearbyVolunteers = [];
  volunteersSnapshot.forEach(doc => {
    const v = doc.data();
    if (v.workLocation && v.workLocation.lat && v.workLocation.lng) {
      const dist = calculateDistance(
        location.lat, location.lng,
        v.workLocation.lat, v.workLocation.lng
      );
      if (dist <= 20) {
        nearbyVolunteers.push({
          uid: doc.id,
          fcmToken: v.fcmToken,
          skills: v.skills || [],
          ongoingTasksCount: (v.ongoingTasks || []).length,
          completedTasksCount: (v.completedTasks || []).length
        });
      }
    }
  });

  return nearbyVolunteers;
};

export const selectTeam = async (nearbyVolunteers, requiredLimit, needSkill) => {
  if (nearbyVolunteers.length === 0) return [];

  if (nearbyVolunteers.length <= requiredLimit) {
    return nearbyVolunteers.map(v => v.uid);
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: teamSelectionSchema,
    }
  });

  const teamPrompt = `
    We need ${requiredLimit} volunteers for a task requiring these skills: ${needSkill.join(', ')}.
    Select the best ${requiredLimit} volunteers from this JSON list.
    CRITICAL INSTRUCTION: You MUST return the exact 'uid' value (e.g., 'SZOipzCK6JShJbb9nY...') from the JSON objects. Do NOT rename them to 'volunteer_0'.
    Prioritize matching skills, FEWEST ongoingTasksCount, and HIGHEST completedTasksCount.
    Volunteers List: ${JSON.stringify(nearbyVolunteers)}
  `;

  const result = await model.generateContent(teamPrompt);
  const teamData = JSON.parse(result.response.text());
  return teamData.selectedUids;
};
import { db, admin } from '../config/firebase.js';
import { calculateDistance } from '../utils/distance.js';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analysisSchema = {
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

const teamSelectionSchema = {
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

export const createRequest = async (req, res) => {
  try {
    const { uid, description, location, images } = req.body;

    if (!uid || !description || !location) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const model1 = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      }
    });

    const analysisPrompt = `Analyze this community need and output strictly JSON. Description: "${description}"`;
    const analysisResult = await model1.generateContent(analysisPrompt);
    const analysisData = JSON.parse(analysisResult.response.text());
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

    let finalTeamUids = [];
    const requiredLimit = analysisData.requiredVolunteers;

    if (nearbyVolunteers.length === 0) {
      finalTeamUids = [];
    } else if (nearbyVolunteers.length <= requiredLimit) {
      finalTeamUids = nearbyVolunteers.map(v => v.uid);
    } else {
      const model2 = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: teamSelectionSchema,
        }
      });

      const teamPrompt = `
        We need ${requiredLimit} volunteers for a task requiring these skills: ${analysisData.needSkill.join(', ')}.
        Select the best ${requiredLimit} volunteers from this JSON list. 
        CRITICAL INSTRUCTION: You MUST return the exact 'uid' value (e.g., 'SZOipzCK6JShJbb9nY...') from the JSON objects. Do NOT rename them to 'volunteer_0.
        Prioritize matching skills, FEWEST ongoingTasksCount, and HIGHEST completedTasksCount.
        Volunteers List: ${JSON.stringify(nearbyVolunteers)}
      `;

      const teamResult = await model2.generateContent(teamPrompt);
      const teamData = JSON.parse(teamResult.response.text());
      finalTeamUids = teamData.selectedUids;
    }
    finalTeamUids = finalTeamUids.filter(id => id != null);
    const newRequestRef = db.collection('requests').doc();
    const requestDoc = {
      id: newRequestRef.id,
      createdByUid: uid,
      createdAt: new Date(),
      description,
      images: images || [],
      location,
      status: "active",
      
      needSkill: analysisData.needSkill,
      affectedCount: analysisData.affectedCount,
      criticalScore: analysisData.criticalScore,
      requiredVolunteers: analysisData.requiredVolunteers,
      
      invitedVolunteers: finalTeamUids, 
      volunteerTeam: [],
      
      resolution: null,
      resolvedAt: null
    };

    await newRequestRef.set(requestDoc);
    if (finalTeamUids.length > 0) {
      const targetTokens = nearbyVolunteers
        .filter(v => finalTeamUids.includes(v.uid) && v.fcmToken)
        .map(v => v.fcmToken);

      if (targetTokens.length > 0) {
        try {
          const message = {
            notification: {
              title: '🚨 Urgent: Volunteer Task Assigned',
              body: `Severity ${analysisData.criticalScore}/10. Your skills are needed nearby. Tap for details.`,
            },
            data: {
              requestId: newRequestRef.id,
              type: 'NEW_REQUEST'
            },
            tokens: targetTokens,
          };
          const fcmResponse = await admin.messaging().sendEachForMulticast(message);
          
          console.log(`Push notifications sent. Success: ${fcmResponse.successCount}, Failed: ${fcmResponse.failureCount}`);
          if (fcmResponse.failureCount > 0) {
            fcmResponse.responses.forEach((resp, idx) => {
              if (!resp.success) {
                console.warn(`Failed to send to token ${targetTokens[idx]}:`, resp.error.code);
              }
            });
          }
        } catch (notificationError) {
          console.error("Fatal error sending push notifications:", notificationError);
        }
      } else {
        console.log("Team selected, but no valid FCM tokens found for notifications.");
      }
    }

    res.status(201).json({ 
      message: "Request created successfully", 
      data: requestDoc 
    });

  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({ error: "Failed to process the request" });
  }
};
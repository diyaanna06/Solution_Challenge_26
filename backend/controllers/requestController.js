import { db } from '../config/firebase.js';
import { analyzeRequest } from '../services/analysisService.js';
import { getNearbyVolunteers, selectTeam } from '../services/volunteerService.js';
import { sendVolunteerNotifications } from '../services/notificationService.js';

export const createRequest = async (req, res) => {
  try {
    const { uid, description, location, images } = req.body;

    if (!uid || !description || !location) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const analysisData = await analyzeRequest(description);

    const nearbyVolunteers = await getNearbyVolunteers(location);

    let finalTeamUids = await selectTeam(
      nearbyVolunteers,
      analysisData.requiredVolunteers,
      analysisData.needSkill
    );

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

    await sendVolunteerNotifications(
      finalTeamUids,
      nearbyVolunteers,
      analysisData.criticalScore,
      newRequestRef.id
    );

    res.status(201).json({
      message: "Request created successfully",
      data: requestDoc
    });

  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({ error: "Failed to process the request" });
  }
};
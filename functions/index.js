const { onDocumentUpdated, onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Maps governorate names to valid FCM topic identifiers.
 * FCM topics must match /^[a-zA-Z0-9-_.~%]+$/.
 */
function getTopicName(gov) {
  if (!gov || gov === "all" || gov === "كل محافظات مصر") return "all";
  return "gov_" + Buffer.from(gov, "utf8").toString("hex");
}

/**
 * 1. Upon issue resolution, award 10 points to the solver (by2).
 * Runs only once via pointsAwarded flag check.
 */
exports.onIssueResolved = onDocumentUpdated("issues/{issueId}", async (event) => {
  const before = event.data.before ? event.data.before.data() : null;
  const after = event.data.after ? event.data.after.data() : null;

  if (!before || !after) return null;

  // Check state transition to 'resolved'
  if (before.status !== "resolved" && after.status === "resolved") {
    if (after.pointsAwarded === true) {
      console.log(`Points already awarded for issue ${event.params.issueId}`);
      return null;
    }

    const solverId = after.by2;
    if (!solverId) {
      console.warn(`No solver ID (by2) for issue ${event.params.issueId}`);
      return null;
    }

    const batch = db.batch();
    const userRef = db.collection("users").doc(solverId);
    const issueRef = db.collection("issues").doc(event.params.issueId);

    batch.update(userRef, {
      points: admin.firestore.FieldValue.increment(10)
    });
    batch.update(issueRef, {
      pointsAwarded: true
    });

    await batch.commit();
    console.log(`Successfully awarded 10 points to user ${solverId} for resolving issue ${event.params.issueId}`);
  }
  return null;
});

/**
 * 2. Upon hero approval by admin (ok -> true), award 20 points to the author (by).
 * Runs only once via pointsAwarded flag check.
 */
exports.onHeroApproved = onDocumentUpdated("heroes/{heroId}", async (event) => {
  const before = event.data.before ? event.data.before.data() : null;
  const after = event.data.after ? event.data.after.data() : null;

  if (!before || !after) return null;

  // Check transition from not ok to ok === true
  if (!before.ok && after.ok === true) {
    if (after.pointsAwarded === true) {
      console.log(`Points already awarded for hero ${event.params.heroId}`);
      return null;
    }

    const authorId = after.by;
    if (!authorId) {
      console.warn(`No author ID (by) for hero ${event.params.heroId}`);
      return null;
    }

    const batch = db.batch();
    const userRef = db.collection("users").doc(authorId);
    const heroRef = db.collection("heroes").doc(event.params.heroId);

    batch.update(userRef, {
      points: admin.firestore.FieldValue.increment(20)
    });
    batch.update(heroRef, {
      pointsAwarded: true
    });

    await batch.commit();
    console.log(`Successfully awarded 20 points to user ${authorId} for approved initiative ${event.params.heroId}`);
  }
  return null;
});

/**
 * 3. Upon urgent announcement / note creation, dispatch an FCM push notification
 * to the governorate topic (or 'all').
 */
exports.onNoteCreated = onDocumentCreated("notes/{noteId}", async (event) => {
  const note = event.data ? event.data.data() : null;
  if (!note) return null;

  const gov = note.gov || "all";
  const topic = getTopicName(gov);

  const payload = {
    topic: topic,
    notification: {
      title: note.title || "بلدتي - إشعار عاجل",
      body: note.body || ""
    },
    data: {
      noteId: event.params.noteId,
      gov: String(gov),
      at: String(note.at || Date.now())
    },
    webpush: {
      headers: {
        Urgency: "high"
      },
      notification: {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        dir: "rtl",
        lang: "ar"
      }
    }
  };

  try {
    const response = await admin.messaging().send(payload);
    console.log(`Successfully sent FCM notification to topic '${topic}':`, response);
  } catch (error) {
    console.error(`Failed to send FCM notification to topic '${topic}':`, error);
  }
  return null;
});

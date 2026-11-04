import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { GameQuestion } from '../models/GameQuestion.js';
import { GameImage } from '../models/GameImage.js';
import { CURATED_CHALLENGES } from '../constants/gameConstants.js';
import { connectDB } from '../config/db.js';

/**
 * Ensures a designated administrator exists in the database.
 * If no admin with the specified email exists, creates one securely.
 * Also seeds initial Game Images and Game Questions if collections are empty,
 * and normalizes question IDs and status.
 */
export async function seedAdminUser() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@deeptrust.academy').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@DeepTrust2026!';
  const adminName = process.env.ADMIN_NAME || 'DeepTrust Lead Admin';

  let admin = await User.findOne({ email: adminEmail }).select('+password');

  if (!admin) {
    admin = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword, // Will be hashed by userSchema.pre('save')
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
    });
    await admin.save();
    console.log(`[Admin Seed] Created default administrator: ${adminEmail}`);
  } else {
    let updated = false;
    if (admin.role !== 'ADMIN') {
      admin.role = 'ADMIN';
      updated = true;
    }
    if (!admin.isActive) {
      admin.isActive = true;
      updated = true;
    }
    if (updated) {
      await admin.save();
      console.log(`[Admin Seed] Updated existing user ${adminEmail} to ADMIN.`);
    } else {
      console.log(`[Admin Seed] Administrator account ${adminEmail} is active and ready.`);
    }
  }

  // Pre-seed Game Images if collection is empty
  const imageCount = await GameImage.countDocuments();
  if (imageCount === 0) {
    const imagesToSeed = CURATED_CHALLENGES.map((c, index) => {
      const isReal = c.groundTruthClassification === 'NOT_AI_GENERATED';
      return {
        imageId: `IMG-${String(index + 1).padStart(3, '0')}`,
        imageUrl: c.imageUrl,
        imageCategory: c.category || 'Facial Synthesis',
        imageType: isReal ? 'REAL' : 'AI_GENERATED',
        difficulty: c.difficulty || 'Medium',
        status: 'PUBLISHED',
        isActive: true,
        notes: `${c.title} — ${c.explanation || ''}`,
        uploadedBy: admin._id,
      };
    });

    await GameImage.insertMany(imagesToSeed);
    console.log(`[GameImage Seed] Seeded ${imagesToSeed.length} game images into image bank.`);
  } else {
    // Normalize existing GameImages
    const existingImages = await GameImage.find();
    for (const img of existingImages) {
      let changed = false;
      if (!img.correctAnswer && img.imageType) {
        img.correctAnswer = img.imageType;
        changed = true;
      }
      if (!img.publicationStatus && img.status) {
        img.publicationStatus = img.status;
        changed = true;
      }
      if (!img.explanation && img.notes) {
        img.explanation = img.notes;
        changed = true;
      }
      if (changed) {
        await img.save();
      }
    }
  }

  // Pre-seed or normalize Game Questions
  const questionCount = await GameQuestion.countDocuments();
  if (questionCount === 0) {
    const questionsToSeed = CURATED_CHALLENGES.map((c, index) => {
      const isReal = c.groundTruthClassification === 'NOT_AI_GENERATED';
      return {
        questionId: `Q-${String(index + 1).padStart(3, '0')}`,
        imageId: `IMG-${String(index + 1).padStart(3, '0')}`,
        title: c.title,
        category: c.category || 'Facial Synthesis',
        difficulty: c.difficulty || 'Medium',
        imageUrl: c.imageUrl,
        genuineImageUrl: isReal ? c.imageUrl : '',
        aiImageUrl: !isReal ? c.imageUrl : '',
        correctAnswer: isReal ? 'REAL' : 'AI_GENERATED',
        label: isReal ? 'REAL' : 'AI_GENERATED',
        groundTruthClassification: isReal ? 'NOT_AI_GENERATED' : 'AI_GENERATED',
        clues: c.clues || '',
        explanation: c.explanation || '',
        status: 'PUBLISHED',
        isActive: true,
        createdBy: admin._id,
      };
    });

    await GameQuestion.insertMany(questionsToSeed);
    console.log(`[GameQuestion Seed] Seeded ${questionsToSeed.length} game questions from curated challenge bank.`);
  } else {
    // Normalize existing questions: ensure questionId, correctAnswer, status, and isActive
    const existingQuestions = await GameQuestion.find();
    for (let i = 0; i < existingQuestions.length; i++) {
      const q = existingQuestions[i];
      let changed = false;

      if (!q.questionId) {
        q.questionId = `Q-${String(i + 1).padStart(3, '0')}`;
        changed = true;
      }
      if (!q.correctAnswer) {
        q.correctAnswer = q.label === 'AI_GENERATED' ? 'AI_GENERATED' : 'REAL';
        changed = true;
      }
      if (!q.status) {
        q.status = 'PUBLISHED';
        changed = true;
      }
      if (q.isActive === undefined || q.isActive === null) {
        q.isActive = true;
        changed = true;
      }
      if (!q.imageId) {
        q.imageId = `IMG-${String(i + 1).padStart(3, '0')}`;
        changed = true;
      }

      if (changed) {
        await q.save();
      }
    }
    console.log(`[GameQuestion Seed] Verified and normalized ${existingQuestions.length} existing questions.`);
  }

  return admin;
}

// Allow direct CLI execution: node backend/utils/seedAdmin.js
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('seedAdmin.js')) {
  (async () => {
    try {
      await connectDB();
      await seedAdminUser();
      console.log('[Admin Seed] Initialization complete.');
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('[Admin Seed Error]', err);
      process.exit(1);
    }
  })();
}

export default seedAdminUser;

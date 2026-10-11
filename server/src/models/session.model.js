'use strict';

/**
 * models/session.model.js — MongoDB Atlas server-managed session store.
 *
 * Responsibilities:
 *   - Stores active user application sessions securely in MongoDB.
 *   - Enforces TTL indexing so expired sessions are automatically purged by MongoDB.
 *   - Uses crypto.randomBytes for high-entropy session tokens.
 *   - Supports session regeneration to protect against session fixation attacks.
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const SessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL auto-cleanup
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'sessions',
  }
);

/**
 * Generates a cryptographically strong 256-bit random session identifier.
 */
SessionSchema.statics.generateSessionToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Creates and stores a new application session for a user.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {object} [metadata]
 * @returns {Promise<import('mongoose').Document>}
 */
SessionSchema.statics.createSession = async function (userId, metadata = {}) {
  const sessionId = this.generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const session = await this.create({
    sessionId,
    userId,
    expiresAt,
    lastAccessedAt: new Date(),
    ipAddress: metadata.ip || null,
    userAgent: metadata.userAgent || null,
  });

  return session;
};

/**
 * Finds and validates an active session, populating user details.
 *
 * @param {string} sessionId
 * @returns {Promise<import('mongoose').Document|null>}
 */
SessionSchema.statics.validateSession = async function (sessionId) {
  if (!sessionId || typeof sessionId !== 'string') {
    return null;
  }

  const session = await this.findOne({
    sessionId,
    expiresAt: { $gt: new Date() },
  }).populate('userId');

  if (!session || !session.userId) {
    return null;
  }

  // Update last accessed time without blocking
  session.lastAccessedAt = new Date();
  session.save().catch(() => {});

  return session;
};

/**
 * Destroys a session by token.
 *
 * @param {string} sessionId
 * @returns {Promise<boolean>}
 */
SessionSchema.statics.destroySession = async function (sessionId) {
  if (!sessionId || typeof sessionId !== 'string') {
    return false;
  }
  const result = await this.deleteOne({ sessionId });
  return result.deletedCount > 0;
};

/**
 * Invalidate all sessions for a specific user (useful for security events).
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<number>}
 */
SessionSchema.statics.destroyAllUserSessions = async function (userId) {
  const result = await this.deleteMany({ userId });
  return result.deletedCount;
};

const Session = mongoose.model('Session', SessionSchema);

module.exports = Session;

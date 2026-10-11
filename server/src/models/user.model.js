'use strict';

/**
 * models/user.model.js — Mongoose user model for AirSafe authentication.
 *
 * Responsibilities:
 *   - Stores user profiles authenticated via Google Identity Services.
 *   - Ensures unique mapping of Google subject identifier (sub).
 *   - Enforces unique indexing on email with case-insensitive normalization.
 *   - Provides atomic find-or-create logic resilient to concurrent login race conditions.
 *   - Returns strictly sanitised public user profile objects.
 */

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: [true, 'Google subject identifier (sub) is required.'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'User email is required.'],
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, 'User display name is required.'],
      trim: true,
    },
    picture: {
      type: String,
      default: null,
      trim: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Indexes
UserSchema.index({ email: 1 });

/**
 * toPublicProfile — returns only safe, client-facing fields.
 */
UserSchema.methods.toPublicProfile = function () {
  return {
    id: this._id.toString(),
    googleId: this.googleId,
    email: this.email,
    name: this.name,
    picture: this.picture,
    emailVerified: this.emailVerified,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
  };
};

/**
 * findOrCreateGoogleUser — retrieves existing user or safely creates new account.
 * Handles race conditions where duplicate concurrent requests might attempt
 * simultaneous insertion with the same googleId.
 *
 * @param {object} claims - Verified Google token claims
 * @param {string} claims.googleId
 * @param {string} claims.email
 * @param {string} claims.name
 * @param {string} [claims.picture]
 * @param {boolean} [claims.emailVerified]
 * @returns {Promise<import('mongoose').Document>}
 */
UserSchema.statics.findOrCreateGoogleUser = async function ({
  googleId,
  email,
  name,
  picture = null,
  emailVerified = false,
}) {
  if (!googleId || typeof googleId !== 'string') {
    throw new Error('Valid Google subject identifier is required.');
  }
  if (!email || typeof email !== 'string') {
    throw new Error('Valid user email is required.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = typeof name === 'string' && name.trim() ? name.trim() : normalizedEmail.split('@')[0];

  // Try to find user by stable googleId
  let user = await this.findOne({ googleId });

  if (user) {
    user.lastLoginAt = new Date();
    if (normalizedName && user.name !== normalizedName) {
      user.name = normalizedName;
    }
    if (picture && user.picture !== picture) {
      user.picture = picture;
    }
    if (emailVerified !== undefined) {
      user.emailVerified = Boolean(emailVerified);
    }
    await user.save();
    return user;
  }

  // Create new user record
  try {
    user = await this.create({
      googleId,
      email: normalizedEmail,
      name: normalizedName,
      picture: picture || null,
      emailVerified: Boolean(emailVerified),
      lastLoginAt: new Date(),
    });
    return user;
  } catch (err) {
    // Handle concurrent duplicate key race condition (E11000)
    if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
      user = await this.findOne({ googleId });
      if (user) {
        user.lastLoginAt = new Date();
        await user.save();
        return user;
      }
    }
    throw err;
  }
};

const User = mongoose.model('User', UserSchema);

module.exports = User;

'use strict';

/**
 * controllers/auth.controller.js — Handles Google authentication and application sessions.
 *
 * Responsibilities:
 *   - POST /api/auth/google : Verifies Google token, finds/creates user, issues HTTP-only session cookie.
 *   - GET  /api/auth/me     : Restores authenticated session profile.
 *   - POST /api/auth/logout : Invalidates server-side session in MongoDB and clears cookie.
 */

const User = require('../models/user.model');
const Session = require('../models/session.model');
const googleAuthService = require('../services/googleAuth.service');
const {
  setSessionCookie,
  clearSessionCookie,
  getSessionTokenFromRequest,
} = require('../utils/cookie');

/**
 * googleLoginHandler — POST /api/auth/google
 */
async function googleLoginHandler(req, res, next) {
  const body = req.body || {};
  // Google Identity Services may deliver token as 'idToken' or 'credential'
  const idToken = body.idToken || body.credential;

  if (!idToken || typeof idToken !== 'string' || !idToken.trim()) {
    return res.status(400).json({
      status: 'error',
      message: 'Google ID token is required in request body.',
    });
  }

  try {
    // 1. Verify Google ID token and claims
    const claims = await googleAuthService.verifyGoogleIdToken(idToken);

    // 2. Find or create user in MongoDB
    console.log(`[auth.controller] Persisting user to database: "${User.db.name}", collection: "${User.collection.name}".`);
    const user = await User.findOrCreateGoogleUser(claims);

    // 3. Invalidate any existing session from previous login (session regeneration)
    const existingToken = getSessionTokenFromRequest(req);
    if (existingToken) {
      await Session.destroySession(existingToken).catch(() => {});
    }

    // 4. Establish fresh server-side session in MongoDB
    const metadata = {
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
    };
    console.log(`[auth.controller] Persisting session to database: "${Session.db.name}", collection: "${Session.collection.name}".`);
    const session = await Session.createSession(user._id, metadata);

    // 5. Set secure HTTP-only cookie
    setSessionCookie(res, session.sessionId);

    // 6. Return sanitised public user profile
    return res.status(200).json({
      status: 'success',
      data: {
        user: user.toPublicProfile(),
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * getMeHandler — GET /api/auth/me
 */
async function getMeHandler(req, res, next) {
  const sessionToken = getSessionTokenFromRequest(req);

  if (!sessionToken) {
    return res.status(401).json({
      status: 'error',
      message: 'No active session found. Please sign in.',
    });
  }

  try {
    const session = await Session.validateSession(sessionToken);

    if (!session || !session.userId) {
      clearSessionCookie(res);
      return res.status(401).json({
        status: 'error',
        message: 'Session has expired or is invalid. Please sign in again.',
      });
    }

    const user = session.userId;
    return res.status(200).json({
      status: 'success',
      data: {
        user: user.toPublicProfile(),
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * logoutHandler — POST /api/auth/logout
 */
async function logoutHandler(req, res, next) {
  const sessionToken = getSessionTokenFromRequest(req);

  try {
    if (sessionToken) {
      await Session.destroySession(sessionToken).catch(() => {});
    }

    clearSessionCookie(res);

    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.',
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  googleLoginHandler,
  getMeHandler,
  logoutHandler,
};

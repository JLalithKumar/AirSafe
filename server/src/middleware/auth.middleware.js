'use strict';

/**
 * middleware/auth.middleware.js — Session authentication guards.
 *
 * Responsibilities:
 *   - requireAuth: Enforces valid server-side session for protected routes.
 *   - optionalAuth: Attaches authenticated user context when present, without blocking guests.
 */

const Session = require('../models/session.model');
const { getSessionTokenFromRequest } = require('../utils/cookie');

/**
 * requireAuth — blocks request if no valid server session is active.
 */
async function requireAuth(req, res, next) {
  const sessionToken = getSessionTokenFromRequest(req);

  if (!sessionToken) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required. Please sign in with Google.',
    });
  }

  try {
    const session = await Session.validateSession(sessionToken);

    if (!session || !session.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Session has expired or is invalid. Please sign in again.',
      });
    }

    req.user = session.userId;
    req.sessionDoc = session;
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * optionalAuth — resolves session if present, but continues for anonymous visitors.
 */
async function optionalAuth(req, res, next) {
  const sessionToken = getSessionTokenFromRequest(req);
  if (!sessionToken) {
    req.user = null;
    return next();
  }

  try {
    const session = await Session.validateSession(sessionToken);
    req.user = session && session.userId ? session.userId : null;
    req.sessionDoc = session || null;
  } catch {
    req.user = null;
  }

  return next();
}

module.exports = {
  requireAuth,
  optionalAuth,
};

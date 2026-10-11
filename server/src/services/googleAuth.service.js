'use strict';

/**
 * services/googleAuth.service.js — Official Google Identity Services token verification.
 *
 * Responsibilities:
 *   - Verifies Google ID tokens using Google's official google-auth-library OAuth2Client.
 *   - Validates signature, audience, issuer, expiration, subject (sub), and email verification.
 *   - Ensures server fails fast with clear errors if GOOGLE_CLIENT_ID configuration is absent.
 *   - Never logs raw ID tokens or credentials.
 */

const { OAuth2Client } = require('google-auth-library');
const config = require('../config/env');

let defaultClient = null;
let testClientIdOverride = undefined;

function getEffectiveGoogleClientId() {
  if (testClientIdOverride !== undefined) {
    return testClientIdOverride;
  }
  return config.googleClientId || process.env.GOOGLE_CLIENT_ID || null;
}

function _setGoogleClientIdForTesting(id) {
  testClientIdOverride = id;
  defaultClient = null; // force re-creation
}

function getOAuth2Client() {
  const effectiveId = getEffectiveGoogleClientId();
  if (!effectiveId) {
    const err = new Error(
      'Google authentication is not configured on the server. Missing GOOGLE_CLIENT_ID environment variable.'
    );
    err.statusCode = 503;
    throw err;
  }

  if (!defaultClient) {
    defaultClient = new OAuth2Client(effectiveId);
  }
  return defaultClient;
}

/**
 * Verifies a Google ID token and returns authenticated claims.
 *
 * @param {string} idToken - The JWT ID token received from Google Identity Services
 * @param {object} [clientOverride] - Optional client for unit test mocking
 * @returns {Promise<{ googleId: string, email: string, name: string, picture: string|null, emailVerified: boolean }>}
 */
async function verifyGoogleIdToken(idToken, clientOverride = null) {
  if (!idToken || typeof idToken !== 'string' || !idToken.trim()) {
    const err = new Error('Missing Google ID token.');
    err.statusCode = 400;
    throw err;
  }

  const client = clientOverride || getOAuth2Client();

  const effectiveId = getEffectiveGoogleClientId();
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken: idToken.trim(),
      audience: effectiveId,
    });
  } catch (err) {
    const authError = new Error(
      err.message && err.message.includes('expired')
        ? 'Google ID token has expired. Please sign in again.'
        : `Google ID token verification failed: ${err.message}`
    );
    authError.statusCode = 401;
    throw authError;
  }

  const payload = ticket.getPayload();
  if (!payload) {
    const err = new Error('Invalid Google token: empty payload.');
    err.statusCode = 401;
    throw err;
  }

  // Validate audience
  if (effectiveId && payload.aud !== effectiveId) {
    const err = new Error('Invalid Google token audience.');
    err.statusCode = 401;
    throw err;
  }

  // Validate issuer
  const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
  if (!validIssuers.includes(payload.iss)) {
    const err = new Error(`Invalid Google token issuer: "${payload.iss}".`);
    err.statusCode = 401;
    throw err;
  }

  // Validate subject identifier (sub)
  if (!payload.sub || typeof payload.sub !== 'string') {
    const err = new Error('Invalid Google token: missing subject identifier (sub).');
    err.statusCode = 401;
    throw err;
  }

  // Validate email presence
  if (!payload.email || typeof payload.email !== 'string') {
    const err = new Error('Invalid Google token: missing email claim.');
    err.statusCode = 401;
    throw err;
  }

  // Require email to be verified by Google
  if (payload.email_verified !== true) {
    const err = new Error('Google account email has not been verified.');
    err.statusCode = 401;
    throw err;
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase().trim(),
    name: payload.name && payload.name.trim() ? payload.name.trim() : payload.email.split('@')[0],
    picture: payload.picture || null,
    emailVerified: true,
  };
}

module.exports = {
  verifyGoogleIdToken,
  getOAuth2Client,
  _setGoogleClientIdForTesting,
};

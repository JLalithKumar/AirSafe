'use strict';

/**
 * utils/cookie.js — Session cookie configuration and helpers.
 *
 * Responsibilities:
 *   - Enforces HttpOnly, Secure, SameSite, path, and maxAge cookie attributes.
 *   - Ensures cookie clearing uses identical attributes for clean browser invalidation.
 */

const config = require('../config/env');

const SESSION_COOKIE_NAME = 'airsafe_session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Gets standard cookie options based on the running environment.
 * In production: secure=true, sameSite='none' (for cross-origin API/SPA setups) or 'lax'.
 * In development: secure=false, sameSite='lax'.
 *
 * @returns {import('express').CookieOptions}
 */
function getCookieOptions() {
  const isProd = config.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_MS,
  };
}

/**
 * Sets the session cookie on the response.
 *
 * @param {import('express').Response} res
 * @param {string} sessionId
 */
function setSessionCookie(res, sessionId) {
  res.cookie(SESSION_COOKIE_NAME, sessionId, getCookieOptions());
}

/**
 * Clears the session cookie on the response using matching path and flags.
 *
 * @param {import('express').Response} res
 */
function clearSessionCookie(res) {
  const options = getCookieOptions();
  delete options.maxAge;
  res.clearCookie(SESSION_COOKIE_NAME, options);
}

/**
 * Extracts the session token from request cookies.
 *
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function getSessionTokenFromRequest(req) {
  if (req.cookies && req.cookies[SESSION_COOKIE_NAME]) {
    return req.cookies[SESSION_COOKIE_NAME];
  }

  // Fallback: manual cookie header parsing if cookie-parser middleware was bypassed
  if (req.headers && req.headers.cookie) {
    const rawCookies = req.headers.cookie.split(';');
    for (const cookie of rawCookies) {
      const [name, ...rest] = cookie.trim().split('=');
      if (name === SESSION_COOKIE_NAME) {
        return decodeURIComponent(rest.join('='));
      }
    }
  }

  return null;
}

module.exports = {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_MS,
  getCookieOptions,
  setSessionCookie,
  clearSessionCookie,
  getSessionTokenFromRequest,
};

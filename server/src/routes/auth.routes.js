'use strict';

/**
 * routes/auth.routes.js — Authentication API endpoints.
 *
 * Mounted at /api/auth in app.js.
 */

const { Router } = require('express');
const {
  googleLoginHandler,
  getMeHandler,
  logoutHandler,
} = require('../controllers/auth.controller');

const router = Router();

// POST /api/auth/google — authenticate with Google ID token
router.post('/google', googleLoginHandler);

// GET /api/auth/me — retrieve authenticated user profile
router.get('/me', getMeHandler);

// POST /api/auth/logout — terminate session and clear cookie
router.post('/logout', logoutHandler);

module.exports = router;

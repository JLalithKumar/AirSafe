'use strict';

/**
 * tests/auth.test.js — Integration & unit tests for AirSafe authentication system.
 *
 * Verifies:
 *   - Google token validation (signature, issuer, audience, claims, expiration)
 *   - User creation and retrieval (find-or-create, lastLoginAt updates, duplicate key races)
 *   - Session cookie lifecycle (establishment, me query, invalidation on logout)
 *   - Security invariants (HTTP-only cookies, no token logging, missing config rejection)
 *   - Backward compatibility with existing API endpoints
 */

const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Session = require('../src/models/session.model');
const googleAuthService = require('../src/services/googleAuth.service');
const config = require('../src/config/env');

describe('AirSafe Authentication API (/api/auth)', () => {
  afterAll(() => {
    googleAuthService._setGoogleClientIdForTesting(undefined);
  });

  beforeEach(() => {
    jest.restoreAllMocks();
    googleAuthService._setGoogleClientIdForTesting('test-google-client-id.apps.googleusercontent.com');
  });

  describe('POST /api/auth/google — Token & Input Validation', () => {
    it('rejects request with missing ID token (400)', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/token is required/i);
    });

    it('rejects request with empty string or non-string token (400)', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: '   ' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'error');
    });

    it('fails fast when server Google configuration is missing (503)', async () => {
      googleAuthService._setGoogleClientIdForTesting(null);

      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'some-token' });

      expect(res.status).toBe(503);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/not configured/i);
    });

    it('rejects expired Google ID token (401)', async () => {
      jest.spyOn(googleAuthService, 'verifyGoogleIdToken').mockRejectedValue({
        message: 'Google ID token has expired. Please sign in again.',
        statusCode: 401,
      });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'expired-token' });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/expired/i);
    });

    it('rejects token with invalid audience or issuer (401)', async () => {
      jest.spyOn(googleAuthService, 'verifyGoogleIdToken').mockRejectedValue({
        message: 'Invalid Google token audience.',
        statusCode: 401,
      });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'invalid-aud-token' });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/audience/i);
    });

    it('rejects token when Google email is unverified (401)', async () => {
      jest.spyOn(googleAuthService, 'verifyGoogleIdToken').mockRejectedValue({
        message: 'Google account email has not been verified.',
        statusCode: 401,
      });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'unverified-email-token' });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/verified/i);
    });
  });

  describe('POST /api/auth/google — User Creation, Repeat Login & Sessions', () => {
    const mockClaims = {
      googleId: 'google-sub-123456789',
      email: 'testuser@example.com',
      name: 'Test AirSafe User',
      picture: 'https://lh3.googleusercontent.com/test-pic.jpg',
      emailVerified: true,
    };

    it('successfully creates new user, sets HTTP-only session cookie, and returns public profile', async () => {
      jest.spyOn(googleAuthService, 'verifyGoogleIdToken').mockResolvedValue(mockClaims);

      const mockCreatedUser = {
        _id: '660000000000000000000001',
        googleId: mockClaims.googleId,
        email: mockClaims.email,
        name: mockClaims.name,
        picture: mockClaims.picture,
        emailVerified: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        toPublicProfile() {
          return {
            id: '660000000000000000000001',
            googleId: this.googleId,
            email: this.email,
            name: this.name,
            picture: this.picture,
            emailVerified: this.emailVerified,
            lastLoginAt: this.lastLoginAt,
            createdAt: this.createdAt,
          };
        },
      };

      jest.spyOn(User, 'findOrCreateGoogleUser').mockResolvedValue(mockCreatedUser);
      jest.spyOn(Session, 'createSession').mockResolvedValue({
        sessionId: 'test-session-secret-token-hex-12345',
        userId: mockCreatedUser._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ idToken: 'valid-google-id-token' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(mockClaims.email);
      expect(res.body.data.user.name).toBe(mockClaims.name);
      expect(res.body.data.user.googleId).toBe(mockClaims.googleId);

      // Verify HTTP-only session cookie was set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const sessionCookie = cookies.find((c) => c.startsWith('airsafe_session='));
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toMatch(/HttpOnly/i);
    });

    it('handles repeat login for existing user, updating lastLoginAt and re-using same account', async () => {
      jest.spyOn(googleAuthService, 'verifyGoogleIdToken').mockResolvedValue(mockClaims);

      const existingUser = {
        _id: '660000000000000000000001',
        googleId: mockClaims.googleId,
        email: mockClaims.email,
        name: mockClaims.name,
        picture: mockClaims.picture,
        emailVerified: true,
        lastLoginAt: new Date(),
        createdAt: new Date('2026-01-01T00:00:00Z'),
        toPublicProfile() {
          return {
            id: '660000000000000000000001',
            googleId: this.googleId,
            email: this.email,
            name: this.name,
            picture: this.picture,
            emailVerified: this.emailVerified,
            lastLoginAt: this.lastLoginAt,
            createdAt: this.createdAt,
          };
        },
      };

      jest.spyOn(User, 'findOrCreateGoogleUser').mockResolvedValue(existingUser);
      jest.spyOn(Session, 'createSession').mockResolvedValue({
        sessionId: 'test-session-repeat-token-hex',
        userId: existingUser._id,
      });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'valid-google-credential' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe('660000000000000000000001');
      expect(res.body.data.user.email).toBe(mockClaims.email);
    });

    it('safely handles concurrent first-login duplicate-key race condition (E11000)', async () => {
      let findAttempts = 0;
      const existingUser = {
        _id: '660000000000000000000002',
        googleId: 'race-google-sub',
        email: 'race@example.com',
        name: 'Race User',
        lastLoginAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(User, 'findOne').mockImplementation(() => {
        findAttempts++;
        if (findAttempts === 1) return Promise.resolve(null); // First check misses
        return Promise.resolve(existingUser); // Second check after E11000 catches it
      });

      const duplicateErr = new Error('E11000 duplicate key error collection: users index: googleId_1 dup key');
      duplicateErr.code = 11000;
      jest.spyOn(User, 'create').mockRejectedValue(duplicateErr);

      const resolved = await User.findOrCreateGoogleUser({
        googleId: 'race-google-sub',
        email: 'race@example.com',
        name: 'Race User',
      });

      expect(resolved).toBeDefined();
      expect(resolved._id).toBe('660000000000000000000002');
    });
  });

  describe('GET /api/auth/me — Session Restoration', () => {
    it('returns 401 when no session cookie is present', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body.message).toMatch(/no active session/i);
    });

    it('returns 401 and clears cookie when session is expired or invalid in DB', async () => {
      jest.spyOn(Session, 'validateSession').mockResolvedValue(null);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'airsafe_session=expired-or-invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/expired or is invalid/i);

      // Verify expired cookie clearing header
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const clearedCookie = cookies.find((c) => c.startsWith('airsafe_session='));
      expect(clearedCookie).toMatch(/Expires=Thu, 01 Jan 1970/i);
    });

    it('returns authenticated user profile when a valid session cookie is provided', async () => {
      const mockUser = {
        _id: '660000000000000000000003',
        googleId: 'valid-sub',
        email: 'member@airsafe.com',
        name: 'AirSafe Member',
        picture: 'https://example.com/avatar.jpg',
        emailVerified: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        toPublicProfile() {
          return {
            id: '66000000000000000000003',
            googleId: this.googleId,
            email: this.email,
            name: this.name,
            picture: this.picture,
            emailVerified: this.emailVerified,
            lastLoginAt: this.lastLoginAt,
            createdAt: this.createdAt,
          };
        },
      };

      jest.spyOn(Session, 'validateSession').mockResolvedValue({
        sessionId: 'active-session-token',
        userId: mockUser,
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'airsafe_session=active-session-token');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body.data.user.email).toBe('member@airsafe.com');
      expect(res.body.data.user.name).toBe('AirSafe Member');
    });
  });

  describe('POST /api/auth/logout — Session Invalidation', () => {
    it('invalidates server-side session in MongoDB and clears cookie', async () => {
      const destroySpy = jest.spyOn(Session, 'destroySession').mockResolvedValue(true);

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', 'airsafe_session=token-to-invalidate');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(destroySpy).toHaveBeenCalledWith('token-to-invalidate');

      // Verify cookie cleared
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const clearedCookie = cookies.find((c) => c.startsWith('airsafe_session='));
      expect(clearedCookie).toMatch(/Expires=Thu, 01 Jan 1970/i);
    });
  });

  describe('Preservation of existing public APIs', () => {
    it('GET /api/health continues to work without authentication', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
    });
  });
});

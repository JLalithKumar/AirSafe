import apiClient from './api';

export const authService = {
  /**
   * Authenticate with Google ID token received from Google Identity Services.
   *
   * @param {string} idToken
   * @returns {Promise<object>} Public user profile
   */
  async loginWithGoogle(idToken) {
    if (!idToken || typeof idToken !== 'string') {
      throw new Error('Valid Google ID token is required.');
    }
    const response = await apiClient.post('/auth/google', { idToken });
    return response.data?.data?.user;
  },

  /**
   * Restores authenticated session profile from the HTTP-only cookie.
   *
   * @returns {Promise<object>} Public user profile
   */
  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data?.data?.user;
  },

  /**
   * Terminates active session on the backend and clears session cookie.
   *
   * @returns {Promise<void>}
   */
  async logout() {
    await apiClient.post('/auth/logout');
  },
};

export default authService;

const authService = require('./auth.service');
const { RegisterSchema, LoginSchema, QrSignupSchema, validate } = require('./auth.validator');
const { sendSuccess } = require('../../shared/utils/response');

class AuthController {
  /**
   * POST /api/v1/auth/register
   * Public User Registration
   */
  async register(req, res, next) {
    try {
      const validatedData = validate(RegisterSchema, req.body);
      const result = await authService.register(validatedData);
      return sendSuccess(res, result, 'User registered successfully!', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/qr-signup
   * QR-Code Landing Registration
   */
  async qrSignup(req, res, next) {
    try {
      const validatedData = validate(QrSignupSchema, req.body);
      const result = await authService.qrSignup(validatedData);
      return sendSuccess(res, result, 'QR Registration successful!', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/login
   * Public User Login
   */
  async login(req, res, next) {
    try {
      const validatedData = validate(LoginSchema, req.body);
      const result = await authService.login(validatedData);
      return sendSuccess(res, result, 'Login successful!', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Public User Logout
   */
  async logout(req, res, next) {
    try {
      return sendSuccess(res, null, 'Logged out successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/auth/me
   * Get Current Authenticated User Profile
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await authService.getProfile(userId);
      return sendSuccess(res, profile, 'Profile fetched successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/auth/verify-role
   * Role Verification Endpoint (for testing RBAC)
   */
  async verifyRole(req, res) {
    return sendSuccess(
      res,
      {
        userId: req.user.id,
        role: req.user.role,
        clubId: req.user.clubId,
      },
      `RBAC Verification Passed for role: ${req.user.role}`,
      200
    );
  }
}

module.exports = new AuthController();

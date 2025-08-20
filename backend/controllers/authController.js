const User = require('../models/User');
const ResponseHandler = require('../utils/responseHandler');
const { generateToken } = require('../middleware/auth');
const OTPGenerator = require('../utils/otpGenerator');
const smsService = require('../services/smsService');
const emailService = require('../services/emailService');
const crypto = require('crypto');

class AuthController {
  /**
   * Register a new user
   */
  async register(req, res) {
    try {
      const {
        userType,
        email,
        password,
        phoneNumber,
        companyName,
        landlineNumber,
        gst,
        pan,
        panName,
        contactPersonName,
        contactPersonDesignation,
        contactPersonEmail,
        contactPersonMobile,
        address,
        city,
        state,
        country,
        pincode,
        remark,
        profileImageBase64
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { phoneNumber }]
      });

      if (existingUser) {
        return ResponseHandler.conflict(res, 'User with this email or phone number already exists');
      }

      // Create user data object
      const userData = {
        userType,
        email,
        password,
        phoneNumber
      };

      // Add agent-specific fields if userType is agent
      if (userType === 'agent') {
        Object.assign(userData, {
          companyName,
          landlineNumber,
          gst,
          pan,
          panName,
          contactPersonName,
          contactPersonDesignation,
          contactPersonEmail,
          contactPersonMobile,
          address,
          city,
          state,
          country,
          pincode,
          remark,
          isActive: false,
          isApproved: false
        });
      }

      // Create new user
      const user = new User(userData);
      
      // If profile image provided, upload and store URL (handled by service)
      if (profileImageBase64) {
        try {
          const { uploadBase64Image } = require('../services/uploadService');
          const upload = await uploadBase64Image(profileImageBase64);
          if (upload?.url) user.profileImageUrl = upload.url;
        } catch (e) {
          // Non-fatal: continue without image
          console.warn('Image upload failed:', e.message);
        }
      }
      await user.save();

      // Generate OTP for phone verification
      const otp = OTPGenerator.generateOTP();
      user.phoneOtp = {
        code: otp,
        expiresAt: OTPGenerator.getOTPExpiration()
      };
      await user.save();

      // Send OTP via SMS
      await smsService.sendOTP(phoneNumber, otp);

      // Decide response for agents: pending approval
      let token;
      if (user.userType !== 'agent') {
        token = generateToken(user._id);
        user.lastLoginAt = new Date();
        await user.save();
      }

      // Prepare success message based on user type
      let successMessage = 'User registered successfully. Please verify your phone number.';
      if (userType === 'agent') {
        successMessage = `Agent registered successfully with ID: ${user.agentId}. Account pending for approval.`;
      }

      return ResponseHandler.success(res, {
        user: user.toPublicJSON(),
        ...(token ? { token } : {})
      }, successMessage, 201);

    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific agent ID generation errors
      if (error.message.includes('Unable to generate unique agent ID')) {
        return ResponseHandler.error(res, 'Registration failed: Unable to generate unique agent ID. Please try again.');
      }
      
      return ResponseHandler.error(res, 'Registration failed');
    }
  }

  /**
   * Login user (supports agent ID, email, or phone number for agents)
   */
  async login(req, res) {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return ResponseHandler.unauthorized(res, 'Please provide identifier (email/phone/agentId) and password');
      }

      // Build query to find user by email, phone, or agent ID
      let user;
      
      // Check if identifier looks like an agent ID (FD + 4 digits)
      if (/^FD\d{4}$/.test(identifier)) {
        // Search by agent ID
        user = await User.findOne({ agentId: identifier }).select('+password');
      } else if (identifier.includes('@')) {
        // Search by email
        user = await User.findOne({ email: identifier.toLowerCase() }).select('+password');
      } else {
        // Search by phone number
        user = await User.findOne({ phoneNumber: identifier }).select('+password');
      }

      if (!user) {
        return ResponseHandler.unauthorized(res, 'Invalid credentials');
      }

      // For agents, check approval status first
      if (user.userType === 'agent' && !user.isApproved) {
        return ResponseHandler.forbidden(res, 'Account pending for approval');
      }

      // Check if user is active
      if (!user.isActive) {
        return ResponseHandler.forbidden(res, 'Account is deactivated');
      }

      // Check if user is blocked
      if (user.isBlocked) {
        return ResponseHandler.forbidden(res, 'Account is blocked');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return ResponseHandler.unauthorized(res, 'Invalid credentials');
      }

      // Generate JWT token
      const token = generateToken(user._id);

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      return ResponseHandler.success(res, {
        user: user.toPublicJSON(),
        token
      }, 'Login successful');

    } catch (error) {
      console.error('Login error:', error);
      return ResponseHandler.error(res, 'Login failed');
    }
  }

  /**
   * Forgot password - send reset link via email
   */
  async forgotPassword(req, res) {
    try {
      const { identifier } = req.body;

      if (!identifier) {
        return ResponseHandler.badRequest(res, 'Please provide email, phone number, or agent ID');
      }

      // Find user by email, phone, or agent ID
      let user;
      
      if (/^FD\d{4}$/.test(identifier)) {
        // Search by agent ID
        user = await User.findOne({ agentId: identifier });
      } else if (identifier.includes('@')) {
        // Search by email
        user = await User.findOne({ email: identifier.toLowerCase() });
      } else {
        // Search by phone number
        user = await User.findOne({ phoneNumber: identifier });
      }

      if (!user) {
        return ResponseHandler.notFound(res, 'No account found with the provided information');
      }

      // Check if user is active and not blocked
      if (!user.isActive || user.isBlocked) {
        return ResponseHandler.forbidden(res, 'Account is not accessible');
      }

      // Generate password reset token
      const resetToken = user.createPasswordResetToken();
      await user.save();

      // Create reset URL
      const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

      // Send email with reset link
      try {
        await emailService.sendPasswordResetEmail(user.email, resetURL, user.companyName || user.email);
        return ResponseHandler.success(res, null, 'Password reset link sent to your email');
      } catch (emailError) {
        // Clear the token if email fails
        user.clearPasswordResetToken();
        await user.save();
        console.error('Email sending failed:', emailError);
        return ResponseHandler.error(res, 'Failed to send reset email. Please try again.');
      }

    } catch (error) {
      console.error('Forgot password error:', error);
      return ResponseHandler.error(res, 'Password reset request failed');
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return ResponseHandler.badRequest(res, 'Please provide reset token and new password');
      }

      // Hash the token to compare with stored hash
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with valid reset token
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return ResponseHandler.badRequest(res, 'Invalid or expired reset token');
      }

      // Update password
      user.password = password;
      user.clearPasswordResetToken();
      await user.save();

      return ResponseHandler.success(res, null, 'Password reset successful. You can now login with your new password');

    } catch (error) {
      console.error('Reset password error:', error);
      return ResponseHandler.error(res, 'Password reset failed');
    }
  }

  /**
   * Send OTP for phone verification
   */
  async sendOTP(req, res) {
    try {
      const { phoneNumber } = req.body;

      // Find user by phone number
      const user = await User.findOne({ phoneNumber });
      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      // Generate new OTP
      const otp = OTPGenerator.generateOTP();
      user.phoneOtp = {
        code: otp,
        expiresAt: OTPGenerator.getOTPExpiration()
      };
      await user.save();

      // Send OTP via SMS
      const smsResult = await smsService.sendOTP(phoneNumber, otp);

      if (!smsResult.success) {
        return ResponseHandler.error(res, 'Failed to send OTP');
      }

      return ResponseHandler.success(res, null, 'OTP sent successfully');

    } catch (error) {
      console.error('Send OTP error:', error);
      return ResponseHandler.error(res, 'Failed to send OTP');
    }
  }

  /**
   * Verify phone OTP
   */
  async verifyOTP(req, res) {
    try {
      const { phoneNumber, otp } = req.body;

      // Find user by phone number
      const user = await User.findOne({ phoneNumber });
      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      // Check if OTP exists and is not expired
      if (!user.phoneOtp || !user.phoneOtp.code) {
        return ResponseHandler.error(res, 'No OTP found. Please request a new one.');
      }

      if (OTPGenerator.isOTPExpired(user.phoneOtp.expiresAt)) {
        return ResponseHandler.error(res, 'OTP has expired. Please request a new one.');
      }

      // Verify OTP
      if (user.phoneOtp.code !== otp) {
        return ResponseHandler.error(res, 'Invalid OTP');
      }

      // Mark phone as verified
      user.isPhoneVerified = true;
      user.phoneOtp = undefined; // Clear OTP after successful verification
      await user.save();

      return ResponseHandler.success(res, null, 'Phone number verified successfully');

    } catch (error) {
      console.error('OTP verification error:', error);
      return ResponseHandler.error(res, 'OTP verification failed');
    }
  }

  /**
   * Change password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user._id;

      // Find user with password
      const user = await User.findById(userId).select('+password');
      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return ResponseHandler.unauthorized(res, 'Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      return ResponseHandler.success(res, null, 'Password changed successfully');

    } catch (error) {
      console.error('Change password error:', error);
      return ResponseHandler.error(res, 'Failed to change password');
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      return ResponseHandler.success(res, {
        user: user.toPublicJSON()
      }, 'Profile retrieved successfully');

    } catch (error) {
      console.error('Get profile error:', error);
      return ResponseHandler.error(res, 'Failed to get profile');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user._id;
      const updateData = { ...req.body };

      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updateData.password;
      delete updateData.userType;
      delete updateData.isActive;
      delete updateData.isBlocked;
      delete updateData.isEmailVerified;
      delete updateData.isPhoneVerified;
      delete updateData.agentId; // Prevent manual agentId updates

      // Handle profile image upload if provided as base64
      if (updateData.profileImageBase64) {
        try {
          const { uploadBase64Image } = require('../services/uploadService');
          const upload = await uploadBase64Image(updateData.profileImageBase64);
          if (upload?.url) {
            updateData.profileImageUrl = upload.url;
          }
        } catch (e) {
          console.warn('Image upload failed:', e.message);
        } finally {
          delete updateData.profileImageBase64;
        }
      }

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      return ResponseHandler.success(res, {
        user: user.toPublicJSON()
      }, 'Profile updated successfully');

    } catch (error) {
      console.error('Update profile error:', error);
      return ResponseHandler.error(res, 'Failed to update profile');
    }
  }

  /**
   * Logout (client-side token removal)
   */
  async logout(req, res) {
    try {
      // In a stateless JWT system, logout is handled client-side
      // You could implement a blacklist here if needed
      return ResponseHandler.success(res, null, 'Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      return ResponseHandler.error(res, 'Logout failed');
    }
  }
}

module.exports = new AuthController(); 
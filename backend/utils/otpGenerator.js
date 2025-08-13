/**
 * OTP generation and validation utilities
 */

class OTPGenerator {
  /**
   * Generate a random 6-digit OTP
   */
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate a random 4-digit OTP
   */
  static generateShortOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Check if OTP is expired
   */
  static isOTPExpired(expiresAt) {
    return new Date() > new Date(expiresAt);
  }

  /**
   * Set OTP expiration time (5 minutes from now)
   */
  static getOTPExpiration() {
    return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Set OTP expiration time with custom minutes
   */
  static getOTPExpirationWithMinutes(minutes) {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  /**
   * Validate OTP format (6 digits)
   */
  static validateOTPFormat(otp) {
    return /^\d{6}$/.test(otp);
  }

  /**
   * Validate short OTP format (4 digits)
   */
  static validateShortOTPFormat(otp) {
    return /^\d{4}$/.test(otp);
  }
}

module.exports = OTPGenerator; 
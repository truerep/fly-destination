const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  /**
   * Send OTP via SMS
   */
  async sendOTP(phoneNumber, otp) {
    try {
      const message = await this.client.messages.create({
        body: `Your Fly Destination verification code is: ${otp}. Valid for 5 minutes.`,
        from: this.fromNumber,
        to: phoneNumber
      });

      return {
        success: true,
        messageId: message.sid,
        status: message.status
      };
    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send welcome message
   */
  async sendWelcomeMessage(phoneNumber, userName) {
    try {
      const message = await this.client.messages.create({
        body: `Welcome to Fly Destination, ${userName}! Your account has been successfully created.`,
        from: this.fromNumber,
        to: phoneNumber
      });

      return {
        success: true,
        messageId: message.sid,
        status: message.status
      };
    } catch (error) {
      console.error('Welcome SMS error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send account status update
   */
  async sendStatusUpdate(phoneNumber, status, reason = '') {
    try {
      const message = await this.client.messages.create({
        body: `Your Fly Destination account has been ${status}. ${reason}`,
        from: this.fromNumber,
        to: phoneNumber
      });

      return {
        success: true,
        messageId: message.sid,
        status: message.status
      };
    } catch (error) {
      console.error('Status update SMS error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new SMSService(); 
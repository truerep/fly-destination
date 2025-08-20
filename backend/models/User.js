const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // User Type and Status
  userType: {
    type: String,
    enum: ['agent', 'customer', 'admin'],
    required: true,
    default: 'customer'
  },
  // Approval status for agents
  isApproved: {
    type: Boolean,
    default: function() { return this.userType !== 'agent'; }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },

  // Agent ID (auto-generated for agents)
  agentId: {
    type: String,
    unique: true,
    sparse: true, // Allows null/undefined values for non-agents
    validate: {
      validator: function(v) {
        if (this.userType === 'agent') {
          return v && /^FD\d{4}$/.test(v);
        }
        return true; // Non-agents don't need agentId
      },
      message: 'Agent ID must be in format FD followed by 4 digits (e.g., FD8930)'
    }
  },

  // Authentication
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },

  // Company Basic Information (for agents)
  companyName: {
    type: String,
    required: function() { return this.userType === 'agent'; }
  },

  // Profile image URL
  profileImageUrl: {
    type: String
  },
  landlineNumber: {
    type: String
  },

  // Tax Information (for agents)
  gst: {
    type: String,
    required: function() { return this.userType === 'agent'; }
  },
  pan: {
    type: String,
    required: function() { return this.userType === 'agent'; }
  },
  panName: {
    type: String,
    required: function() { return this.userType === 'agent'; }
  },

  // Contact Information
  contactPersonName: {
    type: String,
    required: function() { return this.userType === 'agent'; }
  },
  contactPersonDesignation: {
    type: String,
    required: function() { return this.userType === 'agent'; }
  },
  contactPersonEmail: {
    type: String,
    required: function() { return this.userType === 'agent'; }
  },
  contactPersonMobile: {
    type: String,
    required: function() { return this.userType === 'agent'; }
  },

  // Address Information
  address: {
    type: String,
    required: function() { return this.userType === 'agent'; }
  },
  city: {
    type: String,
    required: function() { return this.userType === 'agent'; }
  },
  state: {
    type: String,
    required: function() { return this.userType === 'agent'; }
  },
  country: {
    type: String,
    required: function() { return this.userType === 'agent'; }
  },
  pincode: {
    type: String,
    required: function() { return this.userType === 'agent'; }
  },

  // Additional Information
  remark: {
    type: String
  },

  // Finance (for agents)
  totalCreditLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  availableCreditLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  markerAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Balance due (receivable) for agents
  balanceDue: {
    type: Number,
    default: 0
  },

  // OTP and Verification
  phoneOtp: {
    code: String,
    expiresAt: Date
  },
  emailOtp: {
    code: String,
    expiresAt: Date
  },

  // Password reset
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  },

  // Timestamps
  lastLoginAt: {
    type: Date
  },
  passwordChangedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isBlocked: 1 });
userSchema.index({ isApproved: 1 });
userSchema.index({ agentId: 1 });
userSchema.index({ totalCreditLimit: 1 });
userSchema.index({ availableCreditLimit: 1 });
userSchema.index({ balanceDue: 1 });

// Pre-save middleware to hash password and generate agentId
userSchema.pre('save', async function(next) {
  try {
    // Hash password if modified
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
      this.passwordChangedAt = new Date();
    }

    // Generate agentId for new agents
    if (this.userType === 'agent' && !this.agentId && this.isNew) {
      this.agentId = await this.constructor.generateAgentId();
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Static method to generate unique agent ID
userSchema.statics.generateAgentId = async function() {
  let agentId;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    // Generate random 4-digit number
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    agentId = `FD${randomDigits}`;

    // Check if agentId already exists
    const existingUser = await this.findOne({ agentId });
    if (!existingUser) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Unable to generate unique agent ID after multiple attempts');
  }

  return agentId;
};

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Instance method to clear password reset token
userSchema.methods.clearPasswordResetToken = function() {
  this.passwordResetToken = undefined;
  this.passwordResetExpires = undefined;
};

// Method to get public profile (without sensitive data)
userSchema.methods.toPublicJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.phoneOtp;
  delete userObject.emailOtp;
  return userObject;
};

module.exports = mongoose.model('User', userSchema); 
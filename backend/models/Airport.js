const mongoose = require('mongoose');

const airportSchema = new mongoose.Schema({
  // Airport Code (IATA code - 3 letters)
  airportCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[A-Z]{3}$/.test(v);
      },
      message: 'Airport code must be exactly 3 uppercase letters (e.g., DEL, BOM, JFK)'
    }
  },

  // Airport Name
  airportName: {
    type: String,
    required: true,
    trim: true
  },

  // City
  city: {
    type: String,
    required: true,
    trim: true
  },

  // Country
  country: {
    type: String,
    required: true,
    trim: true
  },

  // State/Province (optional)
  state: {
    type: String,
    trim: true
  },

  // Timezone
  timezone: {
    type: String,
    default: 'UTC'
  },

  // Latitude
  latitude: {
    type: Number,
    validate: {
      validator: function(v) {
        return v >= -90 && v <= 90;
      },
      message: 'Latitude must be between -90 and 90 degrees'
    }
  },

  // Longitude
  longitude: {
    type: Number,
    validate: {
      validator: function(v) {
        return v >= -180 && v <= 180;
      },
      message: 'Longitude must be between -180 and 180 degrees'
    }
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Description (optional)
  description: {
    type: String,
    trim: true
  },

  // Created by admin
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Updated by admin
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
airportSchema.index({ airportCode: 1 });
airportSchema.index({ airportName: 1 });
airportSchema.index({ city: 1 });
airportSchema.index({ country: 1 });
airportSchema.index({ isActive: 1 });

// Compound index for search
airportSchema.index({ 
  airportCode: 'text', 
  airportName: 'text', 
  city: 'text', 
  country: 'text' 
});

// Pre-save middleware to ensure airport code is uppercase
airportSchema.pre('save', function(next) {
  if (this.airportCode) {
    this.airportCode = this.airportCode.toUpperCase();
  }
  next();
});

// Instance method to get full location
airportSchema.methods.getFullLocation = function() {
  const parts = [this.city];
  if (this.state) parts.push(this.state);
  parts.push(this.country);
  return parts.join(', ');
};

// Static method to search airports
airportSchema.statics.searchAirports = function(query, options = {}) {
  const { page = 1, limit = 10, isActive = true } = options;
  const skip = (page - 1) * limit;

  const filter = { isActive };
  
  if (query) {
    filter.$or = [
      { airportCode: { $regex: query, $options: 'i' } },
      { airportName: { $regex: query, $options: 'i' } },
      { city: { $regex: query, $options: 'i' } },
      { country: { $regex: query, $options: 'i' } }
    ];
  }

  return this.find(filter)
    .populate('createdBy', 'email userType')
    .populate('updatedBy', 'email userType')
    .sort({ airportCode: 1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Airport', airportSchema); 
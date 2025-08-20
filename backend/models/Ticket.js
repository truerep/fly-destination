const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  // Route
  fromAirport: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 3
  },
  toAirport: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 3
  },

  // Flight details
  airline: {
    type: String,
    required: true,
    trim: true
  },
  flightNumber: {
    type: String,
    required: true,
    trim: true
  },
  pnr: {
    type: String,
    trim: true
  },

  // Timing
  departureTime: {
    type: Date,
    required: true
  },
  arrivalTime: {
    type: Date,
    required: true
  },

  // Pricing and inventory
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  infantPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  // New: tracked booked seats (for reporting and admin constraints)
  quantityBooked: {
    type: Number,
    min: 0,
    default: 0
  },
  quantityTotal: {
    type: Number,
    required: true,
    min: 0
  },
  quantityAvailable: {
    type: Number,
    required: true,
    min: 0
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Baggage weight limits (in kg)
  cabinBagWeight: {
    type: Number,
    min: 0,
    default: 7
  },
  checkinBagWeight: {
    type: Number,
    min: 0,
    default: 15
  },
  infantCabinBagWeight: {
    type: Number,
    min: 0,
    default: 7
  },
  infantCheckinBagWeight: {
    type: Number,
    min: 0,
    default: 0
  },

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
ticketSchema.index({ fromAirport: 1, toAirport: 1, departureTime: 1, isActive: 1 });
ticketSchema.index({ airline: 1, flightNumber: 1 });
ticketSchema.index({ pnr: 1 });

// Ensure available equals total on create if not explicitly set
ticketSchema.pre('validate', function(next) {
  if (this.isNew && (this.quantityAvailable === undefined || this.quantityAvailable === null)) {
    this.quantityAvailable = this.quantityTotal;
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);



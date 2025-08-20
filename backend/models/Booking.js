const mongoose = require('mongoose');

// Adult/Child passenger schema
const passengerSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  salutation: { type: String, enum: ['Mr', 'Ms', 'Mrs'], required: true },
  type: { type: String, enum: ['adult', 'child'], default: 'adult' },
  dateOfBirth: { type: Date },
  passportNumber: { type: String, trim: true },
}, { _id: false });

// Infant passenger schema (details were previously only a count)
const infantPassengerSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  salutation: { type: String, enum: ['Mstr', 'Miss'], required: true },
  dateOfBirth: { type: Date, required: true },
}, { _id: false });

const nameChangeRequestSchema = new mongoose.Schema({
  requested: { type: Boolean, default: false },
  requestedAt: { type: Date },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  processedAt: { type: Date },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: { type: String, trim: true }
}, { _id: false });

// New multi-request schema (each request keeps before/after names)
const nameChangeEntrySchema = new mongoose.Schema({
  previousPassengers: { type: [passengerSchema], default: [] },
  newPassengers: { type: [passengerSchema], default: [] },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedAt: { type: Date },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: { type: String, trim: true }
}, { _id: true });

const bookingSchema = new mongoose.Schema({
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Airport city information (stored at booking time)
  fromAirportCity: { type: String, trim: true },
  toAirportCity: { type: String, trim: true },

  // Quantities and pricing
  quantity: { type: Number, required: true, min: 1 },
  // Keep infants count for compatibility, but derive from infantPassengers when saving
  infants: { type: Number, default: 0, min: 0 },
  unitBasePrice: { type: Number, required: true, min: 0 },
  unitMarkup: { type: Number, required: true, min: 0, default: 0 },
  unitSellingPrice: { type: Number, required: true, min: 0 },
  totalBasePrice: { type: Number, required: true, min: 0 },
  totalMarkup: { type: Number, required: true, min: 0, default: 0 },
  totalSellingPrice: { type: Number, required: true, min: 0 },
  
  // Promo code information
  promoCode: { type: String, trim: true },
  promoDiscount: { type: Number, default: 0, min: 0 },

  // Passengers
  passengers: { type: [passengerSchema], default: [] },
  infantPassengers: { type: [infantPassengerSchema], default: [] },

  // Status
  status: { type: String, enum: ['booked', 'cancelled'], default: 'booked' },

  // Reference
  reference: { type: String, required: true, unique: true },
  // PNR copied from ticket at time of booking
  pnr: { type: String, trim: true },

  // Name change request
  nameChangeRequest: { type: nameChangeRequestSchema, default: () => ({}) },
  // New: allow multiple name change requests
  nameChangeRequests: { type: [nameChangeEntrySchema], default: [] },

  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

bookingSchema.index({ agent: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);



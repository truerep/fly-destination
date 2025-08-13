const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  type: { type: String, enum: ['adult', 'child'], default: 'adult' },
  dateOfBirth: { type: Date },
  passportNumber: { type: String, trim: true },
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

const bookingSchema = new mongoose.Schema({
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Quantities and pricing
  quantity: { type: Number, required: true, min: 1 },
  infants: { type: Number, default: 0, min: 0 },
  unitBasePrice: { type: Number, required: true, min: 0 },
  unitSellingPrice: { type: Number, required: true, min: 0 },
  totalBasePrice: { type: Number, required: true, min: 0 },
  totalSellingPrice: { type: Number, required: true, min: 0 },

  // Passengers
  passengers: { type: [passengerSchema], default: [] },

  // Status
  status: { type: String, enum: ['booked', 'cancelled'], default: 'booked' },

  // Reference
  reference: { type: String, required: true, unique: true },

  // Name change request
  nameChangeRequest: { type: nameChangeRequestSchema, default: () => ({}) },

  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

bookingSchema.index({ agent: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);



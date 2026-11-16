const createModel = require('./modelFactory');

const passwordRequestSchema = {
  requestId: { type: String, required: true, unique: true },
  user: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  identifier: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher'], required: true },
  department: { type: String, default: 'Computer Science & Engineering' },
  reason: { type: String, default: 'Institutional Security Credential Update' },
  status: { type: String, enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED'], default: 'PENDING_APPROVAL' },
  authorizationCode: { type: String, default: '' },
  requestedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  approvedBy: { type: String, default: '' },
  notes: { type: String, default: '' }
};

module.exports = createModel('PasswordRequest', passwordRequestSchema);

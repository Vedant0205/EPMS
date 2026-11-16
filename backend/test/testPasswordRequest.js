const { connectDB } = require('../config/db');
const User = require('../models/User');
const PasswordRequest = require('../models/PasswordRequest');
const authController = require('../controllers/authController');
const bcrypt = require('bcryptjs');

async function testPasswordWorkflow() {
  console.log('Testing Institutional Password Change Request Workflow...');
  await connectDB();

  const student = await User.findOne({ role: 'student' });
  const teacher = await User.findOne({ role: 'teacher' });

  if (!student || !teacher) {
    throw new Error('Test fixtures missing.');
  }

  console.log(`Found student: ${student.name} (${student.email})`);
  console.log(`Found faculty: ${teacher.name}`);

  // Mock Express Request & Response helper
  const createMockRes = () => {
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
    return res;
  };

  // Step 1: Submit Password Change Request
  console.log('1. Submitting password change request...');
  const req1 = {
    body: {
      email: student.email,
      reason: 'Routine quarterly security credential renewal'
    }
  };
  const res1 = createMockRes();
  await authController.requestPasswordChange(req1, res1);

  if (res1.statusCode !== 201 || !res1.body.requestId) {
    throw new Error('Step 1 Failed: Request submission did not return 201 with requestId.');
  }
  const ticketId = res1.body.requestId;
  console.log(`   ✓ Request logged with Ticket ID: ${ticketId}`);

  // Step 2: Attempt completion while still PENDING (should fail)
  console.log('2. Attempting premature password update before approval...');
  const req2 = {
    body: {
      requestId: ticketId,
      authorizationCode: 'WRONG-CODE',
      newPassword: 'BrandNewSecurePassword123!',
      confirmPassword: 'BrandNewSecurePassword123!'
    }
  };
  const res2 = createMockRes();
  await authController.completePasswordChange(req2, res2);

  if (res2.statusCode !== 403) {
    throw new Error('Step 2 Failed: Unapproved request was not blocked with 403.');
  }
  console.log('   ✓ Blocked premature change with status 403 (Pending Approval).');

  // Step 3: Faculty / Department Head approves request
  console.log('3. Department Head / Faculty approves request...');
  const req3 = {
    params: { id: ticketId },
    user: { id: String(teacher._id), name: teacher.name, role: 'teacher' }
  };
  const res3 = createMockRes();
  await authController.approvePasswordRequest(req3, res3);

  if (res3.statusCode !== 200 || !res3.body.authorizationCode) {
    throw new Error('Step 3 Failed: Request approval did not return authorization code.');
  }
  const authCode = res3.body.authorizationCode;
  console.log(`   ✓ Request approved. Generated Authorization Code: ${authCode}`);

  // Step 4: Finalize password change with correct authorization code
  console.log('4. Completing password change with authorization code...');
  const req4 = {
    body: {
      requestId: ticketId,
      authorizationCode: authCode,
      newPassword: 'BrandNewSecurePassword123!',
      confirmPassword: 'BrandNewSecurePassword123!'
    }
  };
  const res4 = createMockRes();
  await authController.completePasswordChange(req4, res4);

  if (res4.statusCode !== 200 || !res4.body.success) {
    throw new Error('Step 4 Failed: Could not complete password update.');
  }
  console.log('   ✓ Password change completed successfully.');

  // Step 5: Verify login with new password
  console.log('5. Verifying login with newly set password...');
  const req5 = {
    body: {
      email: student.email,
      password: 'BrandNewSecurePassword123!'
    }
  };
  const res5 = createMockRes();
  await authController.login(req5, res5);

  if (res5.statusCode !== 200 || !res5.body.token) {
    throw new Error('Step 5 Failed: Login with new password failed.');
  }
  console.log(`   ✓ Login verified for ${student.name} with new password!`);

  // Restore student password back to standard password ($2b$10$Wscg95yAqS2M/zam0tx2FudgUjzHOU6mAN5gT5TqliiSAVrPCqtvS = password123)
  const defaultHash = '$2b$10$Wscg95yAqS2M/zam0tx2FudgUjzHOU6mAN5gT5TqliiSAVrPCqtvS';
  await User.findByIdAndUpdate(student._id, { password: defaultHash });
  console.log('   ✓ Restored student test password to default.');

  console.log('All 5 Password Request Workflow Tests Passed Perfectly!');
}

testPasswordWorkflow().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});

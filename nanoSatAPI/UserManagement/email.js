function sendVerificationEmail({ email, verifyUrl }) {
  // TODO: Replace with real email provider integration.
  console.log(`[email] Verification email to ${email}: ${verifyUrl}`);
}

function sendPasswordResetEmail({ email, resetUrl }) {
  // TODO: Replace with real email provider integration.
  console.log(`[email] Password reset email to ${email}: ${resetUrl}`);
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};

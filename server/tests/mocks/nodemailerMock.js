// server/tests/mocks/nodemailerMock.js
// Simple mock for nodemailer to capture sent emails during tests

let sentMails = [];

function reset() {
  sentMails = [];
}

function getSentMails() {
  return sentMails.slice();
}

// Mock transporter
function createTransport() {
  return {
    sendMail: (mailOptions) => {
      // Record the email options for assertions
      sentMails.push(mailOptions);
      // Simulate async sending returning a result similar to nodemailer
      return Promise.resolve({
        accepted: [mailOptions.to],
        rejected: [],
        response: '250 OK: Message accepted',
        messageId: mailOptions.messageId || '<test-message-id>'
      });
    }
  };
}

module.exports = {
  createTransport,
  reset,
  getSentMails,
};

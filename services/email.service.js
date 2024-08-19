const postmark = require('postmark');
const config = require('./config');

const client = new postmark.ServerClient(config.POSTMARK_API_TOKEN);

async function sendEmail(subject, text) {
    try {
        await client.sendEmail({
            From: config.SENDER_EMAIL,
            To: config.EMAIL,
            Subject: subject,
            TextBody: text,
        });
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

module.exports = {
    sendEmail,
};
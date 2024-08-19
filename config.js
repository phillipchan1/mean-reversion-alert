// src/config.js
module.exports = {
    RSI_PERIOD: 14,
    EMA_PERIOD: 21, // EMA period for Keltner Channel
    ATR_PERIOD: 10, // ATR period for Keltner Channel
    KELTNER_MULTIPLIER: 2.0,
    TIME_INTERVALS: ['60min', 'daily'], // 1-hour and daily
    MAX_SYMBOLS_PER_MINUTE: 18, // Max symbols to process per minute
    EMAIL: 'phillipchan1@gmail.com',
    CHECK_INTERVAL: 30 * 60 * 1000, // Check stocks every 30 minutes (in milliseconds)
    POSTMARK_API_TOKEN: '297f46e1-e125-496d-b051-145dbcd88783', // Replace with your actual Postmark API token
    SENDER_EMAIL: 'phil.chan@sce.com', // Replace with your verified Postmark sender email
};
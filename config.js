require('dotenv').config(); // Load variables from .env

module.exports = {
    RSI_PERIOD: 14,
    EMA_PERIOD: 21, // EMA period for Keltner Channel
    ATR_PERIOD: 10, // ATR period for Keltner Channel
    KELTNER_MULTIPLIER: 2.0,
    TIME_INTERVALS: ['60min', 'daily'], // 1-hour and daily
    MAX_SYMBOLS_PER_MINUTE: 18, // Max symbols to process per minute
    EMAIL: process.env.EMAIL, // Loaded from .env
    CHECK_INTERVAL: 30 * 60 * 1000, // Check stocks every 30 minutes (in milliseconds)
    POSTMARK_API_TOKEN: process.env.POSTMARK_API_TOKEN, // Loaded from .env
    SENDER_EMAIL: process.env.SENDER_EMAIL, // Loaded from .env
};
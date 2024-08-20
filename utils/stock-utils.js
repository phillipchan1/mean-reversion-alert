function calculateEMA(prices, period) {
    const k = 2 / (period + 1);
    let emaArray = [];
    let ema = prices[0];

    for (let i = 0; i < prices.length; i++) {
        ema = prices[i] * k + ema * (1 - k);
        emaArray.push(ema);
    }

    return emaArray;
}

function determineTrend(dailyPrices) {
    const closePrices = Object.values(dailyPrices).map((entry) => parseFloat(entry['4. close']));
    const sma50 = calculateEMA(closePrices, 50);
    const sma200 = calculateEMA(closePrices, 200);

    const latestSMA50 = sma50[sma50.length - 1];
    const latestSMA200 = sma200[sma200.length - 1];

    if (latestSMA50 > latestSMA200) {
        return 'uptrend';
    } else if (latestSMA50 < latestSMA200) {
        return 'downtrend';
    } else {
        return 'neutral';
    }
}

function isMarketOpen() {
    const now = new Date();
    const currentHour = now.getUTCHours(); // Get current hour in UTC
    const currentMinute = now.getUTCMinutes(); // Get current minute in UTC

    // Convert market open/close times to UTC (PST is UTC-8, PDT is UTC-7)
    const marketOpenHour = 13; // 6:30 AM PST = 1:30 PM UTC
    const marketOpenMinute = 30; // 6:30 AM
    const marketCloseHour = 20; // 1:00 PM PST = 8:00 PM UTC
    const marketCloseMinute = 0; // 1:00 PM

    if (
        (currentHour > marketOpenHour || (currentHour === marketOpenHour && currentMinute >= marketOpenMinute)) &&
        (currentHour < marketCloseHour || (currentHour === marketCloseHour && currentMinute < marketCloseMinute))
    ) {
        return true;
    }

    return false;
}

module.exports = {
    isMarketOpen,
    calculateEMA,
    determineTrend,
};

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

module.exports = {
    calculateEMA,
    determineTrend
};
const watchlist = require('./watchlist');
const { getRSIData, getATRData, getDailyStockData, getStockData } = require('./services/alpha-vantage.service');
const { calculateEMA, determineTrend } = require('./utils/stock-utils');
const { sendEmail } = require('./services/email.service');
const { hasArrayChanged } = require('./state-manager');
const http = require('http');
// const config = require('./config');

const { RSI_PERIOD, EMA_PERIOD, ATR_PERIOD, KELTNER_MULTIPLIER, TIME_INTERVALS, MAX_SYMBOLS_PER_MINUTE, CHECK_INTERVAL } = require('./config');

async function getKeltnerChannel(symbol, interval, ema_period, atr_period) {
    const prices = await getStockData(symbol, interval);
    const atrData = await getATRData(symbol, interval, atr_period);

    if (!prices || !atrData) return null;

    const closePrices = Object.values(prices).map((entry) => parseFloat(entry['4. close']));
    const atrValues = Object.values(atrData).map((entry) => parseFloat(entry['ATR']));

    const middleLine = calculateEMA(closePrices, ema_period);
    const upperBand = middleLine.map((ema, index) => ema + KELTNER_MULTIPLIER * atrValues[index]);
    const lowerBand = middleLine.map((ema, index) => ema - KELTNER_MULTIPLIER * atrValues[index]);

    return { middleLine, upperBand, lowerBand };
}

async function evaluateConditions(symbol, interval1, interval4) {
    const rsi1Hour = await getRSIData(symbol, interval1, RSI_PERIOD, 'close');
    const rsi4Hour = await getRSIData(symbol, interval4, RSI_PERIOD, 'close');
    const keltnerChannel1Hour = await getKeltnerChannel(symbol, interval1, EMA_PERIOD, ATR_PERIOD);
    const dailyData = await getDailyStockData(symbol);

    if (!rsi1Hour || !rsi4Hour || !keltnerChannel1Hour || !dailyData) {
        console.log(`Skipping ${symbol} due to missing data.`);
        return null;
    }

    const trend = determineTrend(dailyData);
    const rsi1 = parseFloat(Object.values(rsi1Hour).pop().RSI);
    const rsi4 = parseFloat(Object.values(rsi4Hour).pop().RSI);
    const keltnerValue = parseFloat(Object.values(keltnerChannel1Hour.lowerBand).pop());

    if (trend === 'uptrend' && rsi1 < 30 && rsi4 < 30 && keltnerValue < -2.0) {
        return 'bull';
    } else if (trend === 'downtrend' && rsi1 > 70 && rsi4 > 70 && keltnerValue > 2.0) {
        return 'bear';
    }

    return null;
}

async function checkStocks() {
    const qualifyingStocks = [];
    for (let i = 0; i < watchlist.length; i += MAX_SYMBOLS_PER_MINUTE) {
        const batch = watchlist.slice(i, i + MAX_SYMBOLS_PER_MINUTE);
        const promises = batch.map(symbol => evaluateConditions(symbol, TIME_INTERVALS[0], TIME_INTERVALS[1]));
        const results = await Promise.all(promises);

        results.forEach((result, index) => {
            if (result) {
                const trend = result === 'bull' ? 'uptrend' : 'downtrend';
                qualifyingStocks.push({ symbol: batch[index], trend, condition: result });
            }
        });

        if (i + MAX_SYMBOLS_PER_MINUTE < watchlist.length) {
            await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
        }
    }

    console.log('Qualifying stocks:', qualifyingStocks);

    if (hasArrayChanged(qualifyingStocks)) {
        await sendEmail(
            'Qualifying Stocks Update',
            `The following stocks meet your criteria:\n\n${JSON.stringify(qualifyingStocks, null, 2)}`
        );
    } else {
        console.log('No change in qualifying stocks; email not sent.');
    }
}

function startStockCheckInterval() {
    checkStocks();
    setInterval(checkStocks, CHECK_INTERVAL);
}

const port = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('The mean-reversion-alerter app is running\n');
});

server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
    startStockCheckInterval();
});
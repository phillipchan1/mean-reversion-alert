const API_KEY = '3UEMP1MCA2F5C6OK'; // Replace with your actual premium API key
const axios = require('axios');
const watchlist = require('./watchlist');

const RSI_PERIOD = 14;
const EMA_PERIOD = 21; // EMA period for Keltner Channel
const ATR_PERIOD = 10; // ATR period for Keltner Channel
const KELTNER_MULTIPLIER = 2.0;
const TIME_INTERVALS = ['60min', 'daily']; // 1-hour and 4-hour

const MAX_SYMBOLS_PER_MINUTE = 18; // We calculated this as the max symbols to process per minute

async function getRSIData(symbol, interval, time_period, series_type) {
    const url = `https://www.alphavantage.co/query?function=RSI&symbol=${symbol}&interval=${interval}&time_period=${time_period}&series_type=${series_type}&entitlement=delayed&apikey=${API_KEY}`;

    try {
        const response = await axios.get(url);
        if (response.status === 200) {
            return response.data['Technical Analysis: RSI'] || null;
        } else {
            console.error(`Error: Received status code ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching RSI data for ${symbol}:`, error.message);
        return null;
    }
}

async function getATRData(symbol, interval, time_period) {
    const url = `https://www.alphavantage.co/query?function=ATR&symbol=${symbol}&interval=${interval}&time_period=${time_period}&entitlement=delayed&apikey=${API_KEY}`;

    try {
        const response = await axios.get(url);
        if (response.status === 200) {
            return response.data['Technical Analysis: ATR'] || null;
        } else {
            console.error(`Error: Received status code ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching ATR data for ${symbol}:`, error.message);
        return null;
    }
}

async function getDailyStockData(symbol) {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&entitlement=delayed&apikey=${API_KEY}`;

    try {
        const response = await axios.get(url);
        if (response.status === 200) {
            return response.data['Time Series (Daily)'] || null;
        } else {
            console.error(`Error: Received status code ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching daily stock data for ${symbol}:`, error.message);
        return null;
    }
}

// Function to calculate EMA (Exponential Moving Average)
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

// Function to calculate Keltner Channel
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

// Function to get stock data (for calculating EMA)
async function getStockData(symbol, interval) {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&entitlement=delayed&apikey=${API_KEY}`;

    try {
        const response = await axios.get(url);
        if (response.status === 200) {
            const data = response.data[`Time Series (${interval})`];
            if (data) {
                return data;
            } else {
                console.error(`No data found for ${symbol} with interval ${interval}`);
                return null;
            }
        } else {
            console.error(`Error: Received status code ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching stock data for ${symbol} (${interval}):`, error.message);
        return null;
    }
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
}

// Start the stock checking process
checkStocks();
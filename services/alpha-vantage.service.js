// src/alphavantage.js
const axios = require('axios');
const API_KEY = '3UEMP1MCA2F5C6OK'; // Replace with your actual premium API key

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

module.exports = {
    getRSIData,
    getATRData,
    getDailyStockData,
    getStockData
};
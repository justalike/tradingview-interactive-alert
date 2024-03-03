// Assuming Lightweight Charts is already set up
import chart from './index.js';
import candleSeries from './index.js';

// Function to parse query parameters


// Establish WebSocket Connection based on URL parameters
export function connectWebSocket() {

    function getQueryParams() {
        const queryParams = new URLSearchParams(window.location.search);
        return {
            symbol: queryParams.get('symbol'),
            timeframe: queryParams.get('timeframe'),
        };
    }
    
    // Function to format symbol for Binance WebSocket
    function formatSymbol(symbol) {
        return symbol.replace('/', '').toLowerCase();
    }
    const { symbol, timeframe } = getQueryParams();
    if (!symbol || !timeframe) {
        console.error('Symbol or timeframe missing in URL');
        return;
    }

    const formattedSymbol = formatSymbol(symbol);
    const wsUrl = `wss://stream.binance.com:9443/ws/${formattedSymbol}@kline_${timeframe}`;

    const binanceWs = new WebSocket(wsUrl);

    binanceWs.onmessage = (event) => {
        const message = JSON.parse(event.data);

        const candle = message.k;
        const candlestickData = {
            time: candle.t / 1000, // Convert timestamp from ms to s
            open: parseFloat(candle.o),
            high: parseFloat(candle.h),
            low: parseFloat(candle.l),
            close: parseFloat(candle.c),
        };

        candleSeries.update(candlestickData);
    };

    binanceWs.onopen = () => {
        console.log('Connected to Binance WebSocket for', symbol, 'with timeframe', timeframe);
    };

    binanceWs.onerror = (error) => {
        console.error('WebSocket Error:', error);
    };
}

// Call the function to connect to the WebSocket
connectWebSocket();

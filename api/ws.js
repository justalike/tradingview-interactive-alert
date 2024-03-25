import { getQueryParams, updateOne } from '../utils/utils.js';


export async function connectWebSocket(series) {
    
    const { candles_series, volume_series} = series;
    function formatSymbol(symbol) {
        return symbol.replace('/', '').toLowerCase();
    }
    const { symbol, timeframe } = await getQueryParams();
    if (!symbol || !timeframe) {
        console.error('Symbol or timeframe missing in URL');
        return;
    }

    const formattedSymbol = formatSymbol(symbol);
    const wsUrl = `wss://stream.binance.com:9443/ws/${formattedSymbol}@kline_${timeframe}`;

    const binanceWs = new WebSocket(wsUrl);


    binanceWs.onmessage = (event) => {
        const message = JSON.parse(event.data);

        const candle = message.k; //kline
        const candlestickData = {
            time: candle.t / 1000, // Convert ms to s to draw candles in the chart
            open: parseFloat(candle.o),
            high: parseFloat(candle.h),
            low: parseFloat(candle.l),
            close: parseFloat(candle.c),
        };
        const volumeData = {
            time: candle.t / 1000, // Convert ms to s to draw candles in the chart
            value: parseFloat(candle.v),
        };

        updateOne(candles_series, candlestickData);
        updateOne(volume_series, volumeData)
    };

    binanceWs.onopen = () => {
        console.log('Connected to Binance WebSocket for', symbol, 'with timeframe', timeframe);
    };
    binanceWs.onclose = () => {
        console.log('Disconnected from Binance WebSocket for', symbol, 'with timeframe', timeframe);
    };

    binanceWs.onerror = (error) => {
        console.error('WebSocket Error:', error);
    };
}



import { calculateCurrentPrice } from '../crypto/mining.js';

let chartCanvas = null;
let ctx = null;
const candleHistory = []; // Speichert die errechneten Kerzen-Daten

export function initTradingChart(canvasId) {
    chartCanvas = document.getElementById(canvasId);
    if (!chartCanvas) return;

    ctx = chartCanvas.getContext('2d');
    
    // Skaliere Canvas an die Display-Größe des Handys an
    resizeCanvas();
    
    // Initialisiere erste historische Kerze (Genesis Outbreak)
    let startPrice = calculateCurrentPrice();
    candleHistory.push({
        open: startPrice * 0.9,
        close: startPrice,
        high: startPrice * 1.05,
        low: startPrice * 0.85
    });

    // Endlos-Schleife zur optischen Taktung des Charts
    setInterval(() => {
        pushNewGreenCandle();
        renderChart();
    }, 3000);
}

function resizeCanvas() {
    if (!chartCanvas) return;
    const rect = chartCanvas.parentElement.getBoundingClientRect();
    chartCanvas.width = rect.width;
    chartCanvas.height = rect.height;
}

/**
 * Garantiert systemisch: Jede neue Kerze schließt HÖHER als sie öffnet (Nur grüne Candles)
 */
export function pushNewGreenCandle() {
    const currentBasePrice = calculateCurrentPrice();
    const lastCandle = candleHistory[candleHistory.length - 1];

    // Jede neue Kerze baut zwingend auf dem Schlusskurs der letzten auf
    const open = lastCandle ? lastCandle.close : currentBasePrice;
    
    // Wachstumsimpuls sorgt für permanenten, mathematisch ununterbrochenen Kursanstieg
    const growthImpulse = (Math.random() * 2.5) + 0.1; 
    const close = open + growthImpulse;
    
    const low = open - (Math.random() * 0.2);
    const high = close + (Math.random() * 0.8);

    candleHistory.push({ open, close, high, low });

    // Begrenze Daten-Array auf dem Smartphone, um den Arbeitsspeicher (RAM) nicht zu überlasten
    if (candleHistory.length > 25) {
        candleHistory.shift();
    }
}

/**
 * Zeichnet das exponentielle Verlaufsdiagramm auf den Smartphone-Bildschirm
 */
export function renderChart() {
    if (!ctx || !chartCanvas) return;

    ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);

    const padding = 15;
    const chartWidth = chartCanvas.width - (padding * 2);
    const chartHeight = chartCanvas.height - (padding * 2);
    const totalCandles = candleHistory.length;
    const candleWidth = chartWidth / totalCandles;

    // Finde Min/Max Werte für die vertikale Skalierung
    let globalMin = Math.min(...candleHistory.map(c => c.low));
    let globalMax = Math.max(...candleHistory.map(c => c.high));
    if (globalMax === globalMin) globalMax += 1;

    // Gitterlinien im Hintergrund zeichnen (Matrix Style)
    ctx.strokeStyle = '#0a1a0a';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
        let y = padding + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(chartCanvas.width - padding, y);
        ctx.stroke();
    }

    // Zeichne jede einzelne Kerze (Ausschließlich in Matrix-Grün)
    candleHistory.forEach((candle, index) => {
        const x = padding + (index * candleWidth) + (candleWidth * 0.1);
        const w = candleWidth * 0.8;

        // Proportionale y-Koordinaten berechnen
        const yOpen = chartCanvas.height - padding - ((candle.open - globalMin) / (globalMax - globalMin) * chartHeight);
        const yClose = chartCanvas.height - padding - ((candle.close - globalMin) / (globalMax - globalMin) * chartHeight);
        const yHigh = chartCanvas.height - padding - ((candle.high - globalMin) / (globalMax - globalMin) * chartHeight);
        const yLow = chartCanvas.height - padding - ((candle.low - globalMin) / (globalMax - globalMin) * chartHeight);

        // 1. Zeichne den Docht (High/Low)
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, yHigh);
        ctx.lineTo(x + w / 2, yLow);
        ctx.stroke();

        // 2. Zeichne den Kerzenkörper (Open/Close)
        ctx.fillStyle = 'rgba(0, 255, 0, 0.25)';
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1.5;
        
        const bodyHeight = Math.abs(yClose - yOpen) || 2; // Mindesthöhe von 2px
        const bodyY = Math.min(yOpen, yClose);

        ctx.fillRect(x, bodyY, w, bodyHeight);
        ctx.strokeRect(x, bodyY, w, bodyHeight);
    });
}

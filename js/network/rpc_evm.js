import { calculateCurrentPrice } from '../crypto/mining.js';

/**
 * EVM & RPC COMPLIANCE LAYER (Satoshi / Gwei Einheiten)
 */

export function processSwapRequest(fromAsset, toAsset, inputAmount) {
    const amount = parseFloat(inputAmount);
    if (isNaN(amount) || amount <= 0) return { success: false, msg: "Ungültiger Betrag" };

    let currentExpPrice = calculateCurrentPrice();
    let btcBalance = parseFloat(localStorage.getItem("balance_btc") || "0");
    let ethBalance = parseFloat(localStorage.getItem("balance_eth") || "0");
    let expBalance = parseFloat(localStorage.getItem("balance_exp") || "0");

    // Feste fiktive Kurse für die Tausch-Ebene (BTC/ETH dienen nur als Swap-Anker)
    const btcPriceInFiat = 65000;
    const ethPriceInFiat = 3500000; // In Gwei/Gas-Äquivalenz skaliert

    if (fromAsset === "BTC" && toAsset === "EXP") {
        if (btcBalance < amount) return { success: false, msg: "Zu wenig BTC" };
        let fiatValue = amount * btcPriceInFiat;
        let receivedExp = fiatValue / currentExpPrice;
        
        localStorage.setItem("balance_btc", (btcBalance - amount).toFixed(8));
        localStorage.setItem("balance_exp", (expBalance + receivedExp).toFixed(8));
        return { success: true, msg: `Erfolgreich getauscht: +${receivedExp.toFixed(6)} EXP` };
    }

    if (fromAsset === "ETH" && toAsset === "EXP") {
        if (ethBalance < amount) return { success: false, msg: "Zu wenig ETH" };
        let fiatValue = amount * (ethPriceInFiat / 1000000); 
        let receivedExp = fiatValue / currentExpPrice;

        localStorage.setItem("balance_eth", (ethBalance - amount).toFixed(8));
        localStorage.setItem("balance_exp", (expBalance + receivedExp).toFixed(8));
        return { success: true, msg: `Erfolgreich getauscht: +${receivedExp.toFixed(6)} EXP` };
    }

    return { success: false, msg: "Trading-Chart exklusiv für EXP! BTC/ETH können nur in EXP geswappt werden." };
}

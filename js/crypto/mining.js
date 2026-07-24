/**
 * FUSIONS-MINING ENGINE (EXP / BTC / ETH)
 */

// Interne Zustände
let miningInterval = null;
const SYSTEM_FEES_POOL_KEY = "exp_global_liquidated_fees";
const TOTAL_ROUNDTRIPS_KEY = "exp_total_roundtrips";

export function initMiningSystem(onBlockMinedCallback) {
    // Initialisiere die globalen Liquiditäts-Metriken im Hot Storage falls leer
    if (!localStorage.getItem(SYSTEM_FEES_POOL_KEY)) localStorage.setItem(SYSTEM_FEES_POOL_KEY, "125000.0000");
    if (!localStorage.getItem(TOTAL_ROUNDTRIPS_KEY)) localStorage.setItem(TOTAL_ROUNDTRIPS_KEY, "1");

    // Starte das systemseitig AUTONOME Mining im Hintergrund (Takt: alle 4 Sekunden)
    if (!miningInterval) {
        miningInterval = setInterval(() => {
            executeMiningStep("autonomous", "EXP", 0.00002500);
            if (onBlockMinedCallback) onBlockMinedCallback();
        }, 4000);
    }
}

/**
 * Kern-Logik für das Schürfen und die mathematische Wertschöpfung
 */
export function executeMiningStep(type, layer, customAmount = 0) {
    const currentRoundtrip = parseInt(localStorage.getItem(TOTAL_ROUNDTRIPS_KEY) || "1");
    let globalFees = parseFloat(localStorage.getItem(SYSTEM_FEES_POOL_KEY) || "125000.00");

    if (layer === "EXP") {
        // Das Fusions-Mining erhöht permanent die eingezahlten Gebühren (Liquidität)
        // Erhöht den Supply exponentiell je Roundtrip, treibt aber den Wert durch Fees nach oben
        let nativeReward = type === "manual" ? 0.00050000 : 0.00002500;
        
        let currentBal = parseFloat(localStorage.getItem("balance_exp") || "0");
        localStorage.setItem("balance_exp", (currentBal + nativeReward).toFixed(8));

        // Transaktionsgebühren werden akkumuliert und "liquidiert"
        let feeInjection = type === "manual" ? 12.5000 : 1.2500;
        globalFees += feeInjection;
        localStorage.setItem(SYSTEM_FEES_POOL_KEY, globalFees.toFixed(4));

        // Alle 50 systemischen Zyklen schaltet das Netzwerk einen Roundtrip weiter
        if (Math.random() > 0.95) {
            localStorage.setItem(TOTAL_ROUNDTRIPS_KEY, (currentRoundtrip + 1).toString());
        }

    } else if (layer === "BTC") {
        // Klassische Kriterien (Satoshi Layer)
        let currentBtc = parseFloat(localStorage.getItem("balance_btc") || "0");
        localStorage.setItem("balance_btc", (currentBtc + 0.00000050).toFixed(8));

    } else if (layer === "ETH") {
        // EVM Gas-Metriken (Gwei Layer)
        let currentEth = parseFloat(localStorage.getItem("balance_eth") || "0");
        localStorage.setItem("balance_eth", (currentEth + 0.00001200).toFixed(8));
    }

    // Aktualisiere die globale Blockhöhe im System
    let currentHeight = parseInt(localStorage.getItem("global_block_height") || "0");
    localStorage.setItem("global_block_height", (currentHeight + 1).toString());
}

/**
 * Berechnet den aktuellen theoretischen Preis auf Basis deines mathematischen Modells:
 * Preis = Menge der Transaktionsgebühren / (Menge des Umlaufs + 1)
 */
export function calculateCurrentPrice() {
    const globalFees = parseFloat(localStorage.getItem(SYSTEM_FEES_POOL_KEY) || "125000.00");
    const roundtrips = parseInt(localStorage.getItem(TOTAL_ROUNDTRIPS_KEY) || "1");
    
    // Exponentielle Verrechnung: Der Kurs steigt progressiv mit der Liquidität an
    return (globalFees / 1000) * Math.log1.p(roundtrips + 1);
}

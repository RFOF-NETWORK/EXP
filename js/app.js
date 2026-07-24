import { initializeDeterministicWallet, getColdVault, purgeColdWallet } from './crypto/wallet.js';
import { initMiningSystem, executeMiningStep, calculateCurrentPrice } from './crypto/mining.js';
import { initTradingChart, pushNewGreenCandle, renderChart } from './components/chart.js';
import { addBlockToExplorer } from './components/explorer.js';
import { processSwapRequest } from './network/rpc_evm.js';

// DOM-Elemente
const views = {
    auth: document.getElementById('view-auth'),
    dashboard: document.getElementById('view-dashboard'),
    settings: document.getElementById('view-settings'),
    mining: document.getElementById('view-mining')
};

// Router-Funktion zur Umschaltung der 4 Ansichten
function switchView(targetKey) {
    Object.keys(views).forEach(key => {
        if (key === targetKey) views[key].classList.add('active');
        else views[key].classList.remove('active');
    });
}

// UI-Aktualisierung
function updateUI() {
    const username = localStorage.getItem("hot_username") || "Gast";
    document.getElementById("current-user-display").textContent = username;

    document.getElementById("balance-exp").textContent = parseFloat(localStorage.getItem("balance_exp") || "0").toFixed(8) + " EXP";
    document.getElementById("balance-btc").textContent = parseFloat(localStorage.getItem("balance_btc") || "0").toFixed(8) + " BTC";
    document.getElementById("balance-eth").textContent = parseFloat(localStorage.getItem("balance_eth") || "0").toFixed(8) + " ETH";

    const blockHeight = localStorage.getItem("global_block_height") || "0";
    document.getElementById("block-height-display").textContent = `#${blockHeight}`;
    
    const fees = localStorage.getItem("exp_global_liquidated_fees") || "125000.0000";
    const feeDisplay = document.getElementById("exp-total-fees");
    if (feeDisplay) feeDisplay.textContent = parseFloat(fees).toFixed(4) + " Gwei";

    const roundtripDisplay = document.getElementById("exp-roundtrip");
    if (roundtripDisplay) roundtripDisplay.textContent = `#${localStorage.getItem("exp_total_roundtrips") || "1"}`;

    const currentPrice = calculateCurrentPrice();
    document.getElementById("total-fiat-balance").textContent = `$ ${currentPrice.toFixed(2)}`;

    const addr = localStorage.getItem("hot_addr_exp") || "Keine Adresse";
    document.getElementById("wallet-address-display").textContent = addr.substring(0, 8) + "..." + addr.substring(addr.length - 4);
}

// Event-Listener beim Laden der Seite initialisieren
document.addEventListener("DOMContentLoaded", () => {
    
    // Auth-Submit (Konto-Erstellung)
    document.getElementById("auth-submit-btn").addEventListener("click", () => {
        const user = document.getElementById("auth-username").value;
        const pass = document.getElementById("auth-password").value;
        if (!user || !pass) return alert("Bitte alle Felder ausfüllen!");

        const walletData = initializeDeterministicWallet(user, pass);
        document.getElementById("nav-settings-btn").classList.remove("hidden");
        
        switchView("dashboard");
        updateUI();
        initTradingChart("exp-trading-chart");
        
        // Starte autonomes Hintergrund-Mining
        initMiningSystem(() => {
            updateUI();
            let height = localStorage.getItem("global_block_height") || "0";
            addBlockToExplorer("dash-local-blocks", "dash-global-blocks", { height, amount: "0.00002500", fee: "1.2500" });
            addBlockToExplorer("auth-local-blocks", "auth-global-blocks", { height, amount: "0.00002500", fee: "1.2500" });
        });
    });

    // Navigation-Zuweisungen
    document.getElementById("nav-settings-btn").addEventListener("click", () => {
        switchView("settings");
        document.getElementById("vault-address-exp").textContent = localStorage.getItem("hot_addr_exp");
        document.getElementById("vault-address-btc").textContent = localStorage.getItem("hot_addr_btc");
        document.getElementById("vault-address-eth").textContent = localStorage.getItem("hot_addr_eth");
        document.getElementById("settings-username").value = localStorage.getItem("hot_username") || "";
    });

    document.getElementById("settings-back-btn").addEventListener("click", () => switchView("dashboard"));
    document.getElementById("nav-mining-btn").addEventListener("click", () => switchView("mining"));
    document.getElementById("mining-back-btn").addEventListener("click", () => switchView("dashboard"));

    // Kopieren-Button
    document.getElementById("copy-address-btn").addEventListener("click", () => {
        navigator.clipboard.writeText(localStorage.getItem("hot_addr_exp") || "");
        alert("Adresse kopiert!");
    });

    // Mining Layer-Tabs Umschaltung (Ansicht 4)
    const tabs = ["exp", "btc", "eth"];
    tabs.forEach(tab => {
        document.getElementById(`tab-mine-${tab}`).addEventListener("click", (e) => {
            document.querySelectorAll(".mining-tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".mining-panel").forEach(p => p.classList.remove("active"));
            e.target.classList.add("active");
            document.getElementById(`panel-mine-${tab}`).classList.add("active");
        });
    });

    // Manuelle Mining-Aktionen
    document.getElementById("manual-mine-exp-btn").addEventListener("click", () => {
        executeMiningStep("manual", "EXP");
        pushNewGreenCandle();
        renderChart();
        updateUI();
    });
    document.getElementById("manual-mine-btc-btn").addEventListener("click", () => { executeMiningStep("manual", "BTC"); updateUI(); });
    document.getElementById("manual-mine-eth-btn").addEventListener("click", () => { executeMiningStep("manual", "ETH"); updateUI(); });

    // Swap-Modal Trigger
    document.getElementById("action-swap-btn").addEventListener("click", () => {
        const modal = document.getElementById("action-modal");
        document.getElementById("modal-title").textContent = "Asset Swap (EVM RPC)";
        document.getElementById("modal-body").innerHTML = `
            <label style="font-size:11px; color:#5a855a;">TAUSCHE VON:</label>
            <select id="swap-from" style="width:100%; background:#020502; border:1px solid #153015; padding:8px; margin-bottom:8px;">
                <option value="BTC">BTC (Satoshi Layer)</option>
                <option value="ETH">ETH (EVM/Gwei Layer)</option>
            </select>
            <label style="font-size:11px; color:#5a855a;">BETRAG:</label>
            <input type="text" id="swap-amount" placeholder="0.00" style="width:100%;">
        `;
        modal.classList.remove("hidden");
    });

    document.getElementById("modal-close-btn").addEventListener("click", () => {
        document.getElementById("action-modal").classList.add("hidden");
    });

    document.getElementById("modal-confirm-btn").addEventListener("click", () => {
        const fromAsset = document.getElementById("swap-from")?.value;
        const amount = document.getElementById("swap-amount")?.value;
        if (fromAsset && amount) {
            const res = processSwapRequest(fromAsset, "EXP", amount);
            alert(res.msg);
            if (res.success) {
                updateUI();
                document.getElementById("action-modal").classList.add("hidden");
            }
        }
    });
});

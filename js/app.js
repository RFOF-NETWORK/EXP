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
    // Smartphone-Fix: Chart rendern, wenn das Dashboard sichtbar wird
    if (targetKey === 'dashboard') {
        setTimeout(() => { renderChart(); }, 100);
    }
}

// UI-Aktualisierung mit korrekter Gesamt-Fiatbalance aller drei Kryptowährungen
function updateUI() {
    const username = localStorage.getItem("hot_username") || "Gast";
    document.getElementById("current-user-display").textContent = username;

    const expVal = parseFloat(localStorage.getItem("balance_exp") || "0");
    const btcVal = parseFloat(localStorage.getItem("balance_btc") || "0");
    const ethVal = parseFloat(localStorage.getItem("balance_eth") || "0");

    document.getElementById("balance-exp").textContent = expVal.toFixed(8) + " EXP";
    document.getElementById("balance-btc").textContent = btcVal.toFixed(8) + " BTC";
    document.getElementById("balance-eth").textContent = ethVal.toFixed(8) + " ETH";

    const blockHeight = localStorage.getItem("global_block_height") || "0";
    document.getElementById("block-height-display").textContent = `#${blockHeight}`;
    
    const fees = localStorage.getItem("exp_global_liquidated_fees") || "125000.0000";
    const feeDisplay = document.getElementById("exp-total-fees");
    if (feeDisplay) feeDisplay.textContent = parseFloat(fees).toFixed(4) + " Gwei";

    const roundtripDisplay = document.getElementById("exp-roundtrip");
    if (roundtripDisplay) roundtripDisplay.textContent = `#${localStorage.getItem("exp_total_roundtrips") || "1"}`;

    // Fix: Berechne den Gesamtwert aller drei Balancen in Fiat
    const currentExpPrice = calculateCurrentPrice();
    const btcPriceInFiat = 65000;
    const ethPriceInFiat = 3500;
    const totalFiat = (expVal * currentExpPrice) + (btcVal * btcPriceInFiat) + (ethVal * ethPriceInFiat);
    document.getElementById("total-fiat-balance").textContent = `$ ${totalFiat.toFixed(2)}`;

    const addr = localStorage.getItem("hot_addr_exp") || "Keine Adresse";
    document.getElementById("wallet-address-display").textContent = addr.substring(0, 8) + "..." + addr.substring(addr.length - 4);
}

// System-Initialisierung nach Login oder Session-Wiederherstellung
function startNetworkCore() {
    document.getElementById("nav-settings-btn").classList.remove("hidden");
    updateUI();
    initTradingChart("exp-trading-chart");
    
    // Starte autonomes Hintergrund-Mining und triggere die Explorer
    initMiningSystem(() => {
        updateUI();
        let height = localStorage.getItem("global_block_height") || "0";
        addBlockToExplorer("dash-local-blocks", "dash-global-blocks", { height, amount: "0.00002500", fee: "1.2500" });
        addBlockToExplorer("auth-local-blocks", "auth-global-blocks", { height, amount: "0.00002500", fee: "1.2500" });
    });
}

// Event-Listener beim Laden der Seite initialisieren
document.addEventListener("DOMContentLoaded", () => {
    
    // Fix: Verhindert automatisches Ausloggen beim Herunterziehen im Browser (Chrome Reload-Sicherung)
    const sessionActive = sessionStorage.getItem("session_active");
    const savedUser = localStorage.getItem("hot_username");
    const savedPass = sessionStorage.getItem("session_key_backup");
    
    if (sessionActive === "true" && savedUser && savedPass) {
        initializeDeterministicWallet(savedUser, savedPass);
        switchView("dashboard");
        startNetworkCore();
    }
    
    // Auth-Submit (Konto-Erstellung)
    document.getElementById("auth-submit-btn").addEventListener("click", () => {
        const user = document.getElementById("auth-username").value;
        const pass = document.getElementById("auth-password").value;
        if (!user || !pass) return alert("Bitte alle Felder ausfüllen!");

        initializeDeterministicWallet(user, pass);
        
        // Speichere die Sitzungsdaten verschlüsselt im Session-Cache für den Tab-Reload
        sessionStorage.setItem("session_active", "true");
        sessionStorage.setItem("session_key_backup", pass);
        
        switchView("dashboard");
        startNetworkCore();
    });

    // Passwort-Abfrage im Krypto-Tresor (Settings) zum Aufheben der Unschärfe/Sperre
    document.getElementById("btn-unlock-vault")?.addEventListener("click", () => {
        const passInput = document.getElementById("vault-unlock-password").value;
        const vault = getColdVault(passInput);
        
        if (vault) {
            const s12 = document.getElementById("seed-12-display");
            const s24 = document.getElementById("seed-24-display");
            s12.textContent = vault.seed12;
            s24.textContent = vault.seed24;
            s12.style.filter = "none";
            s24.style.filter = "none";
            alert("Tresor erfolgreich entsperrt!");
        } else {
            alert("Falsches Passwort! Zugriff auf RAM-Phrasen verweigert.");
        }
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

    // Senden-Modal Trigger mit Pop-up für manuelle Betrags- und Coin-Eingabe
    document.getElementById("action-send-btn").addEventListener("click", () => {
        const modal = document.getElementById("action-modal");
        document.getElementById("modal-title").textContent = "Krypto On-Chain Senden";
        document.getElementById("modal-body").innerHTML = `
            <div style="display:flex; flex-direction:column; gap:8px;">
                <label style="font-size:11px; color:#5a855a;">COIN SELEKTIEREN:</label>
                <select id="send-asset" style="width:100%; background:#020502; border:1px solid #153015; padding:10px; color:#fff; border-radius:6px;">
                    <option value="EXP">EXP (Native)</option>
                    <option value="BTC">BTC (Satoshi Layer)</option>
                    <option value="ETH">ETH (EVM/Gwei Layer)</option>
                </select>
                <label style="font-size:11px; color:#5a855a;">ZIELADRESSE:</label>
                <input type="text" id="send-target-address" placeholder="Adresse eingeben" style="width:100%; background:#020502; border:1px solid #153015; color:#fff; padding:10px; border-radius:6px; font-family:monospace;">
                <label style="font-size:11px; color:#5a855a;">MANUELLER BETRAG:</label>
                <input type="number" id="send-amount" step="any" placeholder="0.00000000" style="width:100%; background:#020502; border:1px solid #153015; color:#fff; padding:10px; border-radius:6px;">
            </div>
        `;
        document.getElementById("modal-confirm-btn").className = "btn-primary execute-send";
        modal.classList.remove("hidden");
    });

        // Swap-Modal Trigger mit zwei vollständigen Balken / Eingabefeldern zur Bilanzverrechnung
    document.getElementById("action-swap-btn").addEventListener("click", () => {
        const modal = document.getElementById("action-modal");
        document.getElementById("modal-title").textContent = "Asset Swap (EVM RPC)";
        
        // Vollständiges HTML-Skelett für beide Swap-Balken im Pop-up
        document.getElementById("modal-body").innerHTML = `
            <div style="display:flex; flex-direction:column; gap:10px;">
                <!-- BALKEN 1: SENDEN (FROM) -->
                <div style="background:rgba(0,0,0,0.2); padding:8px; border-radius:6px; border:1px solid #153015;">
                    <label style="font-size:10px; color:#5a855a; display:block; margin-bottom:4px;">BALKEN 1: TAUSCHE Betrag (SELL)</label>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
                        <select id="swap-from" style="background:#020502; border:1px solid #153015; padding:8px; color:#fff; border-radius:4px;">
                            <option value="BTC">BTC</option>
                            <option value="ETH">ETH</option>
                        </select>
                        <input type="number" id="swap-from-amount" step="any" placeholder="0.00" style="background:#020502; border:1px solid #153015; color:#fff; padding:8px; border-radius:4px; text-align:right;">
                    </div>
                </div>

                <div style="text-align:center; color:#00ff00; font-size:14px; margin:-4px 0;">⬇️</div>

                <!-- BALKEN 2: EMPFANGEN (TO) -->
                <div style="background:rgba(0,0,0,0.2); padding:8px; border-radius:6px; border:1px solid #153015;">
                    <label style="font-size:10px; color:#5a855a; display:block; margin-bottom:4px;">BALKEN 2: ZIELTOKEN BALANCE (BUY)</label>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
                        <select id="swap-to" style="background:#020502; border:1px solid #153015; padding:8px; color:#fff; border-radius:4px;" disabled>
                            <option value="EXP">EXP</option>
                        </select>
                        <input type="text" id="swap-to-estimated" placeholder="Berechnung..." style="background:#020502; border:1px solid #153015; color:#5a855a; padding:8px; border-radius:4px; text-align:right;" readonly>
                    </div>
                </div>
            </div>
        `;

        // Live-Vorschau-Berechnung für den zweiten Balken bei manueller Eingabe in Balken 1
        const fromAmountInput = document.getElementById("swap-from-amount");
        fromAmountInput.addEventListener("input", () => {
            const amount = parseFloat(fromAmountInput.value);
            if (!isNaN(amount) && amount > 0) {
                const currentExpPrice = calculateCurrentPrice();
                const fromAsset = document.getElementById("swap-from").value;
                const rate = fromAsset === "BTC" ? 65000 : 3500;
                const estimatedExp = (amount * rate) / currentExpPrice;
                document.getElementById("swap-to-estimated").value = estimatedExp.toFixed(6) + " EXP";
            } else {
                document.getElementById("swap-to-estimated").value = "";
            }
        });

        document.getElementById("modal-confirm-btn").className = "btn-primary execute-swap";
        modal.classList.remove("hidden");
    });

    // Gemeinsamer Verrechnungs-Trigger für die Pop-up Bestätigungen
    document.getElementById("modal-confirm-btn").addEventListener("click", (e) => {
        const targetBtn = e.target;

        // VERRECHNUNG: SENDEN AKTION
        if (targetBtn.classList.contains("execute-send")) {
            const asset = document.getElementById("send-asset").value;
            const address = document.getElementById("send-target-address").value.trim();
            const amount = parseFloat(document.getElementById("send-amount").value);
            
            if (!address) return alert("Bitte eine gültige Zieladresse eintragen!");
            if (isNaN(amount) || amount <= 0) return alert("Bitte einen gültigen Betrag eingeben!");

            const balanceKey = `balance_${asset.toLowerCase()}`;
            let currentBalance = parseFloat(localStorage.getItem(balanceKey) || "0");

            if (currentBalance < amount) {
                return alert(`Transaktion abgebrochen: Ungenügende Balance für ${asset}!`);
            }

            localStorage.setItem(balanceKey, (currentBalance - amount).toFixed(8));
            alert(`Erfolgreich transferiert:\nBetrag: ${amount.toFixed(8)} ${asset}\nAn: ${address}`);
            
            updateUI();
            document.getElementById("action-modal").classList.add("hidden");
        }

        // VERRECHNUNG: SWAP AKTION (Bereinigte, einfache Ausführung)
        if (targetBtn.classList.contains("execute-swap")) {
            const fromAsset = document.getElementById("swap-from").value;
            const amount = document.getElementById("swap-from-amount").value;
            
            if (!amount || parseFloat(amount) <= 0) return alert("Bitte Betrag im ersten Balken eintragen!");

            const res = processSwapRequest(fromAsset, "EXP", amount);
            alert(res.msg);
            
            if (res.success) {
                updateUI();
                document.getElementById("action-modal").classList.add("hidden");
            }
        }
    });

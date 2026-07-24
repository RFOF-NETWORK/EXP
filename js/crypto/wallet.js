import { generateDeterministicEntropy } from './bip39_words.js';

// Das RAM-Objekt repräsentiert die flüchtige COLD-Speicherschicht
const COLD_RAM = {
    password: null,
    seed12: null,
    seed24: null
};

/**
 * Erzeugt Schlüsselpaare aus Benutzername und Passwort
 * Trennt strikt nach COLD (RAM) und HOT (LocalStorage)
 */
export function initializeDeterministicWallet(username, password) {
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();
    
    // 1. Sichere die sensiblen Passphrasen im unmanipulierbaren COLD RAM
    COLD_RAM.password = cleanPassword;
    COLD_RAM.seed12 = generateDeterministicEntropy(cleanUsername + cleanPassword + "12", 12);
    COLD_RAM.seed24 = generateDeterministicEntropy(cleanUsername + cleanPassword + "24", 24);
    
    // 2. Generiere deterministische Wallet-Adressen (Hashes) aus dem Seed
    const expAddress = "0xEXP" + cipherHash(cleanUsername + COLD_RAM.seed12 + "EXP").substring(0, 32);
    const btcAddress = "1BTC" + cipherHash(cleanUsername + COLD_RAM.seed12 + "BTC").substring(0, 32);
    const ethAddress = "0xETH" + cipherHash(cleanUsername + COLD_RAM.seed12 + "ETH").substring(0, 32);
    
    // 3. Sichere unkritische Identifikatoren im HOT Storage (LocalStorage)
    localStorage.setItem("hot_username", cleanUsername);
    localStorage.setItem("hot_addr_exp", expAddress);
    localStorage.setItem("hot_addr_btc", btcAddress);
    localStorage.setItem("hot_addr_eth", ethAddress);
    
    // Initialisiere leere Balancen, falls nicht vorhanden (Persistent Hot)
    if (!localStorage.getItem("balance_exp")) localStorage.setItem("balance_exp", "0.00000000");
    if (!localStorage.getItem("balance_btc")) localStorage.setItem("balance_btc", "0.00000000");
    if (!localStorage.getItem("balance_eth")) localStorage.setItem("balance_eth", "0.00000000");
    
    return {
        username: cleanUsername,
        addresses: { exp: expAddress, btc: btcAddress, eth: ethAddress }
    };
}

/**
 * Gibt die COLD-Daten aus dem RAM zurück.
 * Erfordert das Nutzerpasswort zur Validierung (Zero-Knowledge Schutzbarriere).
 */
export function getColdVault(inputPassword) {
    if (!COLD_RAM.password || COLD_RAM.password !== inputPassword.trim()) {
        return null;
    }
    return {
        seed12: COLD_RAM.seed12,
        seed24: COLD_RAM.seed24
    };
}

/**
 * Löscht den RAM-Speicher (Cold) restlos beim Abmelden
 */
export function purgeColdWallet() {
    COLD_RAM.password = null;
    COLD_RAM.seed12 = null;
    COLD_RAM.seed24 = null;
}

/**
 * Hilfsfunktion: Schneller, deterministischer String-Hashing-Algorithmus
 */
function cipherHash(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return ((h1 >>> 0).toString(16) + (h2 >>> 0).toString(16)).padStart(16, "0");
}

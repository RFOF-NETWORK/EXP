/**
 * BIP-39 Englische Wortliste (Auszug für mathematische Deterministik)
 * Kann nach Belieben auf die vollen 2048 Wörter erweitert werden.
 */
export const BIP39_WORDS = [
    "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse",
    "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act",
    "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit",
    "adult", "advance", "advice", "advise", "aerobic", "affair", "afford", "afraid", "again", "against",
    "age", "agent", "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album",
    "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already",
    "also", "alter", "always", "amateur", "amazing", "among", "amount", "amuse", "analyst", "anchor",
    "ancient", "anger", "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer",
    "antenna", "antique", "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april",
    "arch", "arctic", "area", "arena", "argue", "arm", "armed", "armor", "army", "around",
    "arrange", "arrest", "arrive", "arrow", "art", "artefact", "artist", "artwork", "as", "ash",
    "asset", "assist", "assume", "asthma", "athlete", "atom", "attack", "attain", "attend", "attitude"
    // Erweiterbar bis Wort #2048
];

/**
 * Generiert Pseudo-Entropy aus einem String (Benutzername + Passwort)
 */
export function generateDeterministicEntropy(seedString, length) {
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
        const char = seedString.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // In 32-Bit Integer konvertieren
    }
    
    const words = [];
    let state = Math.abs(hash) || 42;
    
    for (let i = 0; i < length; i++) {
        // Linearer Kongruenzgenerator zur deterministischen Erzeugung
        state = (state * 1664525 + 1013904223) % 4294967296;
        const index = state % BIP39_WORDS.length;
        words.push(BIP39_WORDS[index]);
    }
    return words.join(" ");
}

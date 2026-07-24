/**
 * DUAL FRAKTAL EXPLORER LOGIK
 */

/**
 * Erzeugt einen neuen fraktalen Block-Eintrag im UI-Stream
 */
export function addBlockToExplorer(localContainerId, globalContainerId, blockData) {
    const localContainer = document.getElementById(localContainerId);
    const globalContainer = document.getElementById(globalContainerId);
    if (!localContainer || !globalContainer) return;

    // Generiere fraktale Hash-Identifikatoren
    const localHash = "0xloc_" + Math.random().toString(16).substring(2, 10);
    const globalHash = "0xglo_" + Math.random().toString(16).substring(2, 10);

    // 1. Lokaler Block-Eintrag (Hot/RAM State)
    const localBlock = document.createElement("div");
    localBlock.className = "mini-block";
    localBlock.innerHTML = `
        <span>Blk: #${blockData.height} (Lokal)</span>
        <span class="hash-link" data-target="${globalHash}">🔗 Link To Global</span>
        <span>Amt: ${blockData.amount} EXP</span>
    `;

    // 2. Globaler Block-Eintrag (Ledger Hash-Linked)
    const globalBlock = document.createElement("div");
    globalBlock.className = "mini-block";
    globalBlock.innerHTML = `
        <span>Blk: #${blockData.height} (Global)</span>
        <span class="hash-link" style="color:#00ff00;">Hash: ${globalHash}</span>
        <span>Fee Earned: ${blockData.fee} Gwei</span>
    `;

    // Füge Elemente am Anfang der Liste ein (Neueste oben)
    localContainer.insertBefore(localBlock, localContainer.firstChild);
    globalContainer.insertBefore(globalBlock, globalContainer.firstChild);

    // Klick-Event für die fraktale Verknüpfung (Führt von Lokal tief in Global)
    localBlock.querySelector(".hash-link").addEventListener("click", () => {
        globalBlock.style.boxShadow = "0 0 10px #00ccff";
        globalBlock.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => globalBlock.style.boxShadow = "none", 1500);
    });

    // Begrenze DOM-Elemente auf dem Handy gegen Überlastung
    if (localContainer.children.length > 10) {
        localContainer.lastChild.remove();
        globalContainer.lastChild.remove();
    }
}

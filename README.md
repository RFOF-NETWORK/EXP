# EXP
-
## System-Architektur & Spezifikation: EXP-Network
Dieses Dokument dient als präziser Entwicklungsplan für das Repository EXP. Die progressive Web-App (PWA) wird ohne Backend oder Terminal, rein über das Smartphone entwickelt und über GitHub Pages (Deploy from Branch: main) unter einer kostenlosen *.github.io Domain gehostet.
------------------------------
## 📂 Repository-Struktur (Dateibaum)

EXP/
├── index.html               # Haupt-Einstiegspunkt (Ansicht-Router & Layout-Anker)
├── manifest.json            # Web-App Konfiguration für mobiles Homescreen-Inlining
├── css/
│   └── styles.css           # Responsives, sauberes CSS-Design optimiert für Smartphones
├── js/
│   ├── app.js               # Zentraler View-Router (Wechsel zwischen Ansicht 1, 2, 3, 4)
│   ├── crypto/
│   │   ├── bip39_words.js   # Integrierte BIP-39 Wortliste (2048 Wörter)
│   │   ├── wallet.js        # Deterministic Wallet Gen (RAM = Cold / LocalStorage = Hot)
│   │   └── mining.js        # Autonomer & manueller Fusions-Mining-Algorithmus
│   ├── components/
│   │   ├── chart.js         # Exponentieller EXP-Chart (Ausschließlich grüne Kerzen)
│   │   └── explorer.js      # Dualer Explorer (Lokal & Global mit fraktalen Link-Hashes)
│   └── network/
│       └── rpc_evm.js       # EVM-Schnittstellen-Logik (Kompatibilität: Satoshi/Gwei)
└── assets/
    └── images/              # System-Grafiken, Diagramme und Icons

------------------------------
## 📱 Spezifikation der 4 App-Ansichten (Views)
Die App wird als Single-Page-Application (SPA) via js/app.js gesteuert. Die Statusleiste am oberen Bildschirmrand bleibt in allen Ansichten permanent sichtbar.
## Ansicht 1: Authentifizierung (Login / Registrierung)

* Funktion: Erstmalige Erstellung oder Eingabe von Benutzername und Passwort.
* Kryptografischer Anker: Aus der Kombination von Benutzername und Passwort wird unumkehrbar und deterministisch die Seed-Phrase (12/24 Wörter) und die daraus resultierenden Wallet-Adressen generiert.
* Sicherheits-Eigenschaft: Einmal erstellt, sind die Phrasen für diesen Account permanent verankert und können nie wieder verändert oder durch Fremd-Wallets manipuliert werden.
* Untere Ebene: Anzeige der simultan getrennten, aber interaktiven lokalen und globalen Block-History via fraktaler blauer Link-Hashes.

## Ansicht 2: Haupt-Dashboard & Trading-Interface

* Obere Sektion: Permanent sichtbare Statusleiste. Darunter die Gesamt-Wallet-Balance in Fiat-Währung (Anzeige standardmäßig bei 0.00). Das Kopieren der eigenen Wallet-Adresse ist per One-Tap-Klick möglich.
* Aktions-Buttons: Direkt unter der Balance befinden sich die Buttons Send und Swap.
* Konto-Salden: Auflistung der Balancen für EXP, BTC und ETH.
* Trading-Chart (EXP): Einzigartiger Candlestick-Chart für den EXP-Coin mit integrierten Buy- und Sell-Buttons.
* Regel: BTC und ETH besitzen keinen eigenen Trading-Chart. Sie dienen als Liquiditätsanker und können ausschließlich über die Swap-Funktion in EXP getauscht werden. Es gibt keine direkte Fiat-Auszahlung.
* Untere Sektion: Dualer Explorer (Lokal vs. Global), visuell sauber getrennt in einer gemeinsamen Ebene.

## Ansicht 3: Settings & Sicherheits-Tresor

* Zugang: Erreichbar über ein Zahnrad-Icon oben rechts in Ansicht 2.
* Verschlüsselter Bereich: Die 12 und 24 Wörter umfassenden Seed-Phrasen sind durch das Benutzerpasswort geschützt und werden erst nach korrekter Eingabe sichtbar.
* Öffentlicher Bereich: Die drei generierten Krypto-Adressen (EXP, BTC, ETH) sowie die Optionen zur Änderung von Benutzername und Passwort sind unverschlüsselt einsehbar.
* Navigation: Ein Zurück-Button führt ohne Datenverlust direkt nach Ansicht 2.

## Ansicht 4: Fusions-Mining-Interface

* Zugang: Erreichbar über den Mining-Button oben rechts (platziert unter dem Settings-Button in Ansicht 2).
* Drei Mining-Modi: Interfaces für EXP, BTC und ETH.
* BTC-Interface: Basiert auf klassischen mathematischen Kriterien (Satoshi-Struktur).
   * ETH-Interface: Basiert auf EVM-Gas- und Gebühren-Strukturen (Gwei).
   * EXP-Interface: Das Core-Mining fusioniert die Eigenschaften von BTC und ETH zu einem optimierten, kombinierten Fusions-Mining-Algorithmus.

------------------------------
## 🔒 Daten-Persistenz & Sicherheits-Architektur (Hot vs. Cold)
Um maximale Sicherheit ohne Server-Backend auf dem Smartphone zu gewährleisten, nutzt die App eine strikte Trennung von Laufzeit-Arbeitsspeicher (RAM) und Browser-Speicher (LocalStorage):

   1. Hot Storage (LocalStorage): Speichert ausschließlich nicht-kritische Daten wie den Benutzernamen und die öffentlichen Wallet-Adressen, um die App-Sitzung persistent zu halten.
   2. Cold Storage (RAM): Sensible Daten wie das Nutzerpasswort und die extrahierten Seed-Phrasen existieren rein im flüchtigen RAM-Speicher. Sobald der Browser-Tab geschlossen wird, sind diese Daten gelöscht. Sie werden bei jedem Login deterministisch neu aus der Benutzer-Passwort-Kombination berechnet.

------------------------------
## 📊 Ökonomie, Chart-Verlauf & Blockchain-Logik## 1. Genesis-Block & Supply
Der Genesis-Block fungiert als simultaner Erzeuger des Netzwerks. Der initiale Umlaufbestand (Supply) von EXP startet exakt bei Null. Mit jedem vollendeten Roundtrip (Umlaufzyklus) erhöht sich der Supply exponentiell.
## 2. Wertschöpfung und Liquidität
Der Preis von EXP basiert nicht auf künstlicher Verknappung, sondern auf der mathematischen Akkumulation realer Werte:
$$\text{EXP-Wert} = \frac{\text{Summe aller liquidierten/verdienten Transaktionsgebühren}}{\text{Aktueller Supply}}$$ 
Ewige Ersparnisse bei den Netzwerkgebühren sichern die Liquiditätsuntergrenze des Systems.
## 3. Exponentieller Chart-Verlauf (Grüne Kerzen)
Gemäß der mathematischen Wachstumskurve (siehe Bild 4) verläuft die Wertentwicklung seit dem Outbreak im Genesis-Block in einer endlosen, progressiven Exponentialkurve. Da jede Interaktion, egal ob Kauftransaktion (Buy) oder Tauscheinlösung (Sell), Netzwerk-Gebühren verbrennt und dem Liquiditätspool zuführt, generiert der Trading-Chart ausschließlich grüne Candlesticks. Ein mathematischer Wertverlust im System-Chart ist ausgeschlossen.
## 4. Hybrides Mining

* Autonomes System-Mining: Startet serverseitig/systemseitig autonom im Hintergrund direkt nach der erfolgreichen Registrierung des Nutzers ab dem Genesis-Block.
* Manuelles Mining: Der Nutzer kann über die Interaktion mit dem Mining-Button in Ansicht 4 aktiv zusätzliche EXP-Einheiten schürfen.

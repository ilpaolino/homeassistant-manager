# Home Assistant Manager

Configuratore desktop in italiano con Angular 22 e Tauri 2. Interfaccia dark orizzontale, icone locali, nessuna fotografia.

## Avvio e verifica

Requisiti: Node 24.15+ o altra versione supportata da Angular 22, npm, Rust e prerequisiti Tauri. Su macOS servono gli Xcode Command Line Tools.

```sh
npm ci
npm start                 # anteprima web: http://127.0.0.1:4200
npm run desktop           # sviluppo Tauri
npm test                  # regole della casa e salvataggio locale
npm run build             # dist/manager/browser
npm run desktop:build     # bundle macOS locale
```

Il bundle si trova in `src-tauri/target/release/bundle/macos/Home Assistant Manager.app`. La build macOS locale non è firmata o notarizzata per la distribuzione pubblica. Windows e Linux non sono stati verificati.

## Configurazione iniziale

Sono disponibili due percorsi:

- **Importa la tua casa**: scelta dell'origine, riconoscimento demo, revisione di nome/piani/stanze, assegnazione dei dispositivi, riepilogo e salvataggio.
- **Crea da zero**: scelta dell'origine, creazione di nome/piani/stanze, riepilogo e salvataggio. Non richiede un server e non inserisce dispositivi di esempio.

Il riconoscimento è simulato: non esegue scansioni di rete, autenticazione o chiamate a Home Assistant. Il dataset contiene tre piani, sette stanze e venti dispositivi; due dispositivi sono intenzionalmente privi di stanza per provare la revisione delle assegnazioni.

L'editor permette di aggiungere e rinominare piani, creare e rinominare stanze, scegliere le icone e spostare le stanze fra piani. Si può rimuovere un piano solo se è vuoto e se ne rimane almeno un altro. Rimuovere una stanza lascia i suoi dispositivi da assegnare; la rimozione più recente è annullabile durante la revisione. I nomi delle stanze devono essere univoci nello stesso piano, quelli dei piani nell'intera casa.

Ogni dispositivo incluso deve appartenere a una stanza esistente. È possibile escluderlo dall'importazione e reincluderlo prima del salvataggio. I gruppi vengono conservati solo con i dispositivi inclusi, controllabili e ancora appartenenti alla stessa stanza. Gruppi vuoti o riferimenti a stanze rimosse non vengono salvati.

Solo **Salva la casa** applica la bozza. La configurazione precedentemente salvata rimane disponibile mentre si lavora a una nuova proposta. La schermata iniziale offre anche la modifica della casa già configurata.

## Aspetto e visualizzazione dei dispositivi

Il selettore **Chiaro / Scuro** è disponibile nella barra superiore e durante la configurazione iniziale. Entrambi i temi includono superfici, campi, stati dei dispositivi, messaggi e gruppi.

Il selettore **Elenco / Schede** cambia la disposizione dei dispositivi nelle stanze e nella fase di assegnazione del configuratore. Le schede hanno formato quadrato su desktop e mantengono gli stessi comandi, filtri e selettori di stanza dell'elenco. Sensori e dispositivi offline conservano i rispettivi stati e vincoli. Su schermi piccoli la griglia si adatta allo spazio disponibile.

Le preferenze vengono conservate separatamente dalla casa in `localStorage`, chiave `ham.appearance.v1`, e ripristinate all'apertura. Se l'archivio delle preferenze non è disponibile, i comandi restano operativi nella finestra corrente. Lo stato iniziale senza preferenze è tema scuro e vista elenco.

Implementazione: `src/app/core/ui-preferences.ts`, due controlli condivisi in `src/app/shared/`, palette in `src/palettes.css` e layout in `src/appearance.css`. Il tema scuro conserva i colori precedenti; il tema chiaro usa una palette dedicata. Gli stili sono esterni per essere compatibili con la shell Tauri.

Verificati entrambi i temi, passaggio elenco/schede, comandi condivisi, assegnazioni nel configuratore e ripristino dopo una ricarica. Build Angular, bundle macOS e i 17 test esistenti passano; tema chiaro e schede verificati anche nel bundle nativo.

## Dati locali

- Casa e stati demo dei dispositivi: `localStorage`, chiave versionata `ham.house.v1`.
- Bozza del configuratore: `sessionStorage`, chiave `ham.setup-draft.v1`, ripristinabile dopo una ricarica nella stessa scheda/sessione. La chiusura definitiva della sessione può eliminarla.
- Nessuna credenziale o token viene richiesto o salvato. L'indirizzo dimostrativo accetta solo un'origine HTTP/HTTPS, senza credenziali, percorsi o parametri.
- La configurazione viene validata prima di essere caricata. Dati locali non leggibili mostrano un avviso e fanno aprire l'esempio senza sovrascrivere il dato salvato.
- Un errore di scrittura non applica la nuova casa e lascia disponibile la bozza.

Il browser e l'app Tauri hanno archivi locali distinti. La persistenza locale non sincronizza la casa con Home Assistant o con altri dispositivi. Le letture di temperatura e umidità sono assenti nelle stanze create manualmente; non vengono inventati valori.

## Architettura

- `src/app/views/connection.component.ts` e `.html`: interfaccia del configuratore.
- `src/onboarding.css`: stili condivisi esterni, compatibili con la policy degli stili del bundle Tauri.
- `src/app/core/setup-store.ts`: bozza, avanzamento, editor di spazi e assegnazioni.
- `src/app/core/configuration.ts`: regole di validazione e preparazione della casa finale.
- `src/app/core/configuration-storage.ts`: lettura/scrittura versionata e validazione del dato persistito.
- `src/app/core/home-adapter.ts`: contratto di discovery, configurazione e comandi indipendente dalle viste.
- `src/app/core/demo-adapter.ts`: origine demo e implementazione locale del contratto; nessun accesso alla rete.
- `src/app/core/home-store.ts`: casa salvata e stato reattivo condiviso.
- `src/app/views/overview.component.ts` e `room.component.ts`: panoramica e dettaglio stanza, compresi ambienti senza dispositivi.
- `tests/`: test automatici su struttura, assegnazioni, gruppi, indirizzi, dati corrotti e fallimenti di salvataggio.

Per integrare Home Assistant, implementare `HomeAdapter` e sostituire il provider in `src/main.ts`. Discovery reale, autenticazione sicura, sincronizzazione dei registri e scritture sul server sono lavoro futuro. La UI attuale distingue la proposta rilevata dalla configurazione locale confermata.

## Verifiche della revisione UX

Passano i 17 test automatici e la compilazione Angular di produzione. Verificati nell'interfaccia entrambi i percorsi: creazione manuale, nomi duplicati, spostamento di stanze, rimozione/annullamento, ripristino della bozza, assegnazione/esclusione/reinclusione dei dispositivi, riepilogo, salvataggio e ripristino della casa. Verificato che la discovery in bozza non modifichi la casa salvata e che una casa senza dispositivi mostri stati vuoti corretti.

## Stati operativi dei dispositivi

La chiarezza dello stato ha priorità sulla palette decorativa. Negli elenchi e nelle schede, le luci accese usano giallo luminoso su icona, bordo/fondo e toggle; le luci spente usano grigio. Le etichette Accesa/Spenta affiancano sempre il colore. Per prese e clima i toggle sono verdi quando accesi e rossi quando spenti, con etichette esplicite. I controlli sono più grandi rispetto alla prima versione.

I gruppi con alcune luci accese mostrano un toggle arancione centrale e la dicitura Parziale con il conteggio; i gruppi tutti accesi o tutti spenti adottano il rispettivo stato. Le luci spente non mostrano la percentuale configurata come luminosità attiva. Gli stati offline restano distinti e disabilitano i comandi non disponibili. Lo stile è in `src/device-states.css`, con colori semantici dedicati ai due temi.

## Azioni della stanza

Il menu Azioni stanza sostituisce il comando singolo di spegnimento. Offre Accendi tutte le Luci, Spegni tutte le Luci, Accendi tutti i dispositivi e Spegni tutti i dispositivi. I comandi interessano l'intera stanza, indipendentemente dal filtro di categoria. Sono inclusi solo i dispositivi controllabili, online e che devono cambiare stato; i sensori restano in sola lettura. Il conteggio accanto a ogni voce indica quante modifiche verranno applicate. Una voce senza modifiche possibili è disabilitata.

Il menu si chiude dopo l'azione, con Escape, con un clic esterno o spostando il focus fuori. Le frecce e Home/End permettono la navigazione da tastiera. Verificati nell'interfaccia tutti i comandi, i conteggi, il comportamento con un filtro attivo e la chiusura da tastiera.

# Stormy Weather
Una web application per la consultazione meteo in tempo reale, ottimizzata per il territorio italiano. Semplice, veloce e pronta per il deploy.

Nota: il progetto è attualmente disponibile in lingua italiana.

Sviluppato da [Tuo Nome] come progetto [tipo di progetto, es. personale/scolastico], [Mese/Anno].

Installazione e avvio
Assicurati di avere Python installato per il backend e Node.js per il frontend.

Dal terminale, avvia i servizi separatamente:

Backend (FastAPI):
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

Frontend (React):
cd frontend
npm install
npm run dev

Il progetto è ottimizzato per il deploy su piattaforme cloud come Render.

Funzionalità
Stormy offre una dashboard interattiva per visualizzare le condizioni meteorologiche:

- Ricerca intelligente: ottieni previsioni per qualsiasi città italiana in pochi istanti.
- Dati in tempo reale: informazioni aggiornate su temperatura, cielo e umidità.
- Previsioni estese: consulta i giorni successivi per organizzare i tuoi impegni.
- Design responsive: interfaccia ottimizzata per desktop, tablet e smartphone.

Struttura del repository
├── backend/    — API in FastAPI, logica di gestione dati
└── frontend/   — interfaccia in React con Vite

Legenda dati
Temperatura  valore espresso in gradi Celsius
Umidità      valore espresso in percentuale
Stato cielo  descrizione testuale delle condizioni meteo

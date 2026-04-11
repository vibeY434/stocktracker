# Stocktracker

`stocktracker` ist eine React/Vite-App fuer schnelle Aktien-Checks mit:

- US-Quote
- optionalem EU-Market-Vergleich
- Firmenprofil
- Fundamentals
- historischen Kursdaten
- USD/EUR-FX-Rate

## Stack

- Frontend: React 19, Vite, TypeScript, TanStack Query, Zustand
- Deploy-Ziel: Vercel
- API-Layer in Production: `api/*.ts` als Vercel Functions
- API-Layer in Local Dev: Express-Server unter `server/`

## Repo-Struktur

```text
src/
  components/      UI-Bausteine
  hooks/           React Query Hooks
  services/api/    Frontend-API-Client
  store/           Zustand App-State
  utils/           Formatter, Konstanten, Market-Hours

api/
  *.ts             Vercel Functions fuer Yahoo/RapidAPI
  _lib/            gemeinsame Guards / Helper fuer API-Routen

server/
  src/routes/      Express-Routen fuer Local Dev
  src/services/    Yahoo-Finance-Service + Cache
```

## Voraussetzungen

- Node.js 22+
- npm
- RapidAPI/Yahoo Finance API-Key

## Umgebungsvariablen

### Vercel Functions

- `YAHOO_API_KEY`:
  Pflicht. Ohne den Key liefern die Quote-/Search-/Historical-/Company-/Fundamentals-Routen keine echten Daten.
- `YAHOO_API_HOST`:
  Optional. Default ist `yh-finance.p.rapidapi.com`.

### Lokaler Express-Server

- `YAHOO_API_KEY`
- `YAHOO_API_HOST` optional
- `PORT` optional, Default `3001`

## Local Development

1. Root-Dependencies installieren:

```bash
npm install
```

2. Server-Dependencies installieren:

```bash
cd server
npm install
cd ..
```

3. API-Env fuer den lokalen Server setzen, z. B. in `server/.env`:

```bash
YAHOO_API_KEY=...
YAHOO_API_HOST=yh-finance.p.rapidapi.com
PORT=3001
```

4. Frontend starten:

```bash
npm run dev
```

5. In einem zweiten Terminal den lokalen API-Server starten:

```bash
npm run dev:server
```

Danach laeuft das Frontend ueber Vite und proxyt `/api/*` nach `http://localhost:3001`.

## Wichtiger Hinweis zu Local Dev

Der lokale Express-Server deckt aktuell diese Routen ab:

- `/api/search`
- `/api/quote`
- `/api/company`
- `/api/fundamentals`
- `/api/historical`

Die Vercel-spezifische Route `/api/euquote` ist derzeit **nicht** im lokalen Express-Server gespiegelt. Im lokalen Dev-Setup faellt der EU-Market-Vergleich deshalb aktuell auf "nicht verfuegbar" zurueck. Fuer volle Paritaet braucht der Express-Server spaeter eine passende `/api/euquote`-Route oder das Frontend muss gezielt gegen eine Vercel-Preview laufen.

## Production / Vercel

- Das Frontend ruft immer relative `/api/*`-Routen auf.
- In Vercel werden diese Requests direkt durch die `api/*.ts` Functions bedient.
- Die API-Routen haben jetzt einen einfachen Request-Guard:
  - engere Browser-Origin-Pruefung fuer dieselbe App / Local Dev
  - in-memory Rate-Limits pro Route und Client-IP

## Skripte

Im Root:

```bash
npm run dev
npm run build
npm run lint
npm run preview
npm run dev:server
```

Im `server/`-Ordner:

```bash
npm run dev
npm run start
npm run build
```

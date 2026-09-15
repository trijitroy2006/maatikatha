# MaatiKatha Backend API

A full-featured REST API for the MaatiKatha agricultural intelligence platform.

## Stack
- **Runtime:** Node.js 20 + TypeScript
- **Framework:** Express.js
- **Database:** SQLite via `better-sqlite3` (zero-setup, offline-first)
- **Auth:** JWT (access + refresh tokens, bcrypt password hashing)
- **Weather:** Real data from Open-Meteo API (free, no API key needed)

## Quick Start

```bash
cd backend
npm install
npm run dev
```

Server starts on **http://localhost:3001**

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Register new farmer |
| POST | `/api/auth/login` | — | Login and get JWT |
| POST | `/api/auth/refresh` | — | Refresh access token |
| POST | `/api/auth/logout` | ✓ | Logout |
| GET | `/api/auth/me` | ✓ | Get current user |
| GET | `/api/farm/plots` | ✓ | List farm plots |
| POST | `/api/farm/plots` | ✓ | Create farm plot |
| PUT | `/api/farm/plots/:id` | ✓ | Update farm plot |
| DELETE | `/api/farm/plots/:id` | ✓ | Delete farm plot |
| PUT | `/api/farm/location` | ✓ | Update GPS location |
| POST | `/api/simulator` | opt | Run crop simulation |
| GET | `/api/simulator/history` | ✓ | Past simulations |
| GET | `/api/climate?lat=&lon=` | — | 14-day forecast + 40yr baseline |
| POST | `/api/doctor` | opt | AI crop disease diagnosis |
| GET | `/api/doctor/history` | ✓ | Past consultations |
| GET | `/api/mandi?crop=&harvestDate=` | — | Market prices |
| GET | `/api/pest?lat=&lon=` | — | Active pest alerts near location |
| POST | `/api/upload` | ✓ | Upload field photo |
| GET | `/api/upload/my` | ✓ | My uploaded photos |
| GET | `/health` | — | Health check |

## Team Modules

| Member | Module |
|--------|--------|
| Auth Dev | `src/routes/auth.ts` |
| Farm Dev | `src/routes/farm.ts` |
| Simulator Dev | `src/routes/simulator.ts` + `src/engines/simulatorEngine.ts` |
| Climate Dev | `src/routes/climate.ts` + `src/engines/climateEngine.ts` |
| Doctor Dev | `src/routes/doctor.ts` + `src/engines/doctorEngine.ts` |
| Mandi Dev | `src/routes/mandi.ts` + `src/engines/mandiEngine.ts` |
| Pest Dev | `src/routes/pest.ts` |
| Upload Dev | `src/routes/upload.ts` |

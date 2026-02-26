# Heat Signature Leaderboard

Web app for browsing Heat Signature daily challenge leaderboards and some related stats.

Basically vibe-coded, I take no responsibility for code quality.

When running on Github pages, it uses local JSON files only (no server). When running locally it with the server, it will request the leaderboards from steam.

## Setup

```
npm install
```

## Running

Ensure you are logged into Steam on an account that owns Heat Signature.

```
npm run start
```

Opens the frontend at `http://localhost:5173`. Vite proxies `/leaderboard` requests to the backend at `http://localhost:8080`.

```
npm run server
```

Runs the server (`.\server\LeaderboardExtractorServer.exe`).

```
npm run start-remote
```

Opens the frontend at `http://localhost:5173`, but uses github as the source of leaderboards (https://github.com/piepieonline/heat-signature-leaderboard-history).

## Usage

- Pick a date with the date picker (← → buttons step by one day)
- Click **Load** to fetch the leaderboard for that date
- Changing the date after the first load auto-fetches

## Backend API

`GET http://localhost:8080/leaderboard?date=YYYY-MM-DD`

Expected response:

```json
{
  "cached": false,
  "currentDay": false,
  "date": "2026-02-20",
  "count": 73,
  "entries": [
    {
      "rank": 1,
      "missions": 3,
      "displayScore": 599,
      "timeSecs": 29,
      "timeStr": "0:29",
      "details": "3:0:99:29",
      "name": "Seven-Two"
    }
  ]
}
```

`details` format: `missions:expenses:style:timeSecs`

## Stack

- Frontend: React + TypeScript + Vite
- Backend: C# console app using Facepunch.Steamworks@2.3.3 (separate process, not in this repo)

# Pickleball Club Admin

Simple Next.js + Neon Postgres app for:

- managing club members
- saving attendance for each match
- splitting the court rent evenly across the players who joined
- reviewing monthly expenses per member

## Requirements

- Node.js 20+
- A Neon Postgres database

## Environment

Create a `.env.local` file from `.env.example` and set your Neon pooled connection string:

```bash
cp .env.example .env.local
```

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app creates its tables automatically the first time it connects to the database.

## Deploy on Vercel

1. Push this project to GitHub.
2. Import it into Vercel as a Next.js project.
3. Add the `DATABASE_URL` environment variable in Vercel using your Neon pooled connection string.
4. Deploy.

## Data model

- `members`: club members, with active/archive state
- `sessions`: one saved match with `played_on` and `court_cost`
- `session_attendees`: which members joined a session

Expense rule:

```text
member expense for a match = court cost / number of players in that match
```

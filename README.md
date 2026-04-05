# Pickleblall D7 Club

Simple Next.js + Neon Postgres app for:

- managing club members
- saving attendance for each match
- splitting the court rent evenly across the players who joined
- reviewing monthly expenses per member

## Project context

Current product structure:

- `Overview` route for club-level stats and monthly attendance view
- `Members` route for roster management
- `Sessions` route for match records
- `Costs` route for monthly cost review and admin-only payment reminders

Authentication model:

- guests can view every page
- only admins can edit members and sessions
- admin sign-in uses `ADMIN_ACCOUNT` and `ADMIN_PASSWORD`
- admin session is stored in a signed cookie

Current admin-only feature:

- on `/costs`, admins can generate one-off payment reminder messages without saving anything to the database
- there is one generator button per member
- there is a special combined reminder for `Chị Nam Trân + Nam Phương`
- generated messages include the public costs page link: `https://pickleball-d7-club.vercel.app/costs`

Deployment notes:

- the repo is deployed on Vercel as `pickleball-d7-club`
- GitHub is the source of truth for deployment; pushes to `main` trigger production redeploys
- `vercel.json` is committed at the repo root to force correct Next.js framework detection
- required Vercel environment variables are `DATABASE_URL`, `ADMIN_ACCOUNT`, and `ADMIN_PASSWORD`

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
3. Add the `DATABASE_URL`, `ADMIN_ACCOUNT`, and `ADMIN_PASSWORD` environment variables in Vercel.
4. Deploy.

## Data model

- `members`: club members, with active/archive state
- `sessions`: one saved match with `played_on` and `court_cost`
- `session_attendees`: which members joined a session

Expense rule:

```text
member expense for a match = court cost / number of players in that match
```

# RSSFusion - Information Intelligence

Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui. Planned: Supabase and a dedicated RSS background worker (see PRD and Playbook).

## Status
Phase 1 - Environment & Project Bootstrap (no auth, database, or RSS logic yet).

## Getting started
```bash
npm install
cp .env.example .env.local
npm run dev
```
Open http://localhost:3000

## Scripts
- `npm run dev` — dev server
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type check
- `npm run build` — production build

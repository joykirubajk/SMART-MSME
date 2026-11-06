# Progress log

Plan: [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). Workflow: one local branch per phase, commit locally, never push, never touch `main`. Phases start only on `start phase N`.

## Status

| Phase | Branch | Status |
|---|---|---|
| 1 Foundation | `phase-1-foundation` | Done, committed (2 commits) |
| 2 Eligibility engine | `phase-2-eligibility-engine` | Done, committed |
| 3 Profile + authenticated recommend API | `phase-3-profile-recommend` | Done, committed |
| 4 Python ranking service | - | Not started |
| 5 Scheme discovery | - | Not started |
| 6 Collections | - | Not started |
| 7 Test hardening | - | Not started |
| 8 Recommendation evaluation | - | Not started |
| 9 User-study kit + report | - | Not started |

## Phase 1 - Foundation (done)
- Additive, idempotent `Backend/db/schema.sql` (`npm run db:migrate`); new `user_profiles` table; `schemes.verified` / `official_source` columns. Nothing dropped or retyped.
- 19 placeholder schemes, all `verified:false` (`npm run db:seed`, insert-if-name-missing). Checklist: [DATA_VERIFICATION.md](DATA_VERIFICATION.md).
- `app.js` split from `server.js`; JSON 404 + global error handler; `GET /api/health`; CORS from env incl. `:3000`.
- Jest + Supertest; `.env.example` files; docs: [RULES_SCHEMA.md](RULES_SCHEMA.md), [DB_SETUP.md](DB_SETUP.md).
- Separate commit removed fake homepage stats and fake `.gov.in` email.
- Verified: `npm test` 12/12 pass; server boot + curl OK. **Not verified:** migrate/seed/DB tests (no Postgres), frontend compile (no `Frontend/node_modules`).

## Phase 2 - Eligibility engine (done)
- `Backend/services/eligibilityEngine.js`: pure module (`evaluate`, `evaluateAll`, `normalizeProfile`, `normalizeRules`, `missingRequiredFields`). Per scheme: `tier` (`eligible` / `possibly_eligible` / `not_eligible`), `passedRules`, `failedRules`, `unknownRules`, `missingInputs`.
- Missing optional input -> rule goes to `unknownRules` (never a silent pass). `0` is a real value. Legacy rule keys from an existing DB are read through aliases.
- Old `checkEligibility` (dangling `if`, truthiness guards, uncompared education/business/social category) removed; regression tests added.
- `POST /api/schemes/recommend` now validates required fields (400 + field errors), returns eligible then possibly-eligible schemes with `tier` and `eligibility`. Still unauthenticated (Phase 3).
- Frontend (small): "Perfect Match" replaced by Eligible / Possibly eligible badge + "Add to confirm: ..." line; form sends `experience: null` when blank (was `0`, which would fail experience rules).
- Tests: `npm test` 88/88 pass (84 engine/regression/seed + 4 endpoint tests with mocked DB). Frontend not compiled (no `Frontend/node_modules`).
- Known: until Phase 3 adds the "new enterprise?" form field, schemes marked new-enterprise-only show as *possibly eligible* asking for it.

## Phase 3 - Business profile + authenticated recommend (done)
- New endpoints (JWT required): `GET /api/business-profile` -> `{ data: { profile | null } }`; `PUT /api/business-profile` (full replace, validated). Named `business-profile` to avoid clashing with the existing account `/api/users/profile`.
- `POST /api/schemes/recommend` now requires login. Body `{ profile?, save_profile? }`: profile validated (400 + `errors[{field,message}]`), saved only when `save_profile === true`; without `profile` the saved one is used (400 if none).
- Response shape unchanged from Phase 2 (`data` = list with `tier` + `eligibility`, plus `count`, `eligible_count`, `possible_count`).
- `Backend/utils/validate.js` (`validateProfile`), `models/profile.js` (upsert), `controllers/profileController.js`, `routes/businessProfile.js`.
- DB (additive): `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_new_enterprise BOOLEAN` in `schema.sql`.
- Frontend: form pre-fills from the saved profile, new "Starting a new enterprise?" + "Describe your business" fields, "Save these details" checkbox, API validation messages shown; API client clears the session and sends the user to sign-in on a 401 for a token-bearing request.
- Profile field names in the API: `state`, `annual_income`, `experience_years`, `special_category` (the form maps its own names to these).
- Tests: `npm test` 114/114 pass across 7 suites (profile endpoints, auth required, validator boundaries, saved-profile flow; DB mocked). Frontend files syntax-checked with @babel/parser only - **not compiled or run in a browser**. `user_profiles` SQL never run against Postgres.
- Plan deviations: the `/api/meta/options` endpoint is deferred to Phase 5 (it ships with the filter-options endpoint); `data` stays a flat list instead of `data.recommendations`.

## Remaining phases (6 of 9; detail in IMPLEMENTATION_PLAN.md)
- **4** Python FastAPI ranking service (TF-IDF + feature fit), Node client with timeout and rule-based fallback, score and "why matched" UI.
- **5** Scheme discovery: server-side filters, search, pagination, `GET /schemes/:id`, filter-options endpoint, Browse page.
- **6** Collections: shared saved-state context, optimistic save with rollback, bulk saved-ids endpoint, heart button everywhere.
- **7** Test hardening: frontend (React Testing Library) tests, coverage, test-all script.
- **8** Evaluation: synthetic personas, precision/recall, P@k, NDCG for no ranking vs fallback vs ML.
- **9** User-study kit (SUS, tasks, analysis script), `PROJECT_REPORT.md` fixes, report sections.

## Manual TODO (owner: you / your teacher, deferred)
1. Install Postgres, create `msme` and `msme_test`, create `Backend/.env` and `.env.test` ([DB_SETUP.md](DB_SETUP.md)).
2. Run `npm run db:migrate`, `npm run db:seed`, `npm test` in `Backend/` (DB tests only truly run then).
3. Verify every seeded scheme against official sources ([DATA_VERIFICATION.md](DATA_VERIFICATION.md)).
4. Replace the placeholder footer phone/hours in `Frontend/src/Home/Homepage.jsx`.
5. `cd Frontend && npm install && npm start` once, to confirm it compiles (never compiled in this environment).
6. Push branches / open PRs yourself.

## Known caveats
- Seed data is AI-written from general knowledge; treat as placeholders.
- Stand-Up India seed models "SC/ST or women" as special categories `sc_st`, `bpl_women`, `widow` (vocabulary has no plain "women"), so non-BPL women are excluded until the real rule is confirmed and the vocabulary is extended.

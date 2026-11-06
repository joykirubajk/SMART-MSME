# Scheme data - verification TODO

`Backend/db/seed/schemes.data.json` holds 19 **placeholder** schemes written from general knowledge
by an AI assistant. **None of the numbers or rules are confirmed.** Every row is stored with
`verified = false` and an `official_source` hint (a domain, not a confirmed page).

**Do not present any figure to users, examiners or in the report as official until it is checked.**

## How to verify a scheme
1. Open the scheme's official portal / latest guidelines (see `official_source`, find the exact page).
2. Compare each field below. Fix the JSON (or the DB row) to match the guideline.
3. Fill in the exact URL and the guideline date in `official_source`.
4. Set `"verified": true` in the JSON (and re-seed on a fresh DB) or `UPDATE schemes SET verified = TRUE WHERE id = ...`.

## Checklist (tick when confirmed)

Fields to confirm for every scheme: max project cost / loan size, subsidy %, max subsidy, age limits
(and relaxations), minimum education, category/state restrictions, whether it is for new units only,
and whether the scheme is still open.

- [ ] PMEGP - project cost cap (manufacturing vs service differ), subsidy % by category/area, 8th-pass condition
- [ ] MUDRA Shishu / Kishor / Tarun - current loan slab limits (check whether Tarun Plus exists)
- [ ] CGTMSE - guarantee cover %, maximum guaranteed loan (changes between budgets)
- [ ] Stand-Up India - loan range, greenfield condition, whether the scheme is still active
- [ ] PMFME - subsidy %, per-unit cap, whether only existing food units qualify
- [ ] PM Vishwakarma - loan stages/amounts, eligible trades, age
- [ ] CLCSS - subsidy %, cap, experience condition (I invented `min_experience_years: 1`; likely wrong)
- [ ] PM SVANidhi - loan stages, who qualifies as a street vendor
- [ ] Udyogini - age 18-45, family income cap, subsidy %, which lenders offer it
- [ ] Mahila Udyam Nidhi - age limit and loan cap (I guessed 55 and 10L)
- [ ] National SC-ST Hub - is it a scheme with eligibility rules or just a support programme
- [ ] ZED Certification - subsidy % by enterprise size, rupee caps (I guessed 80% / 80,000)
- [ ] Agriculture Infrastructure Fund - loan cap, subvention %, who qualifies
- [ ] Tamil Nadu NEEDS - age limits, education, project cost cap, subsidy
- [ ] Tamil Nadu UYEGP - age limits, project cost cap, subsidy
- [ ] Maharashtra CMEGP - age limits, education, project cost cap, subsidy
- [ ] Uttar Pradesh ODOP Margin Money - age limit (I guessed 55), cap, subsidy %

## Gaps
- No Karnataka or Delhi scheme is included although the form offers them. Add real ones.
- The `max_investment` column is a display/sort value; for some schemes it is the loan cap, not a project-cost cap.
- Existing rows in the live database (if any) were not touched by the seed script.

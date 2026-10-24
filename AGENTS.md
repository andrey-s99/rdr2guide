# Instructions for the coding agent

Read `SPEC.md` completely before writing any code, then implement it stage by stage (section 14), in order.

- `SPEC.md` is the single source of truth. UI text is Russian; code, identifiers and comments are English.
- `data/*.json` is verified game data. Do not edit it. Report suspected data errors in `DATA_ISSUES.md`.
- For anything the spec does not cover, use section 17 ("Решения по умолчанию"), otherwise pick the simplest option and log it in `DECISIONS.md`. Do not ask the user questions.
- After each stage `npm run lint`, `npm run test` and `npm run build` must pass, then commit.

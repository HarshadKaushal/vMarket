# e6a28af — fix: trim passwords before they are hashed or compared

## What the commit contains

`password` in `frontend/lib/validation.ts` is `z.string().trim().pipe(z.string().min(8, ...))`. `RegisterDto` and `LoginDto` trim a string password before `@MinLength(8)`. `docs/edge-cases.md` records the case.

## Review

In Zod 4, `trim()` changes the value. The `pipe` makes the length check run after that trim, so `"   short"` still fails. A space in the middle is kept.

The DTO trim matters for curl, which never runs the form. Email trim and lowercase were already there. This commit does not change bcrypt cost, the cookie, or the unique-email handling.

An account created before this fix, whose hash included leading spaces, will not match the trimmed password until that hash is replaced. No migration does that. It was a one-off local rehash and it is not in the commit.

## Decision

Trim surrounding password spaces in both layers. Do not strip spaces inside the password.

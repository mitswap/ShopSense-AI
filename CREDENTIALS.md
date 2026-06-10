# Credentials and Environment Notes

This file exists as a setup checklist only. Do not store live secrets in Git-tracked markdown.

## Required Secret Categories

- Supabase URL and service role key
- Supabase publishable frontend key
- OpenRouter primary and fallback keys
- Hugging Face primary and fallback keys
- OCR.Space primary and fallback keys

## Local Setup

Store secrets in:

- `.env`

Never commit:

- `.env`
- `.env.local`

## Current Secret Handling Rules

- server-only secrets must never use `VITE_*`
- provider secrets should be read only through server runtime env vars
- Vercel and local should use the same env names for parity

## If You Shared Keys Publicly

Rotate them immediately before production deployment.

## Recommended Final Checks Before Deploy

- confirm local `.env` works
- copy the same env names to Vercel
- verify `npm run build`
- verify the main product flows manually

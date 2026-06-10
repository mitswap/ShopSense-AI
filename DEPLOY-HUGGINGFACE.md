# Hugging Face and Cloud AI Deployment Notes

ShopSense AI currently supports Hugging Face and OpenRouter as the main cloud AI providers.

## Current Cloud Runtime Model

- Hugging Face: cloud reasoning and chat completion
- OpenRouter: cloud reasoning fallback and embeddings
- OCR.Space: supplier memo OCR
- optional local Ollama compatibility for non-serverless environments

## Required Environment Variables

Hugging Face:

- `HF_TOKEN`
- `HF_TOKEN_FALLBACK`
- `HF_CHAT_MODEL`
- `HF_REASONER_MODEL`
- `HF_TIMEOUT_MS`

OpenRouter:

- `OPENROUTER_API_KEY`
- `OPENROUTER_API_KEY_FALLBACK`
- `OPENROUTER_MODEL`
- `OPENROUTER_MODEL_FALLBACKS`
- `OPENROUTER_EMBED_MODEL`

OCR:

- `OCR_SPACE_API_KEY`
- `OCR_SPACE_API_KEY_FALLBACK`

## Fallback Behavior

The current code supports:

- primary key
- fallback key
- lightweight in-memory preference for the last working key on warm processes

This reduces repeated failures when the first key is temporarily out of credit, rate limited, or unavailable.

## Suggested Deployment Strategy

For Vercel:

- keep frontend and serverless API in the same project if possible
- set all required provider env vars in project settings
- redeploy after env changes

For Render:

- use the same env names as local and Vercel
- keep provider configuration identical for easier debugging

## Operational Advice

- Rotate any key that was ever shared publicly.
- Keep at least one fallback key funded and active before demos or production use.
- If quality drops, verify:
  - provider billing
  - provider request logs
  - current selected model names
  - fallback key validity

# Deploy Backend with Hugging Face (No Local Ollama Required)

This project now supports a cloud fallback for all Ollama calls:
- Local Ollama (if running)
- Hugging Face Inference Providers (when `HF_TOKEN` is set)

## 1) Local test

```powershell
cd "G:\BuildFest Hackathon\sme-ai-dashboard"
$env:HF_TOKEN="hf_xxx"
$env:HF_CHAT_MODEL="Qwen/Qwen2.5-7B-Instruct:fastest"
$env:HF_REASONER_MODEL="Qwen/Qwen2.5-7B-Instruct:fastest"
npm run dev:api
```

Then check:

```powershell
curl http://localhost:3001/api/intelligence/health
```

Expected fields include:
- `"ollama": true` (compatibility flag)
- `"huggingface": true`
- `"reasoningMode": "huggingface-cloud"` (when local Ollama is not running)

## 2) Vercel backend (recommended with your current frontend)

Use Vercel env vars for the API project:

- `HF_TOKEN`
- `HF_CHAT_MODEL` (optional)
- `HF_REASONER_MODEL` (optional)
- keep existing: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY` (if you use embeddings/fallback)

CLI example:

```powershell
cd "G:\BuildFest Hackathon\sme-ai-dashboard"
vercel env add HF_TOKEN production
vercel env add HF_CHAT_MODEL production
vercel env add HF_REASONER_MODEL production
vercel --prod
```

## 3) Frontend connection

If frontend and API are in the same Vercel project, no change is required.

If frontend is separate, set this on frontend Vercel env:

- `VITE_API_BASE_URL=https://<your-api-domain>`

## Notes

- Hugging Face Inference Providers has a free monthly credit quota and then pay-as-you-go.
- Free Hugging Face Spaces sleep when inactive; Vercel serverless is better for always-online API routes with this codebase.
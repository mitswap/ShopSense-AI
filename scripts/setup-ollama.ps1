# ShopSense — pull local Ollama models (fast + reasoner)
$ErrorActionPreference = "Stop"

$ollamaPaths = @(
  "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe",
  "$env:ProgramFiles\Ollama\ollama.exe"
)

$ollama = $ollamaPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $ollama) {
  Write-Host "Ollama not found. Install with: winget install Ollama.Ollama"
  exit 1
}

Write-Host "Using Ollama at: $ollama"
& $ollama --version

Write-Host "Pulling llama3.2:1b (fast / translation)..."
& $ollama pull llama3.2:1b

Write-Host "Pulling deepseek-r1:1.5b (local reasoning for insights)..."
& $ollama pull deepseek-r1:1.5b

Write-Host "Checking API..."
try {
  $r = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 5
  Write-Host "Ollama API OK. Models:" ($r.models | ForEach-Object { $_.name })
} catch {
  Write-Host "Start Ollama from Start Menu, then re-run this script."
}

Write-Host "Done."

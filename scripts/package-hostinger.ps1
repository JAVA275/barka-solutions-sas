param(
    [string]$DestinationZip = "barka-solutions-hostinger.zip",
    [string]$DesktopZip = "C:\Users\BARKA SOLUTIONS 1\Desktop\barka-solutions-hostinger.zip"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Write-Host "📦 Préparation du pack de déploiement Hostinger..." -ForegroundColor Cyan

$staging = Join-Path $PSScriptRoot "..\.hostinger-staging"
if (Test-Path $staging) {
    Remove-Item -Recurse -Force $staging
}
New-Item -ItemType Directory -Path $staging | Out-Null

# 1. Copier dist (frontend et server.cjs)
Write-Host "  -> Copie de dist/..."
Copy-Item -Path "dist" -Destination $staging -Recurse

# 2. Copier server/data/store.json
Write-Host "  -> Copie des données server/data/store.json..."
New-Item -ItemType Directory -Path (Join-Path $staging "server\data") -Force | Out-Null
Copy-Item -Path "server\data\store.json" -Destination (Join-Path $staging "server\data\store.json")

# 3. Copier public
Write-Host "  -> Copie des fichiers publics (logos, robots.txt, sitemap.xml)..."
Copy-Item -Path "public" -Destination $staging -Recurse

# 4. Préparer uploads/portfolio et uploads/quotes
Write-Host "  -> Initialisation des dossiers uploads/..."
New-Item -ItemType Directory -Path (Join-Path $staging "uploads\portfolio") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $staging "uploads\quotes") -Force | Out-Null
New-Item -ItemType File -Path (Join-Path $staging "uploads\portfolio\.gitkeep") -Force | Out-Null
New-Item -ItemType File -Path (Join-Path $staging "uploads\quotes\.gitkeep") -Force | Out-Null

# 5. Copier les fichiers racines essentiels
Write-Host "  -> Copie de package.json, ecosystem.config.cjs, serveurs racines et guides..."
Copy-Item -Path "package.json" -Destination $staging
Copy-Item -Path "ecosystem.config.cjs" -Destination $staging
Copy-Item -Path "server.js" -Destination $staging
Copy-Item -Path "server.cjs" -Destination $staging
Copy-Item -Path "index.js" -Destination $staging
Copy-Item -Path "index.cjs" -Destination $staging
Copy-Item -Path "DEPLOIEMENT_HOSTINGER.md" -Destination $staging

# 6. Créer .env pour Hostinger avec variables requises
$envContent = @"
PORT=3000
NODE_ENV=production
APP_URL=https://barkasolutions.org
JWT_SECRET=barka_solutions_ultra_secure_production_secret_key_2026_ngaoundere_cameroon_jwt
JWT_EXPIRES_IN=7d
ADMIN_NOTIFICATION_EMAILS=direction@barkasolutions.org,kouchoumichel@yahoo.fr
"@
Set-Content -Path (Join-Path $staging ".env") -Value $envContent -Encoding UTF8

# 7. Créer l'archive ZIP
Write-Host "  -> Compression de l'archive ZIP..."
if (Test-Path $DestinationZip) {
    Remove-Item -Force $DestinationZip
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($staging, (Resolve-Path .).Path + "\" + $DestinationZip, [System.IO.Compression.CompressionLevel]::Optimal, $false)

# 8. Copie sur le Bureau si accessible
try {
    Copy-Item -Path $DestinationZip -Destination $DesktopZip -Force
    Write-Host "  -> Copie sur le Bureau réussie : $DesktopZip" -ForegroundColor Green
} catch {
    Write-Warning "Impossible de copier directement sur le Bureau: $_"
}

# 9. Nettoyer staging
Remove-Item -Recurse -Force $staging

$zipSize = (Get-Item $DestinationZip).Length / 1MB
Write-Host "✅ Archive prête : $DestinationZip ($([Math]::Round($zipSize, 2)) Mo)" -ForegroundColor Green

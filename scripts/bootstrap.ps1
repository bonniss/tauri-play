param(
  [Parameter(Mandatory = $true)]
  [string]$PackageName,

  [Parameter(Mandatory = $true)]
  [string]$ProductName,

  [Parameter(Mandatory = $true)]
  [string]$Identifier
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$packageJsonPath = Join-Path $root "package.json"
$cargoTomlPath = Join-Path $root "src-tauri\Cargo.toml"
$tauriConfPath = Join-Path $root "src-tauri\tauri.conf.json"
$appTsxPath = Join-Path $root "src\App.tsx"

function Get-LibName([string]$name) {
  return ($name -replace "-", "_")
}

function Replace-InFile([string]$path, [string]$oldValue, [string]$newValue) {
  $content = Get-Content $path -Raw
  $content = $content.Replace($oldValue, $newValue)
  Set-Content -Path $path -Value $content -Encoding utf8
}

$libName = Get-LibName $PackageName

Replace-InFile $packageJsonPath '"name": "tauri-starter"' ('"name": "' + $PackageName + '"')
Replace-InFile $cargoTomlPath 'name = "tauri-starter"' ('name = "' + $PackageName + '"')
Replace-InFile $cargoTomlPath 'description = "A reusable Tauri starter template"' ('description = "' + $ProductName + '"')
Replace-InFile $cargoTomlPath 'name = "tauri_starter_lib"' ('name = "' + $libName + '_lib"')
Replace-InFile $tauriConfPath '"productName": "Tauri Starter"' ('"productName": "' + $ProductName + '"')
Replace-InFile $tauriConfPath '"identifier": "com.example.tauri-starter"' ('"identifier": "' + $Identifier + '"')
Replace-InFile $tauriConfPath '"title": "Tauri Starter"' ('"title": "' + $ProductName + '"')
Replace-InFile $appTsxPath 'Tauri Starter - ' ($ProductName + ' - ')
Replace-InFile (Join-Path $root "src-tauri\src\main.rs") 'tauri_starter_lib::run()' ($libName + '_lib::run()')

Write-Host "Bootstrap complete."
Write-Host ("package name : " + $PackageName)
Write-Host ("product name : " + $ProductName)
Write-Host ("identifier   : " + $Identifier)
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Review src/App.tsx header copy."
Write-Host "2. Review src/constants/storage.ts if you want product-specific keys."
Write-Host "3. Run: corepack pnpm build"
Write-Host "4. Run: cargo check --manifest-path .\src-tauri\Cargo.toml"

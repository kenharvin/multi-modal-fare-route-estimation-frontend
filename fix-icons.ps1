# Remove all icon imports and replace with text
$files = @(
    "src\screens\ModeSelectionScreen.tsx",
    "src\screens\PublicTransportScreen.tsx",
    "src\screens\PrivateVehicleScreen.tsx",
    "src\screens\TripPlanScreen.tsx",
    "src\screens\RouteResultsScreen.tsx",
    "src\screens\PrivateVehicleResultsScreen.tsx",
    "src\components\RouteCard.tsx",
    "src\components\TripSummary.tsx",
    "src\components\DestinationInput.tsx",
    "src\components\StopoverInput.tsx",
    "src\components\MapViewComponent.tsx"
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    
    # Remove the MaterialCommunityIcons import line
    $content = $content -replace "import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';\s*", ""
    
    # Remove the Icon constant line
    $content = $content -replace "const Icon = MaterialCommunityIcons;\s*", ""
    
    # Save the file
    Set-Content -Path $file -Value $content
}

Write-Host "Icon imports removed from all files"

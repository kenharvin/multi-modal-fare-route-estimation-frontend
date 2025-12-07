# Replace all Icon components with text
$replacements = @{
    '<Icon name="bus" size={50} color="#4caf50" />' = '<Text style={{fontSize: 50}}>🚌</Text>'
    '<Icon name="check-circle" size={16} color="#4caf50" />' = '<Text style={{fontSize: 16}}>✓</Text>'
    '<Icon name="check-circle" size={16} color="#2196f3" />' = '<Text style={{fontSize: 16}}>✓</Text>'
    '<Icon name="car" size={50} color="#2196f3" />' = '<Text style={{fontSize: 50}}>🚗</Text>'
    '<Icon name="map-marker" size={20} color="#3498db" />' = '<Text style={{fontSize: 20}}>📍</Text>'
    '<Icon name="map-marker" size={20} color="#7f8c8d" style={styles.icon} />' = '<Text style={[{fontSize: 20}, styles.icon]}>📍</Text>'
    '<Icon name="map-marker" size={24} color="#27ae60" />' = '<Text style={{fontSize: 24}}>📍</Text>'
    '<Icon name="map-marker" size={24} color="#e74c3c" />' = '<Text style={{fontSize: 24}}>📍</Text>'
    '<Icon name="map-marker" size={20} color="#2196f3" />' = '<Text style={{fontSize: 20}}>📍</Text>'
    '<Icon name="close-circle" size={20} color="#95a5a6" />' = '<Text style={{fontSize: 20}}>✕</Text>'
    '<Icon name="close-circle" size={24} color="#e74c3c" />' = '<Text style={{fontSize: 24}}>✕</Text>'
    '<Icon name="map-search" size={80} color="#bdc3c7" />' = '<Text style={{fontSize: 80}}>🔍</Text>'
    '<Icon name="cash" size={20} color="#27ae60" />' = '<Text style={{fontSize: 20}}>💵</Text>'
    '<Icon name="cash" size={18} color="#27ae60" />' = '<Text style={{fontSize: 18}}>💵</Text>'
    '<Icon name="clock-outline" size={20} color="#f39c12" />' = '<Text style={{fontSize: 20}}>⏱</Text>'
    '<Icon name="clock-outline" size={18} color="#f39c12" />' = '<Text style={{fontSize: 18}}>⏱</Text>'
    '<Icon name="clock-outline" size={32} color="#f39c12" />' = '<Text style={{fontSize: 32}}>⏱</Text>'
    '<Icon name="swap-horizontal" size={20} color="#3498db" />' = '<Text style={{fontSize: 20}}>↔</Text>'
    '<Icon name="swap-horizontal" size={18} color="#3498db" />' = '<Text style={{fontSize: 18}}>↔</Text>'
    '<Icon name="map-marker-path" size={20} color="#3498db" />' = '<Text style={{fontSize: 20}}>🗺</Text>'
    '<Icon name="map-search-outline" size={80} color="#bdc3c7" />' = '<Text style={{fontSize: 80}}>🔍</Text>'
    '<Icon name="gas-station" size={32} color="#e74c3c" />' = '<Text style={{fontSize: 32}}>⛽</Text>'
    '<Icon name="gas-station" size={20} color="#7f8c8d" />' = '<Text style={{fontSize: 20}}>⛽</Text>'
    '<Icon name="speedometer" size={32} color="#3498db" />' = '<Text style={{fontSize: 32}}>📊</Text>'
    '<Icon name="fuel" size={20} color="#7f8c8d" />' = '<Text style={{fontSize: 20}}>⛽</Text>'
    '<Icon name="cash" size={20} color="#7f8c8d" />' = '<Text style={{fontSize: 20}}>💵</Text>'
    '<Icon name="currency-usd-off" size={24} color="#7f8c8d" />' = '<Text style={{fontSize: 24}}>💵</Text>'
    '<Icon name="highway" size={24} color="#7f8c8d" />' = '<Text style={{fontSize: 24}}>🛣</Text>'
    '<Icon name="map-marker-distance" size={24} color="#7f8c8d" />' = '<Text style={{fontSize: 24}}>📏</Text>'
    '<Icon name="map-marker-distance" size={18} color="#e74c3c" />' = '<Text style={{fontSize: 18}}>📏</Text>'
    '<Icon name="map-marker-distance" size={28} color="#3498db" />' = '<Text style={{fontSize: 28}}>📏</Text>'
    '<Icon name="map-marker-outline" size={20} color="#3498db" />' = '<Text style={{fontSize: 20}}>📍</Text>'
    '<Icon name="map-marker-outline" size={18} color="#3498db" />' = '<Text style={{fontSize: 18}}>📍</Text>'
    '<Icon name="star" size={16} color="#f39c12" />' = '<Text style={{fontSize: 16}}>⭐</Text>'
    '<Icon name="chevron-right" size={16} color="#bdc3c7" />' = '<Text style={{fontSize: 16}}>›</Text>'
    '<Icon name="cash-multiple" size={28} color="#27ae60" />' = '<Text style={{fontSize: 28}}>💵</Text>'
    '<Icon name="map-marker-multiple" size={28} color="#9b59b6" />' = '<Text style={{fontSize: 28}}>📍</Text>'
    '<Icon name="map-marker" size={20} color="#27ae60" />' = '<Text style={{fontSize: 20}}>📍</Text>'
    '<Icon name="map-marker" size={20} color="#e74c3c" />' = '<Text style={{fontSize: 20}}>📍</Text>'
    '<Icon name="map-outline" size={64} color="#7f8c8d" />' = '<Text style={{fontSize: 64}}>🗺</Text>'
}

$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    foreach ($key in $replacements.Keys) {
        if ($content -match [regex]::Escape($key)) {
            $content = $content -replace [regex]::Escape($key), $replacements[$key]
            $modified = $true
        }
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "Updated: $($file.Name)"
    }
}

Write-Host "`nAll Icon components replaced with text"

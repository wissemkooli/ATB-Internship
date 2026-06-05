Write-Host "Starting continuous sequence! Press Ctrl+C to stop." -ForegroundColor Cyan

# Loop continuously
while ($true) {
    # Iterate through rows 1 to 3
    for ($row = 1; $row -le 3; $row++) {
        # Iterate through columns 1 to 2
        for ($col = 1; $col -le 2; $col++) {
            Write-Host "Lighting up Row $row, Col $col..."
            
            # Create the JSON body
            $body = @{
                row = $row
                col = $col
            } | ConvertTo-Json

            # Send the POST request to FastAPI
            try {
                Invoke-RestMethod -Uri 'http://localhost:8000/hardware/highlight/compartment' `
                                  -Method Post `
                                  -ContentType 'application/json' `
                                  -Body $body | Out-Null
            } catch {
                Write-Host "Failed to reach the server. Is FastAPI running?" -ForegroundColor Red
                exit
            }
            
            # Wait 0.5 seconds before lighting the next one
            Start-Sleep -Milliseconds 500
        }
    }
}

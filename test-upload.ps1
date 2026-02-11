$filePath = "c:\Users\lf\proyectos\bootie-dev\raw_docs\Nomina Cantv año 2026.docx"
$uri = "http://localhost:3000/api/admin/upload"

# Credenciales
$credentials = "admin:bootie2026"
$encodedAuth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($credentials))

# Leer archivo
$fileBytes = [System.IO.File]::ReadAllBytes($filePath)
$fileName = [System.IO.Path]::GetFileName($filePath)

# Crear boundary para multipart/form-data
$boundary = [System.Guid]::NewGuid().ToString()

# Crear el cuerpo de la petición
$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
    "Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "",
    [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileBytes),
    "--$boundary--"
)

$body = $bodyLines -join "`r`n"

# Headers
$headers = @{
    "x-admin-auth" = $encodedAuth
    "Content-Type" = "multipart/form-data; boundary=$boundary"
}

try {
    $response = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body $body -UseBasicParsing
    Write-Host "✅ SUCCESS - Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "❌ ERROR - Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Error: $($_.Exception.Message)"
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response Body: $responseBody"
}

param(
    [string]$S3Bucket,
    [string]$S3Region = "us-east-1"
)

if ([string]::IsNullOrWhiteSpace($S3Bucket)) {
    throw "Provide -S3Bucket <bucket-name>."
}

$accessKeyId = Read-Host "AWS Access Key ID"
$secretSecure = Read-Host "AWS Secret Access Key" -AsSecureString
$secretPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretSecure)
$secretAccessKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPtr)

try {
    [Environment]::SetEnvironmentVariable("APP_S3_ENABLED", "true", "User")
    [Environment]::SetEnvironmentVariable("APP_S3_BUCKET", $S3Bucket, "User")
    [Environment]::SetEnvironmentVariable("APP_S3_REGION", $S3Region, "User")
    [Environment]::SetEnvironmentVariable("APP_S3_KEY_PREFIX", "diagrams", "User")
    [Environment]::SetEnvironmentVariable("AWS_ACCESS_KEY_ID", $accessKeyId, "User")
    [Environment]::SetEnvironmentVariable("AWS_SECRET_ACCESS_KEY", $secretAccessKey, "User")
    Write-Host "Saved S3/AWS variables to User environment. Open a new terminal before running the app."
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPtr)
}

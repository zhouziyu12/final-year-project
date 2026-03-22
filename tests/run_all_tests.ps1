# Test Suite Runner v2
# Runs all test suites and generates a summary report

Write-Host "`n====================================" -ForegroundColor Cyan
Write-Host "  AI Provenance Test Suite Runner v2" -ForegroundColor Cyan
Write-Host "  Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

$testResults = @()

# Test 1: Smart Contracts (v2 - main test suite)
Write-Host "`n[1/4] Running v2 Smart Contract Tests (Sepolia + BSC)..." -ForegroundColor Yellow
try {
    node scripts/test_contracts.cjs
    if ($LASTEXITCODE -eq 0) {
        $testResults += @{Name="v2 Smart Contracts"; Status="PASS"}
    } else {
        $testResults += @{Name="v2 Smart Contracts"; Status="FAIL"}
    }
} catch {
    Write-Host "Error running smart contract tests: $_" -ForegroundColor Red
    $testResults += @{Name="v2 Smart Contracts"; Status="ERROR"}
}

# Test 2: ZK Proof System
Write-Host "`n[2/4] Running ZK Proof Tests..." -ForegroundColor Yellow
try {
    node test_zk_proof.js
    if ($LASTEXITCODE -eq 0) {
        $testResults += @{Name="ZK Proof System"; Status="PASS"}
    } else {
        $testResults += @{Name="ZK Proof System"; Status="FAIL"}
    }
} catch {
    Write-Host "Error running ZK proof tests: $_" -ForegroundColor Red
    $testResults += @{Name="ZK Proof System"; Status="ERROR"}
}

# Test 3: SDK and Backend
Write-Host "`n[3/4] Running SDK and Backend Tests..." -ForegroundColor Yellow
try {
    python test_sdk_backend.py
    if ($LASTEXITCODE -eq 0) {
        $testResults += @{Name="SDK and Backend"; Status="PASS"}
    } else {
        $testResults += @{Name="SDK and Backend"; Status="FAIL"}
    }
} catch {
    Write-Host "Error running SDK tests: $_" -ForegroundColor Red
    $testResults += @{Name="SDK and Backend"; Status="ERROR"}
}

# Generate Summary Report
Write-Host "`n====================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

$summary = @{
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    version = "2.0.0"
    suites = @()
}

foreach ($result in $testResults) {
    $icon = if ($result.Status -eq "PASS") { "PASS" } elseif ($result.Status -eq "FAIL") { "FAIL" } else { "ERROR" }
    $color = if ($result.Status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "$icon $($result.Name)" -ForegroundColor $color

    # Load detailed results
    $resultFile = switch ($result.Name) {
        "v2 Smart Contracts" { "test_results.json" }
        "ZK Proof System" { "results_zk_proof.json" }
        "SDK and Backend" { "results_sdk_backend.json" }
    }

    if (Test-Path $resultFile) {
        $details = Get-Content $resultFile | ConvertFrom-Json
        $summary.suites += $details
    }
}

# Save summary
$summaryPath = "test_summary.json"
$summary | ConvertTo-Json -Depth 10 | Out-File $summaryPath -Encoding UTF8
Write-Host "`nSummary saved to: $summaryPath" -ForegroundColor Green

# Generate HTML Report
$htmlReport = @"
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test Report - AI Provenance System v2</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; background: #f6f8fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { color: #24292f; border-bottom: 2px solid #d0d7de; padding-bottom: 16px; }
        h2 { color: #0969da; margin-top: 32px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 24px 0; }
        .stat-card { background: #f6f8fa; padding: 20px; border-radius: 8px; border: 1px solid #d0d7de; }
        .stat-value { font-size: 32px; font-weight: 700; color: #24292f; }
        .stat-label { font-size: 14px; color: #57606a; margin-top: 4px; }
        .test-item { padding: 12px; margin: 8px 0; border-left: 4px solid #d0d7de; background: #f6f8fa; border-radius: 4px; }
        .test-item.pass { border-left-color: #1a7f37; }
        .test-item.fail { border-left-color: #cf222e; }
        .test-item.warn { border-left-color: #f59e0b; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .status.pass { background: #dafbe1; color: #1a7f37; }
        .status.fail { background: #ffebe9; color: #cf222e; }
        .status.warn { background: #fff8e1; color: #f59e0b; }
        .timestamp { color: #57606a; font-size: 14px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #dafbe1; color: #1a7f37; }
    </style>
</head>
<body>
    <div class="container">
        <h1>AI Provenance System v2 - Test Report</h1>
        <span class="badge">v2.0.0</span>
        <p class="timestamp">Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')</p>
"@

# Calculate totals
$totalPassed = 0
$totalFailed = 0
$totalWarned = 0
$totalTests = 0

foreach ($suite in $summary.suites) {
    if ($suite.summary) {
        $totalPassed += $suite.summary.passed
        $totalFailed += $suite.summary.failed
        $totalWarned += $suite.summary.warned
        $totalTests += $suite.summary.total
    }
}

$htmlReport += @"
        <div class="summary">
            <div class="stat-card">
                <div class="stat-value" style="color: #1a7f37;">$totalPassed</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #cf222e;">$totalFailed</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #f59e0b;">$totalWarned</div>
                <div class="stat-label">Warnings</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">$totalTests</div>
                <div class="stat-label">Total Tests</div>
            </div>
        </div>
"@

# Add detailed results
foreach ($suite in $summary.suites) {
    $htmlReport += "<h2>$($suite.suite)</h2>"

    if ($suite.summary) {
        $htmlReport += "<p><strong>Result: $($suite.summary.passed)/$($suite.summary.total) passed</strong></p>"
    }

    if ($suite.Sepolia) {
        $htmlReport += "<h3>Sepolia</h3>"
        foreach ($test in $suite.Sepolia) {
            $statusClass = if ($test.status -eq "PASS") { "pass" } elseif ($test.status -eq "FAIL") { "fail" } else { "warn" }
            $htmlReport += @"
            <div class="test-item $statusClass">
                <strong>$($test.name)</strong>
                <span class="status $statusClass">$($test.status)</span>
                <div style="margin-top: 8px; color: #57606a; font-size: 14px;">$($test.msg)</div>
            </div>
"@
        }
    }

    if ($suite.'BSC-Testnet') {
        $htmlReport += "<h3>BSC-Testnet</h3>"
        foreach ($test in $suite.'BSC-Testnet') {
            $statusClass = if ($test.status -eq "PASS") { "pass" } elseif ($test.status -eq "FAIL") { "fail" } else { "warn" }
            $htmlReport += @"
            <div class="test-item $statusClass">
                <strong>$($test.name)</strong>
                <span class="status $statusClass">$($test.status)</span>
                <div style="margin-top: 8px; color: #57606a; font-size: 14px;">$($test.msg)</div>
            </div>
"@
        }
    }
}

$htmlReport += @"
    </div>
</body>
</html>
"@

$htmlPath = "test_report.html"
$htmlReport | Out-File $htmlPath -Encoding UTF8
Write-Host "HTML report saved to: $htmlPath" -ForegroundColor Green

Write-Host "`n====================================`n" -ForegroundColor Cyan

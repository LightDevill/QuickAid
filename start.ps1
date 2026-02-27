Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   QUICKAID - Starting All Services"      -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 0. Kill any existing node processes on port 8080
Write-Host "[0/4] Cleaning up old processes..." -ForegroundColor Yellow
try {
    taskkill /F /IM node.exe 2>$null | Out-Null
    Write-Host "      Old processes killed" -ForegroundColor Green
} catch {
    Write-Host "      No old processes found" -ForegroundColor Green
}
Start-Sleep -Seconds 2

# 1. Start PostgreSQL
Write-Host "[1/4] Starting PostgreSQL..." -ForegroundColor Yellow
try {
    # Try Windows service first
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    if ($pgService) {
        if ($pgService.Status -ne "Running") {
            Start-Service $pgService.Name
        }
        Write-Host "      PostgreSQL running (Windows service)" -ForegroundColor Green
    } else {
        # Try Docker
        $pgDocker = docker ps -a --filter "name=postgres" --format "{{.Names}}" 2>$null
        if ($pgDocker) {
            docker start $pgDocker 2>$null | Out-Null
            Write-Host "      PostgreSQL running (Docker)" -ForegroundColor Green
        } else {
            # Check for any postgres-like container
            $pgAny = docker ps -a --format "{{.Names}}" 2>$null | Select-String -Pattern "post|pg"
            if ($pgAny) {
                docker start $pgAny 2>$null | Out-Null
                Write-Host "      PostgreSQL running (Docker: $pgAny)" -ForegroundColor Green
            } else {
                # Create new PostgreSQL container
                Write-Host "      Creating new PostgreSQL container..." -ForegroundColor Yellow
                docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=quickaid postgres:16 2>$null | Out-Null
                Write-Host "      PostgreSQL created and started" -ForegroundColor Green
                Write-Host "      NOTE: You may need to run migrations!" -ForegroundColor Yellow
            }
        }
    }
} catch {
    Write-Host "      Failed to start PostgreSQL: $_" -ForegroundColor Red
}

# 2. Start Redis
Write-Host "[2/4] Starting Redis..." -ForegroundColor Yellow
try {
    $redisCheck = docker ps -a --filter "name=redis" --format "{{.Names}}" 2>$null
    if ($redisCheck -eq "redis") {
        docker start redis 2>$null | Out-Null
        Write-Host "      Redis started" -ForegroundColor Green
    } else {
        docker run -d --name redis -p 6379:6379 redis:7 2>$null | Out-Null
        Write-Host "      Redis created and started" -ForegroundColor Green
    }
} catch {
    Write-Host "      Failed to start Redis: $_" -ForegroundColor Red
}

# 3. Wait for services
Write-Host "[3/4] Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host "      Ready" -ForegroundColor Green

# 4. Start Backend
Write-Host "[4/4] Starting Backend Server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   All services started!"                 -ForegroundColor Cyan
Write-Host "   Backend: http://localhost:5000"         -ForegroundColor Cyan
Write-Host "   Frontend: Run 'npm run dev' in"        -ForegroundColor Cyan
Write-Host "   frontend folder (new terminal)"         -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path "$PSScriptRoot\backend"
node server.js

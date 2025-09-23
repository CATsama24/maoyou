@echo off
chcp 65001 >nul
title 2D战斗游戏服务器
color 0A
echo.
echo  ========================================
echo  🎮 2D俯视角战斗游戏 Demo
echo  ========================================
echo.
echo  正在启动服务器...
echo.

REM 创建临时的PowerShell脚本文件
echo # 2D战斗游戏服务器 > temp.ps1
echo Write-Host "🎮 启动2D战斗游戏..." -ForegroundColor Green >> temp.ps1
echo $port = 8000 >> temp.ps1
echo $listener = New-Object System.Net.HttpListener >> temp.ps1
echo $listener.Prefixes.Add("http://localhost:$port/") >> temp.ps1
echo try { >> temp.ps1
echo     $listener.Start() >> temp.ps1
echo     Write-Host "✅ 服务器启动成功！" -ForegroundColor Green >> temp.ps1
echo     Write-Host "🌐 游戏地址: http://localhost:$port/index.html" -ForegroundColor Cyan >> temp.ps1
echo     Write-Host "⏹️  按 Ctrl+C 停止" -ForegroundColor Yellow >> temp.ps1
echo     Start-Process "http://localhost:$port/index.html" >> temp.ps1
echo     while ($listener.IsListening) { >> temp.ps1
echo         $context = $listener.GetContext() >> temp.ps1
echo         $request = $context.Request >> temp.ps1
echo         $response = $context.Response >> temp.ps1
echo         $response.Headers.Add("Access-Control-Allow-Origin", "*") >> temp.ps1
echo         $localPath = $request.Url.LocalPath >> temp.ps1
echo         if ($localPath -eq "/") { $localPath = "/index.html" } >> temp.ps1
echo         $filePath = Join-Path (Get-Location) $localPath.TrimStart("/") >> temp.ps1
echo         if (Test-Path $filePath) { >> temp.ps1
echo             $content = [System.IO.File]::ReadAllBytes($filePath) >> temp.ps1
echo             $response.ContentLength64 = $content.Length >> temp.ps1
echo             $response.OutputStream.Write($content, 0, $content.Length) >> temp.ps1
echo         } else { >> temp.ps1
echo             $response.StatusCode = 404 >> temp.ps1
echo             $html = "<html><body><h1>404</h1><p>文件未找到: " + $localPath + "</p></body></html>" >> temp.ps1
echo             $bytes = [System.Text.Encoding]::UTF8.GetBytes($html) >> temp.ps1
echo             $response.ContentLength64 = $bytes.Length >> temp.ps1
echo             $response.OutputStream.Write($bytes, 0, $bytes.Length) >> temp.ps1
echo         } >> temp.ps1
echo         $response.OutputStream.Close() >> temp.ps1
echo     } >> temp.ps1
echo } catch { >> temp.ps1
echo     Write-Host "❌ 启动失败:" $_.Exception.Message -ForegroundColor Red >> temp.ps1
echo } finally { >> temp.ps1
echo     if ($listener.IsListening) { $listener.Stop() } >> temp.ps1
echo     Write-Host "🛑 服务器已停止" -ForegroundColor Yellow >> temp.ps1
echo } >> temp.ps1

REM 运行PowerShell脚本
powershell -ExecutionPolicy Bypass -File "temp.ps1"

REM 清理临时文件
if exist temp.ps1 del temp.ps1

echo.
echo  服务器已停止
pause

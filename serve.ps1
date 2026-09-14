# 本地开发静态服务器：把 demo 目录作为根，供浏览器加载（须经 HTTP，file:// 无法处理 ?v= 缓存参数）。
# 用法：npm run serve  或  powershell -ExecutionPolicy Bypass -File demo/serve.ps1
$root = $PSScriptRoot
$log  = Join-Path $root 'logs\serve.log'
if (-not (Test-Path (Split-Path $log))) { New-Item -ItemType Directory -Path (Split-Path $log) -Force | Out-Null }
$port = 8080
try {
  $l = New-Object System.Net.HttpListener
  $l.Prefixes.Add("http://localhost:$port/")
  $l.Start()
  "started $(Get-Date) on http://localhost:$port (root=$root)" | Out-File $log
  Write-Host "serving http://localhost:$port  (root=$root)"
  while ($true) {
    $c = $l.GetContext()
    $p = $c.Request.Url.LocalPath
    if ($p -eq '/') { $p = '/index.html' }
    $f = Join-Path $root $p.TrimStart('/')
    if (Test-Path $f -PathType Leaf) {
      $ext = [IO.Path]::GetExtension($f).TrimStart('.')
      $map = @{ html='text/html'; js='application/javascript'; css='text/css'; png='image/png'; webp='image/webp'; md='text/plain'; mp3='audio/mpeg' }
      $ct = $map[$ext]; if (-not $ct) { $ct = 'application/octet-stream' }
      $b = [IO.File]::ReadAllBytes($f)
      $c.Response.ContentType = $ct
      $c.Response.OutputStream.Write($b, 0, $b.Length)
    } else {
      $c.Response.StatusCode = 404
    }
    $c.Response.Close()
  }
} catch {
  "ERR $($_.Exception.Message)" | Out-File $log -Append
  Write-Host "ERR $($_.Exception.Message)"
}
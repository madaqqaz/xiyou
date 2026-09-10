@echo off
REM 在用户自己的电脑上双击此文件，即可把《逆道西行》公网隧道设为开机自启。
REM （本文件仅在你的真实 Windows 上运行；WorkBuddy 沙箱内 schtasks 被禁用，故不能由 AI 直接注册。）
schtasks /Create /TN "CloudGameTunnel" /TR "D:\xiyou\demo\cf_tunnel_loop.bat" /SC ONLOGON /RL HIGHEST /F
if %errorlevel%==0 (
  echo [OK] 已创建开机自启任务 CloudGameTunnel（下次登录/重启后自动连接公网隧道）。
) else (
  echo [失败] 创建任务失败，请确认以管理员身份运行，或手动把 cf_tunnel_loop.bat 拖入启动文件夹：
  echo        %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
)
pause

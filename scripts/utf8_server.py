#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自定义HTTP服务器，确保所有文本文件以UTF-8编码返回
解决中文乱码问题
"""

import http.server
import socketserver
import os
import sys
from urllib.parse import unquote

PORT = 8099
DEMO_PATH = r"D:\xiyou\demo"

# MIME类型映射
MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
}

class UTF8HTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """自定义HTTP请求处理器，确保UTF-8编码"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DEMO_PATH, **kwargs)
    
    def end_headers(self):
        # 添加CORS头，允许跨域请求
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def guess_type(self, path):
        """根据文件扩展名猜测MIME类型"""
        _, ext = os.path.splitext(path)
        ext = ext.lower()
        if ext in MIME_TYPES:
            return MIME_TYPES[ext]
        # 默认使用application/octet-stream
        return 'application/octet-stream'
    
    def do_OPTIONS(self):
        """处理OPTIONS请求（CORS预检）"""
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        """自定义日志格式，减少输出"""
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), format % args))

def main():
    """主函数"""
    os.chdir(DEMO_PATH)
    
    # 设置端口重用
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", PORT), UTF8HTTPRequestHandler) as httpd:
        print("=" * 60)
        print("逆道西行 - UTF-8 HTTP服务器")
        print("=" * 60)
        print(f"服务器地址: http://localhost:{PORT}")
        print(f"工作目录: {DEMO_PATH}")
        print(f"编码: UTF-8 (所有文本文件)")
        print("=" * 60)
        print("按 Ctrl+C 停止服务器")
        print("=" * 60)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")
            httpd.server_close()

if __name__ == "__main__":
    main()

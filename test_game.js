// 游戏流程自动化测试脚本
// 使用Node.js模拟游戏流程

const http = require('http');

function testServer(port) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: '/index.html',
            method: 'GET'
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({
                    port: port,
                    status: res.statusCode,
                    size: data.length,
                    hasTitle: data.includes('逆道西行'),
                    hasScripts: (data.match(/<script/g) || []).length
                });
            });
        });
        
        req.on('error', (e) => {
            reject({ port: port, error: e.message });
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            reject({ port: port, error: 'Timeout' });
        });
        
        req.end();
    });
}

async function main() {
    const ports = [8099, 8400, 8096];
    
    console.log('=== 游戏服务器测试 ===\n');
    
    for (const port of ports) {
        try {
            const result = await testServer(port);
            console.log(`端口 ${port}:`);
            console.log(`  状态: ${result.status}`);
            console.log(`  页面大小: ${result.size} 字节`);
            console.log(`  包含标题: ${result.hasTitle ? '是' : '否'}`);
            console.log(`  脚本数量: ${result.hasScripts}`);
            console.log('');
        } catch (e) {
            console.log(`端口 ${port}: 连接失败 - ${e.error}\n`);
        }
    }
}

main().catch(console.error);

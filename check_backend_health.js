const http = require('http');

http.get('http://127.0.0.1:5002', (res) => {
    console.log(`Backend is LIVE! Status: ${res.statusCode}`);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
}).on('error', (e) => {
    console.error(`Backend is OFFLINE: ${e.message}`);
});

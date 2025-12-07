const express = require('express');
const http = require('http');
const fs = require('fs');

const LOG_FILE = 'reliability_log.txt';
const DURATION_MS = 185000; // > 180 seconds
const INTERVAL_MS = 2000; // Ping every 2 seconds

fs.writeFileSync(LOG_FILE, `Starting reliability test at ${new Date().toISOString()}\n`);

const app = express();
app.get('/ping', (req, res) => res.send('pong'));

const server = app.listen(5001, '127.0.0.1', () => {
    console.log('Reliability Server started on 5001');
    fs.appendFileSync(LOG_FILE, 'Server started on port 5001\n');

    let pings = 0;
    const interval = setInterval(() => {
        const start = Date.now();
        const req = http.get('http://127.0.0.1:5001/ping', (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                const duration = Date.now() - start;
                fs.appendFileSync(LOG_FILE, `Ping ${++pings}: Success (${duration}ms)\n`);
            });
        });

        req.on('error', (e) => {
            fs.appendFileSync(LOG_FILE, `Ping ${++pings}: Failed (${e.message})\n`);
        });

    }, INTERVAL_MS);

    // Stop after duration
    setTimeout(() => {
        clearInterval(interval);
        server.close();
        fs.appendFileSync(LOG_FILE, `Test completed at ${new Date().toISOString()}\n`);
        console.log('Test completed');
        process.exit(0);
    }, DURATION_MS);
});

server.on('error', (e) => {
    fs.appendFileSync(LOG_FILE, `Server Error: ${e.message}\n`);
    console.error(e);
    process.exit(1);
});

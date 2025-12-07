const express = require('express');
const http = require('http');
const fs = require('fs');

const app = express();
app.get('/', (req, res) => res.send('OK'));

const server = app.listen(5000, '127.0.0.1', () => {
    console.log('Server started');
    fs.writeFileSync('diag_result.txt', 'Server started\n');

    const req = http.get('http://127.0.0.1:5000', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            fs.appendFileSync('diag_result.txt', `Response: ${data}\n`);
            server.close();
            process.exit(0);
        });
    });

    req.on('error', (e) => {
        fs.appendFileSync('diag_result.txt', `Error: ${e.message}\n`);
        server.close();
        process.exit(1);
    });
});

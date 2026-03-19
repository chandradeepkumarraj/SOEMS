import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

dotenv.config();

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

async function checkBackend() {
    console.log(`${colors.bright}${colors.cyan}=== SOEMS Backend Integrity Diagnostic ===${colors.reset}\n`);

    // 1. Environment Variables
    console.log(`${colors.bright}1. Checking Environment Configuration...${colors.reset}`);
    const required = ['PORT', 'MONGO_URI', 'JWT_SECRET'];
    let envOk = true;
    required.forEach(key => {
        if (process.env[key]) {
            console.log(`  ✅ ${key} is defined.`);
        } else {
            console.log(`  ❌ ${key} is MISSING!`);
            envOk = false;
        }
    });

    // 2. Database Connectivity
    console.log(`\n${colors.bright}2. Testing Database Connectivity...${colors.reset}`);
    const mongoUri = process.env.MONGO_URI || '';
    if (mongoUri) {
        try {
            await mongoose.connect(mongoUri);
            console.log(`  ✅ Successfully connected to MongoDB.`);
            await mongoose.disconnect();
        } catch (err: any) {
            console.log(`  ❌ Failed to connect to MongoDB: ${err.message}`);
        }
    } else {
        console.log(`  ⚠️ Skipping DB test (No URI).`);
    }

    // 3. Directory Structure
    console.log(`\n${colors.bright}3. Verifying File System...${colors.reset}`);
    const uploadsPath = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsPath)) {
        console.log(`  ✅ /uploads directory exists.`);
    } else {
        console.log(`  ⚠️ /uploads directory is missing. Creating it...`);
        fs.mkdirSync(uploadsPath);
        console.log(`  ✅ Created /uploads.`);
    }

    // 4. Server Ping (If running)
    const port = process.env.PORT || 5001;
    console.log(`\n${colors.bright}4. Pinging Live Server (Port ${port})...${colors.reset}`);
    try {
        const res = await axios.get(`http://localhost:${port}/`);
        console.log(`  ✅ Server is ACTIVE: "${res.data}"`);
    } catch (err: any) {
        console.log(`  ⚠️ Server is not reachable on localhost:${port}. (It may be offline)`);
    }

    // 5. Build Status
    console.log(`\n${colors.bright}5. Checking Build Artifacts...${colors.reset}`);
    if (fs.existsSync(path.join(__dirname, 'dist', 'server.js'))) {
        console.log(`  ✅ Build (dist/server.js) found.`);
    } else {
        console.log(`  ❌ Build NOT found. Run 'npm run build' first.`);
    }

    console.log(`\n${colors.bright}${colors.cyan}=== Diagnostic Complete ===${colors.reset}`);
}

checkBackend();

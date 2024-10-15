const { Worker } = require('worker_threads');
const sql = require('mssql');
const path = require('path');
const fs = require('fs');
// Database configuration
const dbConfig = {
    user: 'username',
    password: 'pass',
    server: 'hostname',
    database: 'db_name',
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    requestTimeout: 300000,
    connectionTimeout: 300000
};

// Worker pool size (10 workers)
const MAX_WORKERS = 10;
let activeWorkers = 0;

// Store backup files in the backups directory
const backupDir = path.join(__dirname, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// Function to assign tables to workers
async function backupTables() {
    try {
        // Connect to SQL Server
        await sql.connect(dbConfig);

        // Retrieve all table names
        const tablesResult = await sql.query`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`;
        const tables = tablesResult.recordset.map(row => row.TABLE_NAME);

        let currentTableIndex = 0;

        // Create workers and assign tables
        function createWorker() {
            if (currentTableIndex >= tables.length) {
                return;
            }

            if (activeWorkers < MAX_WORKERS) {
                const tableName = tables[currentTableIndex];
                console.log(`Starting worker for table: ${tableName}`);
                currentTableIndex++;
                activeWorkers++;

                const worker = new Worker('./worker.js', {
                    workerData: { tableName, dbConfig, backupDir }
                });

                worker.on('message', (msg) => {
                    console.log(`Worker for table ${msg.tableName} finished. File saved: ${msg.backupFile}`);
                    activeWorkers--;

                    // Start a new worker for the next table
                    createWorker();
                });

                worker.on('error', (err) => {
                    console.error(`Worker error: ${err.message}`);
                    activeWorkers--;

                    // Start a new worker for the next table
                    createWorker();
                });

                worker.on('exit', (code) => {
                    if (code !== 0) {
                        console.error(`Worker stopped with exit code ${code}`);
                    }
                });

                // Start the next worker if possible
                createWorker();
            }
        }

        // Start the initial batch of workers
        for (let i = 0; i < MAX_WORKERS; i++) {
            createWorker();
        }

    } catch (err) {
        console.error('Error backing up tables:', err);
    }
}

// Run the backup process
backupTables();

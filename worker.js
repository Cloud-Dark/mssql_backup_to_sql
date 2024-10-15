const { parentPort, workerData } = require('worker_threads');
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const { tableName, dbConfig, backupDir } = workerData;

// Function to generate CREATE TABLE SQL schema
async function createSchema(tableName) {
    const query = `
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '${tableName}'`;

    const result = await sql.query(query);
    const columns = result.recordset;

    let createTableSQL = `CREATE TABLE ${tableName} (\n`;

    columns.forEach((column, index) => {
        const columnDef = `${column.COLUMN_NAME} ${column.DATA_TYPE.toUpperCase()}${column.CHARACTER_MAXIMUM_LENGTH ? `(${column.CHARACTER_MAXIMUM_LENGTH})` : ''}`;
        createTableSQL += columnDef;

        if (index < columns.length - 1) {
            createTableSQL += ',\n';
        }
    });

    createTableSQL += '\n);\n';
    return createTableSQL;
}

// Function to generate INSERT INTO statements for table data
async function insertData(tableName) {
    const query = `SELECT * FROM ${tableName}`;
    const result = await sql.query(query);
    const rows = result.recordset;

    if (rows.length === 0) {
        return '';  // No data in table
    }

    const columns = Object.keys(rows[0]);
    let insertSQL = '';

    rows.forEach(row => {
        let values = columns.map(column => {
            const value = row[column];
            if (value === null) {
                return 'NULL';
            } else if (typeof value === 'string') {
                return `'${value.replace(/'/g, "''")}'`;  // Escape single quotes
            } else {
                return value;
            }
        }).join(', ');

        insertSQL += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});\n`;
    });

    return insertSQL;
}

// Main function to handle backup for the given table
async function backupTable() {
    try {
        // Connect to SQL Server
        await sql.connect(dbConfig);

        // Generate schema and data SQL
        const schemaSQL = await createSchema(tableName);
        const dataSQL = await insertData(tableName);

        // Combine schema and data SQL
        const backupSQL = `${schemaSQL}\n${dataSQL}`;

        // Save to .sql file
        const backupFile = path.join(backupDir, `${tableName}.sql`);
        fs.writeFileSync(backupFile, backupSQL);

        // Notify main thread that the worker is done
        parentPort.postMessage({ tableName, backupFile });

    } catch (err) {
        parentPort.postMessage({ error: err.message });
    } finally {
        sql.close();
    }
}

// Execute the backup for this worker
backupTable();

# Database Backup Tool

This project is a multi-threaded tool to back up SQL Server tables by creating SQL dump files containing both schema and data for each table. It utilizes Node.js, the `worker_threads` module, and `mssql` to efficiently handle the backup process with multiple workers.

## Features

- **Multi-threaded Backup**: The tool creates up to 10 worker threads to concurrently back up tables, speeding up the backup process.
- **SQL Dump Files**: For each table, both the schema (via `CREATE TABLE` statements) and data (via `INSERT INTO` statements) are dumped into a `.sql` file.
- **Automatic Directory Creation**: The backup files are stored in the `backups` directory, which is created automatically if it doesn't exist.
- **Error Handling**: Each worker logs errors and stops gracefully if an issue occurs.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/dbbackup.git
   cd dbbackup
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

   The project depends on the following packages:
   - `fs`: For file system operations.
   - `mssql`: For connecting to SQL Server and executing queries.

   Dependencies are listed in the `package.json` file:
   ```json
   {
     "dependencies": {
       "fs": "^0.0.1-security",
       "mssql": "^11.0.1"
     }
   }
   ```

## Usage

1. **Database Configuration**: 
   In the `backupTables.js` file, update the `dbConfig` object with your SQL Server credentials:
   ```javascript
   const dbConfig = {
       user: 'your-username',
       password: 'your-password',
       server: 'your-server',
       database: 'your-database',
       options: {
           encrypt: false,
           trustServerCertificate: true
       }
   };
   ```

2. **Run the Backup**:
   To start the backup process, run:
   ```bash
   node backupTables.js
   ```

   This will start the process of backing up all tables in the specified database. For each table, a `.sql` file containing the schema and data will be generated in the `backups` directory.

## Worker Process

The backup process uses worker threads to handle each table individually:

- **`backupTables.js`**: Main file responsible for creating worker threads and managing table assignments.
- **`worker.js`**: Each worker retrieves the schema and data for its assigned table and writes the output to a `.sql` file.

## Error Handling

If a worker encounters an error during the backup process, it will log the error and attempt to proceed with the next table. You can monitor the console output for any errors that occur during execution.

## License

This project is licensed under the ISC License.


This `README.md` outlines the purpose of your project, how to set it up, and how to run it. Let me know if you need further adjustments!
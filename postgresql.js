/* PostreSQL */
const pgsync = require('pg-sync');

class PostgreSQL_Database {
    constructor (host, port, database, clientOptions={}) {
        this.client = new pgsync.Client(clientOptions);
        client.connect(`host=${host} port=${port} dbname=${database}`);
        
        this.client.begin();
        this.client.setIsolationLevelSerializable();
        
        // this.client.query(queryText, [params]); -> execute command with SELECT *
        // (this.client.prepare(queryText)).execute([params]); -> execute command without SELECT *
    }
}

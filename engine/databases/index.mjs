import sqlite3 from 'sqlite3';

const { Database } = sqlite3.verbose(); // Using destructuring to get Database


class DBManager {
    static getInstance(){
        const r = new DBManager();
        return r;
    }
    
    async connectAppDB(appInfo){
        return new Promise( (resolve, reject)=>{
            // Open a new database connection (creates a file if it doesn't exist)
            const db = new Database(`${appInfo.path}/appdb.sqlite`, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(db)
                }
            });
        })                
    }
}

const dbManager = DBManager.getInstance();

export default dbManager;

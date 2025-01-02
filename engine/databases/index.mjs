import sqlite3 from 'sqlite3';
import { open } from 'sqlite'
import fs from 'fs';

const { Database } = sqlite3.verbose(); // Using destructuring to get Database


class DBManager {
    static getInstance(){
        const r = new DBManager();
        return r;
    }
    
    async connectAppDB(appInfo){
        fs.mkdirSync(appInfo.path, { recursive: true });
        const db = await open({
            filename: `${appInfo.path}/appdb.sqlite`,
            driver: sqlite3.Database
        })
        return db;
        // return new Promise( (resolve, reject)=>{
        //     fs.mkdirSync(appInfo.path, { recursive: true });
        //     // Open a new database connection (creates a file if it doesn't exist)
            
        //     const db = new Database(`${appInfo.path}/appdb.sqlite`, (err) => {
        //         if (err) {
        //             reject(err);
        //         } else {
        //             resolve(db)
        //         }
        //     });
        // })                
    }
}

const dbManager = DBManager.getInstance();

export default dbManager;

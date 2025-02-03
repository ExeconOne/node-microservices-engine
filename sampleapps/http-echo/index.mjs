import { dbInit } from './db/index.mjs';

export default (app, basePath, appDb, logger) => {
    
    logger.log(`Starting HTTPECHO at ${basePath}`);
    // logger.log(`Starting Adi-Proxy`)

    (async()=>{
        // appDb.run("CREATE TABLE IF NOT EXISTS config (name TEXT PRIMARY KEY, value TEXT)");
        await dbInit(appDb);        
        app.use(`${basePath}`, (req, res) => {

            // Filter headers that match the condition
            const ADIHeaders = Object.entries(req.headers)
            .filter(([key, value]) => key.toLowerCase().startsWith('x-adi'))
            .reduce((obj, [key, value]) => {
                obj[key] = value; // Create a new object with the matching headers
                return obj;
            }, {});            
            
            logger.log(`Received ADI headers`, JSON.stringify(ADIHeaders))
            res.send(ADIHeaders)
        });
    })()
        
    
};
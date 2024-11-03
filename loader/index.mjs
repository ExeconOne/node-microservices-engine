import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
// import vm from 'vm';
import { exec } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';
// import { createRequire } from 'module';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

class AppLoader {
    constructor(){
        this._db = {}
    }

    static getInstance(){
        const r = new AppLoader();
        return r;
    }

    async loadAppArchive(appInfo, rootExpressApp, appDb, logger, zipFilePath){        
        await this._unzipAndLoadHandlers(appInfo, rootExpressApp, zipFilePath)
        await this.loadApp(appInfo, rootExpressApp, appDb, logger);
    }


    async loadApp(appInfo, rootExpressApp, appDb, logger){
        this._db[appInfo.id] = appDb;
        const extractedFiles = fs.readdirSync(appInfo.path);
    
        const packageFile = extractedFiles.find(item=>item=="package.json");
        const handlerFile = extractedFiles.find(item=>item=="index.js");
    
        if(packageFile){
            // const filePath = path.join(extractDir, packageFile);    
            await this._installDependencies(appInfo);    
        }
    
        const basePath = appInfo.urlContext; // Controlled base path for each handler
    
        // Load and sandbox the handler with restricted fs and controlled basePath
        await this._loadHandlerWithRestrictedFs(appInfo, rootExpressApp, appInfo.path, basePath, logger);
    }
    
    // Dynamically load handlers with restricted access
    async _unzipAndLoadHandlers(appInfo, app, zipFilePath){
        // const extractDir = path.join(__dirname, 'temp'); // Temporary extraction directory
        const extractDir = appInfo.path;
        
        fs.mkdirSync(extractDir, { recursive: true });
    
        await fs.createReadStream(zipFilePath)
            .pipe(unzipper.Extract({ path: extractDir }))
            .promise();    
    };
    
    // Function to install dependencies in a specific directory
    async _installDependencies(appInfo){
        const directory = appInfo.path;
        console.log(`Installing dependencies for ${appInfo.id}@${appInfo.version} ...`)
        return new Promise((resolve, reject) => {
          exec(`npm install`, { cwd: directory }, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error installing dependencies: ${stderr}`);
              return reject(error);
            }
            // console.log(stdout);
            console.log(`Installing dependencies for ${appInfo.id}@${appInfo.version} ... DONE.`)
            resolve();
          });
        });
      };
    
    // Load handler with restricted fs and specific base path
    async _loadHandlerWithRestrictedFs(appInfo, app, handlerDir, basePath, logger){
    //   const restrictedFs = createRestrictedFs(handlerDir);
    
        const handlerPath = path.join(handlerDir, 'index.mjs');
        // const handlerCode = fs.readFileSync(handlerPath, 'utf-8');
        const handlerURL = pathToFileURL(handlerPath);
    
        // Import the ESM module dynamically
        const handlerModule = await import(handlerURL);
    
        if (typeof handlerModule.default === 'function') {
            handlerModule.default(app, basePath, this._db[appInfo.id], logger);
            console.log(`App ${appInfo.id}@${appInfo.version} initialized at context ${basePath}`)
        }
    };
}



export default AppLoader;
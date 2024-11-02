import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
// import vm from 'vm';
import { exec } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';
// import { createRequire } from 'module';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

class AppLoader {
    static getInstance(){
        const r = new AppLoader();
        return r;
    }

    async loadApp(appInfo, rootExpressApp, zipFilePath){
        this._unzipAndLoadHandlers(appInfo, rootExpressApp, zipFilePath)
    }
    
    // Dynamically load handlers with restricted access
    async _unzipAndLoadHandlers(appInfo, app, zipFilePath){
        // const extractDir = path.join(__dirname, 'temp'); // Temporary extraction directory
        const extractDir = appInfo.path;
        
        fs.mkdirSync(extractDir, { recursive: true });
    
        await fs.createReadStream(zipFilePath)
            .pipe(unzipper.Extract({ path: extractDir }))
            .promise();
    
        const extractedFiles = fs.readdirSync(extractDir);
    
        const packageFile = extractedFiles.find(item=>item=="package.json");
        const handlerFile = extractedFiles.find(item=>item=="index.js");
    
        if(packageFile){
            // const filePath = path.join(extractDir, packageFile);    
            await this._installDependencies(extractDir);    
        }
    
        const basePath = `/modem`; // Controlled base path for each handler
    
        // Load and sandbox the handler with restricted fs and controlled basePath
        await this._loadHandlerWithRestrictedFs(app, extractDir, basePath);
    
    //   for (const file of extractedFiles) {
    //     const handlerDir = path.join(extractDir, file);
    
    //     // If handler directory contains a package.json, install dependencies
    //     const packagePath = path.join(handlerDir, 'package.json');
    //     if (await fileExists(packagePath)) {
    //       await installDependencies(handlerDir);
    //     }
    
    //     const basePath = `/modem`; // Controlled base path for each handler
    
    //     // Load and sandbox the handler with restricted fs and controlled basePath
    //     await loadHandlerWithRestrictedFs(handlerDir, basePath);
    //   }
    };
    
    // Function to install dependencies in a specific directory
    async _installDependencies(directory){
        console.log(directory)
        return new Promise((resolve, reject) => {
          exec(`npm install`, { cwd: directory }, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error installing dependencies: ${stderr}`);
              return reject(error);
            }
            console.log(stdout);
            resolve();
          });
        });
      };
    
    // Load handler with restricted fs and specific base path
    async _loadHandlerWithRestrictedFs(app, handlerDir, basePath){
    //   const restrictedFs = createRestrictedFs(handlerDir);
    
        const handlerPath = path.join(handlerDir, 'index.js');
        // const handlerCode = fs.readFileSync(handlerPath, 'utf-8');
        const handlerURL = pathToFileURL(handlerPath);
    
        // Import the ESM module dynamically
        const handlerModule = await import(handlerURL);
    
        if (typeof handlerModule.default === 'function') {
            handlerModule.default(app, basePath);
            console.log(`App initialized ${basePath}`)
        }
    };
}

const appLoader = AppLoader.getInstance();

export default appLoader;
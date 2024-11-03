// const express = require('express');
// const fs = require('fs');
// // import { mkdir } from 'node:fs/promises';
// const path = require('path');
// const unzipper = require('unzipper');
// const vm = require('vm');
// const { exec } = require('child_process');

// // import { fileURLToPath, pathToFileURL } from 'url';
// const { pathToFileURL } = require('url');
// const { createRequire } = require('module');

import { fileURLToPath, pathToFileURL } from 'url';

import express from 'express';
import path from 'path';
import AppLoader from "./loader/index.mjs"
import dbManager from "./engine/databases/index.mjs"
import fs from 'fs';

import appGuard from './engine/middleware/app-guard/index.mjs';

// import vm from 'vm';
// import { createRequire } from 'module';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, 'uploads');
const appsDir = path.join(__dirname, 'apps');

const apps = []

// Watch for new files in the `uploads` directory
const watchUploadsDir = (app, apps) => {
    fs.watch(uploadsDir, async (eventType, filename) => {
        if (eventType === 'rename' && filename.endsWith('.zip')) {
            const filePath = path.join(uploadsDir, filename);
            const appName = filename.split(".")[0];
            const appVersion = filename.split(".")[1];
            const appInfo = {
                id: appName,
                version: appVersion,                
            }
            appInfo.path = path.join(__dirname, `apps/${appInfo.id}/${appInfo.version}`)
            appInfo.urlContext = `/${appInfo.id}/${appInfo.version}`   

            if(fs.existsSync(filePath)){                
                console.log(`New zip file detected: ${filename}`);
                
                const appLoader = AppLoader.getInstance();
                // make app dir beforehand
                const appDb = await dbManager.connectAppDB(appInfo)
                await appLoader.loadAppArchive(appInfo, app, appDb, filePath)
                apps.push(appInfo);
            }else{
                // file is removed, so remove application files (can be redeployed later on or will not
                // deploy on next restart)
                console.log(`Going to remove data for : ${filename}`);
                const index = apps.findIndex(item=>item.urlContext == appInfo.urlContext)
                if(index!=-1) apps.splice(index,1);

                fs.rmSync(path.join(__dirname, `apps/${appInfo.id}`), { recursive: true, force: true });
                // remove/block app
                

            }            
        }
    });
};

const readDeployedAppsInfos = (appsDir)=>{
    const appInfos = [];

    // Read the apps directory to get app ID directories
    const appIds = fs.readdirSync(appsDir);
  
    appIds.forEach((appId) => {
      const appDir = path.join(appsDir, appId);
  
      // Check if appDir is a directory
      if (fs.statSync(appDir).isDirectory()) {
        // Read each app directory to get version directories
        const versions = fs.readdirSync(appDir);
  
        versions.forEach((version) => {
          const versionDir = path.join(appDir, version);
  
          // Check if versionDir is a directory
          if (fs.statSync(versionDir).isDirectory()) {            
            const indexFilePath = path.join(versionDir, 'index.mjs');
  
            // Check if index.mjs file exists in the version directory
            if (fs.existsSync(indexFilePath)) {
                const appInfo = {
                    id: appId,
                    version: version,    
                    path: versionDir,
                    urlContext: `/${appId}/${version}`            
                }
                appInfos.push(appInfo);
            //   // Read and print the content of index.mjs
            //   const content = fs.readFileSync(indexFilePath, 'utf-8');
            //   console.log(`Contents of ${indexFilePath}:\n${content}\n`);
            } else {
                console.log(`No index.mjs file found in ${versionDir}`);
            }
          }
        });
      }
    });
    return appInfos;
  }

const loadInstalledApps = async (app, apps) => {
    const appInfos = readDeployedAppsInfos(appsDir);

    for(let i=0; i< appInfos.length; i++){
        const appInfo = appInfos[i];
        const appLoader = AppLoader.getInstance();
        // make app dir beforehand
        const appDb = await dbManager.connectAppDB(appInfo)
            
        appLoader.loadApp(appInfo, app, appDb);
        apps.push(appInfo);
    }
}

app.use(appGuard(apps))

// Start the server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await loadInstalledApps(app, apps);
    watchUploadsDir(app, apps);
  // start existing apps
});

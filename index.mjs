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
import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import AppLoader from "./loader/index.mjs"
import dbManager from "./engine/databases/index.mjs"
import fs from 'fs';
import https from 'https'; // Import https module
import http from 'http'; // Import http module


import appGuard from './engine/middleware/app-guard/index.mjs';
import createLogger from './engine/app-logger/index.mjs';

// import vm from 'vm';
// import { createRequire } from 'module';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const PORT_HTTPS = process.env.PORT_HTTPS || 3443;
//  path to Lets Encrypt generated certs
const CERT_PATH_LE = process.env.CERT_PATH || `certs`
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = process.env.UPLOADS_DIR||path.join(__dirname, 'uploads');
const appsDir = process.env.APPS_DIR||path.join(__dirname, 'apps');

console.log(`Node MS starting at ${__dirname}.`)
console.log(`Uploads location: ${uploadsDir}. You can change it by setting UPLOADS_DIR env variable.`)
console.log(`Apps location: ${appsDir}. You can change it by setting APPS_DIR env variable.`)
console.log(`Certs location: ${CERT_PATH_LE}. You can change it by setting CERT_PATH env variable.`)

const apps = []

const decodeAppNameAndVersion = (filename) => {
  const match = filename.match(/(.+)_v(\d+\.\d+\.\d+)\.zip$/);
  if (match) {
      return { appName: match[1], appVersion: match[2] };
  }
  throw Error(`Invalid package name ${filename}. Must follow APPNAME_vVERSION.zip pattern.`);
} 

// Watch for new files in the `uploads` directory
const watchUploadsDir = (app, apps) => {
    fs.watch(uploadsDir, async (eventType, filename) => {
        if (eventType === 'rename' && filename.endsWith('.zip')) {
            const filePath = path.join(uploadsDir, filename);
            // adi-in-proxy-1.0.6.zip

            const {appName, appVersion} = decodeAppNameAndVersion(filename);
            


            const appInfo = {
                id: appName,
                version: appVersion,                
            }
            appInfo.path = `${appsDir}/${appInfo.id}/${appInfo.version}`;
            appInfo.urlContext = `/${appInfo.id}/${appInfo.version}`   

            if(fs.existsSync(filePath)){                
                console.log(`New zip file detected: ${filename}`);
                
                // const appLoader = AppLoader.getInstance();
                // // make app dir beforehand
                // const appDb = await dbManager.connectAppDB(appInfo)
                // const logger = createLogger(appInfo)
                // await appLoader.loadAppArchive(appInfo, app, appDb, logger, filePath)
                try{
                  await loadApp(appInfo, app, filePath);
                  apps.push(appInfo);
                }catch(error){
                  console.error(`Eroor loading app ${JSON.stringify(appInfo)}`, error);
                }
                
            }else{
                // file is removed, so remove application files (can be redeployed later on or will not
                // deploy on next restart)
                console.log(`Going to remove data for : ${filename} ...`);
                const index = apps.findIndex(item=>item.urlContext == appInfo.urlContext)
                if(index!=-1) apps.splice(index,1);

                fs.rmSync(path.join(__dirname, `apps/${appInfo.id}`), { recursive: true, force: true });
                console.log(`Going to remove data for : ${filename} ... DONE`);
                

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
    console.log(`Detected ${appInfos.length} apps`)
    appInfos.forEach(item=>console.log(`${item.id}-${item.version}`))
    return appInfos;
  }

const loadInstalledApps = async (app, apps) => {
    const appInfos = readDeployedAppsInfos(appsDir);
    console.log(`Going to load installed apps ...`);
    appInfos.forEach(item=>console.log(`${item.id}.v${item.version}`))
    

    for(let i=0; i< appInfos.length; i++){
      try{
        const appInfo = appInfos[i];
        // const appLoader = AppLoader.getInstance();
        // // make app dir beforehand
        // const appDb = await dbManager.connectAppDB(appInfo)
        // const logger = createLogger(appInfo)

        // appLoader.loadApp(appInfo, app, appDb, logger);
        await loadApp(appInfo, app);
        apps.push(appInfo);
      }catch(error){
        console.error(`Error loading app ${JSON.stringify(appInfo)}`, error);
      }
        
    }
    console.log(`Going to load installed apps ... DONE.`);
}

const loadApp = async (appInfo, app, zipFilePath)=>{
  const appLoader = AppLoader.getInstance();
  // make app dir beforehand
  const appDb = await dbManager.connectAppDB(appInfo)
  const logger = createLogger(appInfo)

  appLoader.loadApp(appInfo, app, appDb, logger, zipFilePath);  
}

const loadSSLCerts = (certPath)=>{
  // console.log(path.join(certPath, `privkey.pem`))
  // console.log(path.join(certPath, `fullchain.pem.pem`))
  return {
    key: fs.readFileSync(path.join(certPath, `privkey.pem`)),
    cert: fs.readFileSync(path.join(certPath, `fullchain.pem`))
  }  
}

app.use(appGuard(apps))
app.use(bodyParser.urlencoded({ extended: true, limit: "1000mb" }));
app.use(bodyParser.json({limit: "1000mb"}));

// this is for case when deploying an app that has some major error that
// otherwise would take down whole instance
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);

  // Optionally perform clean-up or logging
  // Decide whether to exit the process or keep it running
});

try{
  const sslOptions = loadSSLCerts(CERT_PATH_LE)

  // Create the HTTPS server instead of app.listen()
  https.createServer(sslOptions, app).listen(PORT_HTTPS, () => {
    (async ()=>{      
      await loadInstalledApps(app, apps);
      watchUploadsDir(app, apps);
      // start existing apps
      console.log(`Node Microservices Api running HTTPS mode on port: ${PORT}/${PORT_HTTPS}`);
      console.log(`New microservices zip packages can be deployed to ${uploadsDir}.`)
      console.log(`Installed ms are running from ${appsDir}`)    
    })()
    
  });

  // Create an HTTP server to redirect all traffic to HTTPS
  http.createServer((req, res) => {
    res.writeHead(301, { 'Location': 'https://' + req.headers['host'] + req.url });
    res.end();
  }).listen(PORT, () => {
    console.log(`Redirecting HTTP traffic on port ${PORT} to HTTPS on port ${PORT_HTTPS}...`);
  });
}catch(error){
  console.log(`Starting in HTTP mode. Provide SSL certifcates at at path: "${CERT_PATH_LE}/privkey.pem" and "${CERT_PATH_LE}/fullchain.pem" to start in HTTPS mode. `, error);
  // failed to start http only http mode is enabled
  // Start the server
  app.listen(PORT, async () => {
    await loadInstalledApps(app, apps);
    watchUploadsDir(app, apps);
    // start existing apps
    console.log(`Node Microservices Api running on port: ${PORT}`);
    console.log(`New microservices zip packages can be deployed to ${uploadsDir}.`)
    console.log(`Installe ms are running from ${appsDir}`)  
  });
}

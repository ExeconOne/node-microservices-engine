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

import express from 'express';
import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
// import vm from 'vm';
import { exec } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';
// import { createRequire } from 'module';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));


// // Define a restricted `fs` helper (as per previous instructions)
// const createRestrictedFs = (baseDir) => {
//   const resolvePath = (targetPath) => {
//     const fullPath = path.resolve(baseDir, targetPath);
//     if (!fullPath.startsWith(baseDir)) {
//       throw new Error(`Access denied: ${targetPath} is outside the allowed directory.`);
//     }
//     return fullPath;
//   };

//   return {
//     writeFile: (targetPath, data, options) =>
//       fs.writeFile(resolvePath(targetPath), data, options),
//     mkdir: (targetPath, options) =>
//       fs.mkdir(resolvePath(targetPath), options),
//     unlink: (targetPath) =>
//       fs.unlink(resolvePath(targetPath)),
//     readFile: (targetPath, options) =>
//       fs.readFile(resolvePath(targetPath), options),
//   };
// };

// Dynamically load handlers with restricted access
const unzipAndLoadHandlers = async (zipFilePath) => {
    const extractDir = path.join(__dirname, 'temp'); // Temporary extraction directory
    fs.mkdirSync(extractDir, { recursive: true });

    await fs.createReadStream(zipFilePath)
        .pipe(unzipper.Extract({ path: extractDir }))
        .promise();

    const extractedFiles = fs.readdirSync(extractDir);

    const packageFile = extractedFiles.find(item=>item=="package.json");
    const handlerFile = extractedFiles.find(item=>item=="index.js");

    if(packageFile){
        // const filePath = path.join(extractDir, packageFile);    
        await installDependencies(extractDir);    
    }

    const basePath = `/modem`; // Controlled base path for each handler

    // Load and sandbox the handler with restricted fs and controlled basePath
    await loadHandlerWithRestrictedFs(extractDir, basePath);

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
const installDependencies = (directory) => {
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
const loadHandlerWithRestrictedFs = async (handlerDir, basePath) => {
//   const restrictedFs = createRestrictedFs(handlerDir);

    const handlerPath = path.join(handlerDir, 'index.js');
    // const handlerCode = fs.readFileSync(handlerPath, 'utf-8');
    const handlerURL = pathToFileURL(handlerPath);

    // Import the ESM module dynamically
    const handlerModule = await import(handlerURL);

    if (typeof handlerModule.default === 'function') {
    handlerModule.default(app, basePath);
    }
};

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  unzipAndLoadHandlers(path.join(__dirname, 'uploads/Archiwum.zip'));
});

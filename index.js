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
import appLoader from "./loader/index.mjs"
import dbManager from "./engine/databases/index.mjs"
// import vm from 'vm';
// import { createRequire } from 'module';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));



// Start the server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  const appInfo = {
    id: "myApp",
    version: 3,
    
  }
  appInfo.path = path.join(__dirname, `apps/${appInfo.id}/${appInfo.version}`)
  // make app dir beforehand
  const appDb = await dbManager.connectAppDB(appInfo)

  appLoader.loadApp(appInfo, app, path.join(__dirname, 'uploads/Archiwum.zip'));
});

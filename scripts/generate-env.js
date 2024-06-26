// scripts/generate-env.js
const fs = require('fs');

const targetPath = './src/environments/environment.ts';
const environmentTemplatePath = './src/environments/environment.template.ts';

// Read environment variables


// Read template file
let template = fs.readFileSync(environmentTemplatePath, 'utf8');

// Replace placeholders with actual values
// GAPI_CLIENT_ID: "<gapi_client_id>",
// BACKEND_LOC: "<backend_loc>",
// GAPI_SCOPES: "<gapi_scopes>",

template = template.replace("<gapi_client_id>", process.env.GAPI_CLIENT_ID);
template = template.replace("<backend_loc>", process.env.BACKEND_LOC);
template = template.replace("<gapi_scopes>", process.env.GAPI_SCOPES);

// Write environment file
fs.writeFileSync(targetPath, template);

console.log(`Generated environment.ts at ${targetPath}`);

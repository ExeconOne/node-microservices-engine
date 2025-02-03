# Node Microservices API

This project is a Node.js-based microservices platform that handles dynamic deployment of NodeJs apps in zip file format. The platform supports both HTTP and HTTPS modes and allows seamless app updates and management through file uploads.

## Features
- **Dynamic app deployment**: Automatically deploys apps by extracting them from uploaded zip files.
- **App management**: Supports loading and removing apps based on file events in the upload directory.
- **SSL support**: Runs in both HTTP and HTTPS modes (with SSL certificates).
- **Middleware integration**: Built-in security middleware to protect your app.
- **Logging**: Integrates an app-specific logger for detailed logs.
- **Database manager**: Provides database connectivity and management capabilities for each microservice.

## Project Setup

### Requirements
- **Node.js**: v18 or above
- **npm**: v6 or above
- **SSL Certificates**: Required for HTTPS mode (privkey.pem and fullchain.pem)

### Install Dependencies
Run the following command to install all the necessary dependencies:

```bash
npm install
```

### Environment Configuration
You need to set up your environment variables. The `.env` file should be placed at the root of the project and contain the following variables:

```dotenv
PORT=3000 # HTTP port
PORT_HTTPS=3443 # HTTPS port
CERT_PATH=certs # Path to SSL certificates (only required for HTTPS)
```

### Directory Structure
- `uploads`: Directory for uploading zip files containing apps to be deployed.
- `apps`: Directory for storing deployed apps.
- `certs`: Directory containing SSL certificates for HTTPS.

## Running the Application

### HTTP and HTTPS Support
The application can run in either HTTP or HTTPS mode based on the presence of SSL certificates.

#### HTTPS Mode
For HTTPS mode, ensure you have the SSL certificates (`privkey.pem` and `fullchain.pem`) in the `certs` directory.

Start the application in HTTPS mode using the following command:

```bash
npm start
```

This will run the app with HTTPS support and redirect HTTP traffic to HTTPS.

#### HTTP Mode
If SSL certificates are not available, the application will run only in HTTP mode. You can still deploy apps via the upload directory, but traffic will not be encrypted.

Start the application in HTTP mode:

```bash
npm start
```

### File Uploads
- **Upload your zip file containing an app** to the `uploads` directory.
- The application will automatically detect the new zip file and start deploying the app.
- If a file is removed from the `uploads` directory, the corresponding app is also removed.

### Loading Deployed Apps
- The platform automatically loads any previously deployed apps stored in the `apps` directory when the server starts.

## How It Works

1. **Watching Uploads Directory**: The application continuously watches the `uploads` directory for new zip files.
2. **Extracting and Deploying**: When a zip file is added, the platform extracts it and loads the app.
3. **App Management**: The app is deployed in a versioned structure in the `apps` directory.
4. **App Configuration**: Each app has its own database connection and logger. These are handled dynamically during the deployment process.
5. **SSL Configuration**: If SSL certificates are provided, the app will run in HTTPS mode. Otherwise, it runs in HTTP mode.

## Middleware and Security

- **App Guard**: A middleware to ensure secure access to the deployed apps.
- **Logger**: Each app has a separate logger for better error tracking and debugging.

## Database Manager

The **Database Manager** (`DBManager`) is a core component of the Node Microservices API. It handles database connectivity and management for each deployed microservice, ensuring that each microservice has access to its own isolated database.

### How It Works
Each microservice deployed via the Node Microservices API can be assigned its own database, and the Database Manager ensures that each app can interact with its dedicated database. The manager currently uses **SQLite** as the database solution for each microservice.

#### Key Features:
- **Dynamic Database Creation**: Automatically creates a new SQLite database file for each microservice.
- **App-Specific Databases**: Each microservice is assigned its own database stored in the app's directory.
- **SQLite Database**: The `DBManager` uses the SQLite database driver to open or create a new database for each app, ensuring the data is isolated per microservice.
- **Database Access**: Provides a simple API to access the database for each app via the `connectAppDB` method.

#### How to Use
1. **Configure Database Connection**: Each microservice's database is configured dynamically based on the app's deployment path.
2. **Database Connection**: The `connectAppDB` method is used to establish a connection to the microservice's SQLite database, or create it if it does not exist.

#### Example Usage:
Here’s how you would use the `DBManager` in your microservice:

```javascript
import dbManager from "./engine/databases/index.mjs";

// Define app-specific information
const appInfo = {
  id: "myApp",
  version: "1.0.0",
  path: "/path/to/your/app/directory"
};

// Connect to the app's database
const appDb = await dbManager.connectAppDB(appInfo);

// Example query to interact with the database
const result = await appDb.all("SELECT * FROM users");
console.log(result);
```

#### `DBManager` Class
The `DBManager` class is implemented as a singleton. You can access its instance using the `getInstance` method.

```javascript
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
        });
        return db;
    }
}

const dbManager = DBManager.getInstance();
export default dbManager;
```

### Supported Database
The current implementation of the `DBManager` uses **SQLite** as the database solution. The database is created inside the app's specific directory, and each app has its own isolated database file (`appdb.sqlite`).

### Error Handling
- If an error occurs during the database connection or creation, the platform logs the error without taking down the entire server.
- Database-related issues are logged for further investigation.

## Features Provided by Node Microservices API to Deployed Apps
The Node Microservices API offers a set of powerful features to support the deployment and management of microservices in a seamless and efficient manner. Below is an overview of the key capabilities and features available to any app deployed in the Node Microservices API.

1. Dynamic App Deployment
Automatic Deployment: Apps can be dynamically deployed by simply uploading a zip file to the uploads directory. The Node Microservices API extracts and deploys the app, creating necessary directories and configurations.
Version Control: Each app is versioned and stored in its respective directory within the apps directory. Version management is handled automatically.
App Removal: If an app zip file is removed, the corresponding app is also removed, along with all associated files and data, ensuring clean deployment management.
2. Database Support per App
Dedicated Databases: Each deployed app gets its own isolated SQLite database, ensuring that data for each microservice is kept separate and secure.
Automatic Database Creation: The platform automatically creates and connects to a database for each app during deployment. The database is stored within the app's directory for easy access.
Database Management: Apps can access and modify their databases directly using SQLite, with full CRUD capabilities available for app-specific data management.
3. Custom Middleware Support
Custom Middleware Integration: Deployed apps can define and use custom middleware to handle pre-processing of requests, authentication, logging, validation, and more.
App Guard Middleware: The platform includes a security middleware that ensures all deployed apps are securely accessed, offering basic access controls to protect your services.
4. Dynamic Logging
App-Specific Logging: Each deployed app can define its own logger, which captures logs related to the app’s activities. This allows for granular debugging and monitoring of each microservice.
Integrated Logging: The Node Microservices API integrates with each app’s logger to capture relevant events, such as app startup, request/response cycles, and database interactions.
5. Secure HTTPS Support
SSL/TLS Encryption: The Node Microservices API supports HTTPS mode for secure communication between clients and deployed apps. SSL certificates are automatically integrated if available, providing end-to-end encryption.
HTTP to HTTPS Redirection: HTTP traffic is automatically redirected to HTTPS if the app is running in HTTPS mode, ensuring secure connections.
6. File Handling
App File Uploads: Apps can define their own file handling mechanisms for accepting, processing, and serving files. The platform allows apps to easily manage file uploads and access uploaded files from their designated directories.
App File Storage: Files uploaded by apps can be stored and organized within the app’s directory, ensuring isolation of files per app.
7. Custom Routing and Base Paths
Flexible Routing: Deployed apps can specify custom routing rules and base paths, allowing for the organization of multiple services under different URL paths.
Base Path Management: Apps are assigned base paths where they will be accessible. This allows for easy routing and integration with other services deployed on the platform.
8. Error Handling
Graceful Error Management: The platform provides graceful handling of uncaught exceptions to prevent app crashes from taking down the entire instance. Apps can define custom error handlers to manage application-specific errors and recover gracefully.
App-Specific Error Logs: Errors are logged per app, making it easy to diagnose issues within each deployed microservice without affecting the rest of the platform.
9. App Configuration
Configuration Handling: Each deployed app can define its own configuration settings (e.g., environment variables, configuration files). These settings can be dynamically managed and accessed throughout the app.
App Initialization: Apps can initialize their configuration, database, and other settings during startup to ensure they are ready to handle requests.
10. Auto-Scaling and Monitoring
Auto-Scaling: The platform is capable of scaling deployed apps based on load and resource requirements (this would need external infrastructure support).
Monitoring: The Node Microservices API captures essential logs and metrics (e.g., number of requests, response times) for each app, making it easy to monitor app performance and health.
11. Customizable API Endpoints
API Definition: Apps can define custom API endpoints based on their business logic and needs, including handling various HTTP methods such as GET, POST, PUT, DELETE, etc.
Request Handling: The platform allows apps to handle HTTP requests, process data, and respond with dynamic outputs (e.g., JSON, HTML, files, etc.).
12. App Update and Rollback
Easy Updates: When a new version of an app is uploaded, the platform automatically handles the deployment of the updated version, ensuring minimal downtime.
Rollback Capability: In case of failure during app deployment or execution, previous versions can be quickly restored to maintain service availability.
13. Access to Native Node.js Modules
Extensive Module Support: Deployed apps can take advantage of the full suite of Node.js built-in modules (e.g., fs, http, https, path, sqlite3, etc.) to handle their backend operations, file management, networking, and more.
Third-Party Modules: Apps can also use additional NPM packages to extend functionality beyond the built-in modules.
14. Seamless App Lifecycle Management
App Start & Stop: Apps are automatically started when deployed and can be stopped if necessary through the platform. App lifecycle is managed to ensure they are running in a stable state.
App Monitoring: Continuous monitoring of apps ensures they are up and running smoothly. Errors and issues are logged and tracked for fast resolution.


## Contributing

Feel free to fork the repository and submit pull requests for improvements or new features.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Troubleshooting

- **Missing SSL certificates**: If SSL certificates are not found, the app will fall back to HTTP mode.
- **App deployment issues**: Check the `logs` for specific errors related to app extraction or loading.
- **Database connection issues**: Ensure the app's database directory and permissions are correctly set up. If the database file cannot be created, check the file path and ensure there is no permission issue.



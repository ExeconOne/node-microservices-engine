// Middleware to check path against a regex pattern
const appGuard = function pathCheckMiddleware(apps) {

    return (req, res, next) => {
        let found = false;
        for(let i=0; i<apps.length; i++){
            const appInfo = apps[i];
            // id: appId,
            // version: version,    
            // path: versionDir,
            // urlContext: `/${appId}/${version}` 
            if(req.path.includes(appInfo.urlContext)) found = true;                
        }
        if(!found){
            res.status(404).send('Not found');                    
        }else{
            next();
        }              
    };
}

export default appGuard
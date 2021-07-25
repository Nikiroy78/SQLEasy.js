# SQLEasy.js
module for simple works from sqlite3 (JavaScript edition)
## Prepare for work
```bash 
npm install better-sqlite3
```
from next, you can download folder of project, and load in folder "node_modules"
``` bash
cd node_modules
git clone https://github.com/Nikiroy78/SQLEasy.js.git
```
import database object in your project
``` javascript
const SQLEasy = require('SQLEasy');
var database = SQLEasy.database('/path/to/database.db');
```

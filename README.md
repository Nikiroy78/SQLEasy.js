# SQLEasy.js
module for simple works from sqlite3 (JavaScript edition)
## Prepare for work
My module use module **better-sqlite3**, you must download it.
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
This object have 4 methods: add, remove, set, get
### get
This method getting date from included database
```javascript
const sqlite = require('SQLEasy');
var database =  sqlite.database('/path/to/database.db');

console.log(database.get('table'));
```
output...
``` javascript
[{'ID': 0, 'content': 'content 1'}, {'ID': 1, 'content': 'other content'}, {'ID': 2, 'content': 'Content number 3 :)'}, {'ID': 3, 'content': 'etc.'}]
```

You can apply condition's settings from filt your data...
```javascript
const sqlite = require('SQLEasy');
var database =  sqlite.database('/path/to/database.db');

console.log(database.get('table', [{'ID': 0}, {'content': 'etc.'}]));
```
output...
``` javascript
[{'ID': 0, 'content': 'content 1'}, {'ID': 3, 'content': 'etc.'}]
```
Response show is...
```SQL
SELECT * FROM table WHERE (ID=0) OR (content='etc.')
```
And you edit uploaded columns
```javascript
const sqlite = require('SQLEasy');
var database =  sqlite.database('/path/to/database.db');

console.log(database.get('table', [{'ID': 0}, {'content': 'etc.'}], 'content'));
```
output...
``` javascript
[{'content': 'content 1'}, {'content': 'etc.'}]
```
Response show is...
```SQL
SELECT content FROM table WHERE (ID=0) OR (content='etc.')
```
### add
This is sql response
```SQL
INSERT
```
Using add method in your code (from your simply, we used old date from last database).
```javascript
const sqlite = require('SQLEasy');
var database =  sqlite.database('/path/to/database.db');

database.add('table', {'ID': 4, 'content': 'test example, from fucking tests :)'})
console.log(database.get('table'));
```
output...
```javascript
[{'ID': 0, 'content': 'content 1'}, {'ID': 1, 'content': 'other content'}, {'ID': 2, 'content': 'Content number 3 :)'}, {'ID': 3, 'content': 'etc.'}, {'ID': 4, 'content': 'test example, from fucking tests :)'}]
```

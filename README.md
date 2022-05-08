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
const SQLEasy = require('SQLEasy.js');
var database = new SQLEasy.database('/path/to/database.db');
```
This object have 4 methods: add, remove, set, get
## Methods of SQLEasy object
### get
This method getting date from included database
```javascript
const sqlite = require('SQLEasy.js');
var database = sqlite.database('/path/to/database.db');

console.log(database.get('table'));
```
output...
``` javascript
[{'ID': 0, 'content': 'content 1'}, {'ID': 1, 'content': 'other content'}, {'ID': 2, 'content': 'Content number 3 :)'}, {'ID': 3, 'content': 'etc.'}]
```

You can apply condition's settings from filt your data...
```javascript
const sqlite = require('SQLEasy.js');
var database = sqlite.database('/path/to/database.db');

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
const sqlite = require('SQLEasy.js');
var database = sqlite.database('/path/to/database.db');

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
const sqlite = require('SQLEasy.js');
var database = sqlite.database('/path/to/database.db');

database.add('table', [{'ID': 4, 'content': 'test example, from fucking tests :)'}])
console.log(database.get('table'));
```
output...
```javascript
[{'ID': 0, 'content': 'content 1'}, {'ID': 1, 'content': 'other content'}, {'ID': 2, 'content': 'Content number 3 :)'}, {'ID': 3, 'content': 'etc.'}, {'ID': 4, 'content': 'test example, from fucking tests :)'}]
```
### remove
Using remove method in your code (from your simply, we used old date from last database).
```javascript
const sqlite = require('SQLEasy.js');
var database = sqlite.database('/path/to/database.db');

database.remove('table', {'ID': 4});
console.log(database.get('table'));
```
output...
```javascript
[{'ID': 0, 'content': 'content 1'}, {'ID': 1, 'content': 'other content'}, {'ID': 2, 'content': 'Content number 3 :)'}, {'ID': 3, 'content': 'etc.'}]
```
### set
Using set method in your code (from your simply, we used old date from last database).
```javascript
const sqlite = require('SQLEasy.js');
var database = sqlite.database('/path/to/database.db');

database.set('table', {'ID': 3}, {'content': 'edited'});  // First param - index key, found param - edit content...
console.log(database.get('table'));
```
output...
```javascript
[{'ID': 0, 'content': 'content 1'}, {'ID': 1, 'content': 'other content'}, {'ID': 2, 'content': 'Content number 3 :)'}, {'ID': 3, 'content': 'edited'}]
```
### execute
This is important method from execute your SQL script in your code.
Using method **execute** in test code (from your simply, we used old date from last database).
```javascript
const sqlite = require('SQLEasy.js');
var database = sqlite.database('/path/to/database');

var data = database.execute('SELECT * FROM table');
console.log(data);
```
output...
```javascript
[{'ID': 0, 'content': 'content 1'}, {'ID': 1, 'content': 'other content'}, {'ID': 2, 'content': 'Content number 3 :)'}, {'ID': 3, 'content': 'etc.'}]
```
### getIndex
Use this method from getting index value.
```javascript
const sqlite = require('SQLEasy.js');
var database = sqlite.database('/path/to/database.db');

console.log(database.get('table'));
console.log(database.getIndex('table', 'ID'));
```
output...
```javascript
[{'ID': 0, 'content': 'content 1'}, {'ID': 1, 'content': 'other content'}, {'ID': 3, 'content': 'Content number 3 :)'}, {'ID': 4, 'content': 'edited'}]
2
```
## Other functions that you can use in this module
### get_from_key
This function needs from works data in buffer.
The main advantage of this method is that you do not need to request data from the database every time, it is enough to use the data uploaded to memory:
```javascript
// Legacy method!
const sqlite = require('SQLEasy.js');
var database = sqlite.database('/path/to/database.db');
var rolesData = database.get('users').map(i => {
	return {
		user: i,
		role_data: database.get('role', [{id: i.role}])
	}
});
```
```javascript
// New method!
const sqlite = require('SQLEasy.js');
var database = sqlite.database('/path/to/database.db');
var roleData = database.get('role', [{id: i.role}])
var rolesData = database.get('users').map(i => {
	return {
		user: i,
		role_data: sqlite.get_from_key(roleData, [{id: i.role}])
	}
});
```
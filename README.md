# SQLEasy library
This library was written from simple work with databases. In current version supported next famous databases: sqlite3 and MySQL. In future, list with supported databases will be replenishing.
## Prepare to work
Before you use this module you must install it.
```bash
npm install sql-easy-lib --save
```
and you can include it!
```node
const SQLEasy = require('sql-easy-lib');
```
## Tools and main objects
Before work, you must know about twice main tools: **get_from_key** and **Request**.
```node
const SQLEasy = require('sql-easy-lib');

var req = new SQLEasy.Request([{id: 1, value: 12}, {name: 'CirillaGif'}]);
/* This is boolean operation: "(id=1 AND value=12) OR (name=`CirillaGif`)" */
var get_from_key = SQLEasy.tools.get_from_key;
/* get_from_key function, about him in down. */
```
**Request** use from create logic expression
*example:*
```node
// ...
new SQLEasy.Request([{id: 1, value: 12}, {name: 'CirillaGif'}]);
```
```mysql
(id=1 AND value=12) OR (name=`CirillaGif`)
```
**get_from_key** use for more efficient queries from buffer variables.
*example:*
```node
// Without use get_from_key
const SQLEasy = require('sql-easy-lib');
var database = new SQLEasy.SQLite3_database('/path/to/database.db');
var rolesData = database.get('users').map(i => {
	return {
		user: i,
		role_data: database.get('role', new SQLEasy.Request([{id: i.role}]))
	}
});
```
```node
// With use get_from_key
const SQLEasy = require('sql-easy-lib');
var database = new SQLEasy.SQLite3_database('/path/to/database.db');
var roleData = database.get('role', new SQLEasy.Request([{id: i.role}]));
var rolesData = database.get('users').map(i => {
	return {
		user: i,
		role_data: SQLEasy.tools.get_from_key(roleData, new SQLEasy.Request([{id: i.role}]))
	}
});
```
## Methods of databases
In all databases methods is equally *(except for the connection)*. 
```node
const SQLEasy = require('sql-easy-lib');
/* Method for connection sqlite3 database */
var sqlite3 = new SQLEasy.SQLite3_database('/path/to/database.db');
/* Method for connection MySQL database */
var mysql = new SQLEasy.MySQL_database({
	host: "mysql.example.org",
	user: "username",
	password: "password"
});
mysql.set_db("Example_db");  // setting database in server
```
*(for example, we use abstract database object):* **database**
```node
const SQLEasy = require('sql-easy-lib');

var database = new SQLEasy.AnyDatabase(args);
```
### get
This is getting items from table:
```mysql
SELECT
```
*syntax:*
```node
database.get(
	'table_name',
	new SQLEasy.Request([{param: 'value'}]),  // Not required: ...WHERE (CONDITION) in request
	'*'  // Not required: Items in table
);
```
```mysql
SELECT * FROM table_name WHERE (param=`value`)
```
### set
This is set values in items in table:
```mysql
UPDATE .. SET
```
*syntax:*
```node
database.set(
	'table_name',
	new SQLEasy.Request([{param: 'value_require_edit'}]),  // Required: ...WHERE (CONDITION) in request
	[{param: 'value'}]  // Required: Items in table
);
```
```mysql
UPDATE table_name SET param=`value` WHERE (param=`value_require_edit`)
```
### remove
This method for remove items into database.
```mysql
DELETE
```
*syntax:*
```node
database.remove(
	'table_name',
	new SQLEasy.Request([{param: 'value'}])  // Required: ...WHERE (CONDITION) in request
);
```
```mysql
DELETE FROM table_name WHERE (param=`value_require_edit`)
```
### add
Method for add items into database.
```mysql
INSERT
```
*syntax:*
```node
database.remove(
	'table_name',
	[{param: 'value'}]  // Required: ... Rows what you add in table.
);
```
```mysql
INSERT INTO table_name (param) VALUES (`value`)
```
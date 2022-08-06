const mysql = require('./mysql');
const sqlite = require('./sqlite3');
const sqleasy_tools = require('./SQLEasyTools');


class legacy_sqlite3_db extends sqlite.database {
	constructor (path, warning=true) {
		super(path, warning);
		console.log('You use legacy method of connect to sqlite3 database. If you want use actual method, then use "new SQLite3_database(\'/path/to/database.db\');"');
		console.log('This connection method can be deactivated in next versions!!');
	}
}


module.exports = {
	database: legacy_sqlite3_db,
	SQLite3_database: sqlite.database,
	MySQL_database: mysql.mysql_database,
	
	Request: sqleasy_tools.Request,
	tools: {
		get_from_key: sqleasy_tools.get_from_key
	}
}
const sqlite3 = require('better-sqlite3');


class global_data_Parser{
	getTable(err, rows){
		this.rows = rows;
		this.err = err;
		// console.log('globalParser:', this.rows);
	}
}


class SQLEasy_error extends Error {
	constructor(code='GENERIC', status=500, ...params) {
		super(...params);
		if(Error.captureStackTrace) {
			Error.captureStackTrace(this, 'SQLEasy_error');
		}
		this.code = code;
		this.status = status;
	}
}


function get_from_key (db_data, conditions) {
	conditions = conditions.filter(i => i != {});
	if (conditions == [] || !conditions) return db_data;
	let item = new Object();
	let bool_conditions = new Array();
	let condition_item = new Object();
	let int_condition = 1;
	
	let out_objs = new Array();
	
	for (let i in db_data) {
		bool_conditions = new Array();
		item = db_data[i];
		
		for (let index in conditions) {
			int_condition = 1;
			condition_item = conditions[index];
			for (key in condition_item) {
				int_condition *= Number(item[key] == condition_item[key]);
			}
			bool_conditions.push(int_condition);
		}
		if (bool_conditions.reduce((a, b) => Boolean(a + b))) out_objs.push(item);
	}
	
	return out_objs;
}


class database {
	constructor(path, warning=true){
		if (warning) console.log("You use LEGACY version of SQLEasy library (v. 0.9.1). In new version structure was been edited. Show more in: https://www.npmjs.com/package/sql-easy-lib");
		this.PATH = path;
		// this.db = new sqlite3.Database(this.PATH);  // async - heresy!
		this.db = new sqlite3(this.PATH);
		// Создаём "функции-двойники"
		this.getTable = this.getBase;
		this.get = this.getTable;
		this.select = this.get;
		this.set = this.setItem;
		this.insert = this.add;
		this.update = this.set;
		this.remove = this.del;
		this.pop = this.del;
		this.exec = this.execute;
	}
	ToString(value) {
		return typeof(value) === 'string' ? '\'' + value + '\'' : value;
	}
	getIndex (table, indexColumn, index_starts = 0) {
		// return this.get(table).length;
		let tableData = this.get(table).sort((a, b) => a[indexColumn] - b[indexColumn]);
		let index = index_starts - 1;
		for (let i in tableData) {
			if (index_starts <= i) {
				if (i != tableData[i][indexColumn]) return i;
				index = i;
			}
		}
		return Number(index) + 1;
	}
	execute(SQLRequest) {
		try {
			return this.db.prepare(SQLRequest).all();
		} catch(err) {
			if(err.message.indexOf('run()') !== -1) {
				try {
					this.db.prepare(SQLRequest).run();
					return null;
				} catch(err) {
					throw new Error(`SQLEasy error: ${err.message}`);
				}
			}
			else{
				throw new Error(`SQLEasy error: ${err.message}`);
			}
		}
	}
	getBase(table, condition=null, keys='*') {
		let SQLRequest = `SELECT ${keys} FROM ${table}`;
		if(condition !== null){
			let orBlock = new Array();
			for(let i = 0; i < condition.length; i++){
				let andBlock = new Array();
				for(let key in condition[i]){
					andBlock.push(`${key}=${this.ToString(condition[i][key])}`);
				}
				orBlock.push(`(${andBlock.join(' AND ')})`);
			}
			SQLRequest = `${SQLRequest} WHERE ${orBlock.join(' OR ')}`;
		}
		// console.log(SQLRequest);  // Убрать после тестов!!
		try {
			let rows = this.db.prepare(SQLRequest).all();
			if(rows !== null & rows !== undefined) return rows;
			else throw new Error('SQLEasy error: Rows given null.');
		} catch(err) {
			if(err.message.indexOf('no such table') !== -1){
				throw new Error('SQLEasy error: this table not founded.');
			}
			else throw new Error(`SQLEasy error: ${err.message}`);
		}
	}
	add(table, addvArray, ignore=false){
		this.getBase(table);
		let SQLRequest = new Array();
		let setting_values = new Array();
		for(let i = 0; i < addvArray.length; i++) {
			let addObject = addvArray[i];
			let keys = new Array();
			let values = new Array();
			setting_values = new Array();
			for(let key in addObject){
				keys.push(key);
				setting_values.push(addObject[key]);
				values.push('?');
			}
			let op = 'INSERT';
			if(ignore) op = 'INSERT OR IGNORE';
			SQLRequest.push(`${op} INTO ${table} (${keys.join(', ')}) VALUES (${values.join(', ')});`);
		}
		SQLRequest = SQLRequest.join('\n');
		try{
			this.db.prepare(SQLRequest).run(setting_values);
		} catch(err){
			if (ignore) throw new Error(`SQLEasy error: ${err.message}`);
			else this.add(table, addvArray, true);
		}
	}
	del(table, index){
		this.get(table);
		let equal_req = '';
		for(let key in index) {
			equal_req = `${key} = ${this.ToString(index[key])}`;
			break;
		}
		let SQLRequest = `DELETE FROM ${table} WHERE ${equal_req}`;
		try {
			this.db.prepare(SQLRequest).run();
		} catch(err) {
			throw new Error(`SQLEasy error: ${err.message}`);
		}
	}
	setItem(table, index, values){
		this.getBase(table);
		let equal_index = '';
		let equal_values = '';
		let value_array = new Array();
		
		for(let key in index){
			equal_index = `${key} = ${this.ToString(index[key])}`;
			// equal_index = `${key} = ?`;
			break;
		}
		for(let key in values){
			// equal_values = `${key} = ${this.ToString(values[key])}`;
			equal_values = `${key} = ?`;
			value_array.push(values[key]);
			break;
		}
		let SQLRequest = `UPDATE ${table} SET ${equal_values} WHERE ${equal_index}`;
		try {
			// this.db.prepare(SQLRequest).get(value_array).run();
			this.db.prepare(SQLRequest).run(value_array);
		} catch(err) {
			throw new Error(`SQLEasy error: ${err.message}`);
		}
	}
}


module.exports = {
	database: database,
	get_from_key: get_from_key
};
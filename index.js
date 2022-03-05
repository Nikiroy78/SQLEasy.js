// const sqlite3 = require('sqlite3').verbose();  // Пошли в пизду со своим ассинхроном, ублюдки!
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


class database {
	constructor(path){
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
	database: database
};

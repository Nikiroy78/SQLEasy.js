const sqlite3 = require('better-sqlite3');
const sqleasy_tools = require('./SQLEasyTools');


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
		let values = null;
		if (condition !== null) {
			/*let orBlock = new Array();
			for(let i = 0; i < condition.length; i++){
				let andBlock = new Array();
				for(let key in condition[i]){
					andBlock.push(`${key}=${this.ToString(condition[i][key])}`);
				}
				orBlock.push(`(${andBlock.join(' AND ')})`);
			}*/
			SQLRequest = `${SQLRequest} WHERE ${condition.toString().str}`;
		}
		// console.log(SQLRequest);  // Убрать после тестов!!
		try {
			// let rows = this.db.prepare(SQLRequest).all();
			let rows;
			if (!condition) rows = this.db.prepare(SQLRequest).all();
			else rows = this.db.prepare(SQLRequest).all(condition.toString().values);
			if (!!rows) return rows;
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
			// setting_values = new Array();
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
			// this.db.prepare(SQLRequest).run(setting_values);
			// this.db.prepare(SQLRequest).exec(setting_values);
			this.db.prepare(SQLRequest).run(setting_values);
		} catch(err){
			if (ignore) throw new Error(`SQLEasy error: ${err.message}`);
			else this.add(table, addvArray, true);
		}
	}
	del(table, index){
		this.get(table);
		/*let equal_req = '';
		for(let key in index) {
			equal_req = `${key} = ${this.ToString(index[key])}`;
			break;
		}*/
		let SQLRequest = `DELETE FROM ${table} WHERE ${index.toString().str}`;
		try {
			this.db.prepare(SQLRequest).run(index.toString().values);
		} catch(err) {
			throw new Error(`SQLEasy error: ${err.message}`);
		}
	}
	setItem(table, index, values){
		this.getBase(table);
		let equal_index = '';
		let equal_values = '';
		let value_array = new Array();
		
		for (let key in values) {
			// equal_values = `${key} = ${this.ToString(values[key])}`;
			equal_values = `${key} = ?`;
			value_array.push(values[key]);
			break;
		}
		for (let i in index.requestElements) {
			for(let key in index.requestElements[i]){
				// equal_index = `${key} = ${this.ToString(index.requestElements[key])}`;
				equal_index = `${key} = ?`;
				value_array.push(index.requestElements[i][key]);
				break;
			}
		}
		// let SQLRequest = `UPDATE ${table} SET ${equal_values} WHERE ${equal_index}`;
		let SQLRequest = `UPDATE ${table} SET ${equal_values} WHERE ${index.toString().str}`;
		try {
			// this.db.prepare(SQLRequest).get(value_array).run();
			this.db.prepare(SQLRequest).run(value_array);
		} catch(err) {
			console.log(err.stack);
			throw new Error(`SQLEasy error: ${err.message}`);
		}
	}
}


module.exports = {
	database: database,
	get_from_key: get_from_key
};
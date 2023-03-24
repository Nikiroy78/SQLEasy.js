function get_from_key (db_data, conditions) {
	conditions = conditions.requestElements.filter(i => i != {});
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


class SQLEasy_error extends Error {
    constructor(message) {
        super(message);
        this.name = "SQLEasy_error";
    }
}


class Request {
	constructor (construction) {
		if (typeof(construction) != 'object') throw SQLEasy_error('in Request you can use only object type');
		try {
			construction.map(i => i);
			this.requestElements = construction;
		}
		catch (err) {
			this.requestElements = [construction];
		}
	}
	
	toString (query_funct = (value) => '?') {
		let values = new Array();
		return { str: this.requestElements.map(items => {
			let queries = new Array();
			for (let key in items) {
				queries.push(`${key}=${query_funct(items[key])}`);
				values.push(items[key]);
			}
			return `(${queries.join(' AND ')})`;
		}).join(' OR '), values: values};
	}
}


class db {
	constructor () {
		// get
		this.getTable = this.get;
		this.getBase = this.get;
		this.select = this.get;
		
		// set
		this.update = this.set;
		this.setItem = this.set;
		
		// add
		this.insert = this.add;
		this.push = this.add;
		this.append = this.add;
		
		// remove
		this.del = this.remove;
		this.pop = this.remove;
	}
}


module.exports = {
	Request: Request,
	SQLEasy_error: SQLEasy_error,
	get_from_key: get_from_key,
	Database: db
}

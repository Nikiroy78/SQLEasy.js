const MySql = require('sync-mysql');
const sqleasy_tools = require('./SQLEasyTools');


class MySQL_error extends Error {
    constructor(message) {
        super(message);
        this.name = "MySQL_error";
    }
}

function gen_qw (value) {
	if (typeof(value) == 'number') return '?';
	else return '??';
}


function compile_responses(responses) {
	let string_responses = new Array();
	let gen_resp = '';
	let item = '';
	for (ind in responses) {
		item = responses[ind];
		if (item == undefined) {
			string_responses.push(gen_resp);
			break;
		}
		else if (item.length < 81) {
			if (gen_resp == '') {
				gen_resp = item;
			}
			else if ((gen_resp + ';\n' + item).length >= 81) {
				string_responses.push(gen_resp);
				gen_resp = item;
			}
			else {
				gen_resp += ';\n' + item;
			}
		}
		else string_responses.push(item);
	}
	if (gen_resp != '') {
		string_responses.push(gen_resp);
	}
	return string_responses;
}


function convert_to_object (output, index_key, save_ik = false) {  // Not checked!
	let item = new Object();
	let out_object = new Object();
	let item_obj = new Object();
	
	for (let i in output) {
		item = output[i];
		item_obj = item;
		if (!save_ik) delete item_obj[index_key];
		
		out_object[item[index_key]] = item_obj;
	}
	
	return item_obj;
}


class mysql_database {
    ToString(value) {  // Convertion to string (legacy)
        // return typeof (value) === 'string' ? '\'' + value + '\'' : value;
        if (typeof (value) === 'string') {
			if (warns == true) {
				// console.log('WARNING!! You use legacy function, please reword your code from used current methods');
			}
            value = value.replace(new RegExp("'", 'g'), "\\'");
            value = `'${value}'`;
            return value;
        }
        else return value;
    }
	debug (Text) {
		if (this.settings.debug) console.log(Text);
	}
    constructor(connection_object, settings = new Object()) {  // init
		this.settings = {
			toggle_commit: Boolean(settings.toggle_commit),
			warns: Boolean(settings.warns),
			debug: Boolean(settings.debug)
		}
		
		if (settings.warns == undefined) this.settings.warns = true;
		if (settings.debug == undefined) this.settings.debug = false;
		if (settings.toggle_commit == undefined) this.settings.toggle_commit = true;
		
        this.connection = new MySql(connection_object);
        this.db_connection = undefined;
		this.isCommiting = this.settings.toggle_commit;
		this.warns = this.settings.warns;
		
		this.commit_steps = new Array();
		this.commit_values = new Array();
		
		this.commit_sessions = new Object();
    }
	toggle_commit (condition) {  // toggle using .commit() in methods
		this.isCommiting = condition;
	}
	operation(SQLRequest, values, session = null) {  // Add to commit's buffer
		if (SQLRequest[SQLRequest.length - 1] != ';') SQLRequest = `${SQLRequest};`
		if (session == null) {
			this.commit_steps.push(SQLRequest);
			for (let v=0; v < values.length; v++) {
				this.commit_values.push(values[v]);
			}
		}
		else {
			if (this.commit_sessions[session] != undefined) {
				this.commit_sessions[session].commit_steps.push(SQLRequest);
				for (let v=0; v < values.length; v++) {
					this.commit_sessions[session].commit_values.push(values[v]);
				}
			}
			else throw new MySQL_error('Session not founded.');
		}
	}
	new_commit_session (session) {  // Create new commit's session
		this.commit_sessions[session] = {
			commit_steps: new Array(),
			commit_values: new Array()
		};
	}
	commit(session = null) {  // commit changes in database
		// console.log(`Called commit with session ${session}`);
		this.debug(`Called commit with session ${session}`);
		let SQLRequest = '';
		let commit_values = new Array();
		if (session == null) {
			SQLRequest = this.commit_steps.join('\n');
			commit_values = this.commit_values;
		}
		else {
			if (this.commit_sessions[session] != undefined) {
				let session_info = this.commit_sessions[session];
				
				SQLRequest = session_info.commit_steps.map((item) => {
					if (Boolean(item)) return item;
				}).join('\n');
				commit_values = session_info.commit_values;
			}
			else throw new MySQL_error('Session not founded.');
		}
		
		let result = undefined;
		let error = false;
		try {
			// this.debug(`  >> SQLRequest: ${SQLRequest}\n  >> commit_values: ${commit_values}`);
			this.debug(`\n################################################################\n${SQLRequest}\n################################################################`);
			this.debug(`${commit_values}\n################################################################`);
			// result = this.connection.query(SQLRequest, commit_values);
			// console.log('SQLRequest:', SQLRequest);
			// console.log('commit_values:', commit_values);
			result = this.exec(SQLRequest, commit_values);
		}
		catch (err) {
			error = err;
		}
		
		if (session == null) this.commit_steps = new Array();
		else this.commit_sessions[session].commit_steps = new Array();
		
		if (session == null) this.commit_values = new Array();
		else this.commit_sessions[session].commit_values = new Array();
		
		this.debug(`  >> LEN: ${this.commit_steps}`);
		
		if (error.message != undefined) {
			console.log(error.stack);
			throw new MySQL_error(error.message);
		}
		return result;
	}
	getIndex(table, index_column, start_index_value = 0) {  // getting index
		if (this.db_connection == undefined) throw new MySQL_error('You must choose database. Use [mysql_database Object].set_db(\'database_name\')');
		// let database_data = this.get(table).sort(i => i[index_column]);
		let database_data = this.get(table).sort((a, b) => a[index_column] - b[index_column]);
		let filter_dict = new Object();
		let item = Object();
		let index = start_index_value;
		
		for (let i in database_data) {
			item = database_data[i];
			if (item[index_column] >= start_index_value) {
				if (item[index_column] > index) return index;
				else index++;
			}
		}
		
		/*for (let i = start_index_value; i < database_data.length; i++) {
			filter_dict = database_data[i];
			filter_dict[index_column] = i;
			if (!get_from_key(database_data, [filter_dict])) return i;
		}*/
		return index;
		// return this.get(table).length;
	}
	// SQL Methods
    set_db(database_name) {  // using database
        try {
            this.debug(`USE ${database_name}`);
            this.connection.query(`USE ${database_name}`);

            this.db_connection = database_name;
        }
        catch (err) {
            throw new MySQL_error(err.message);
        }
    }
    exec(SQLRequest, params = []) {  // Execute SQL Request
		/*if (typeof(params) !== 'object' || typeof(params) !== 'array') {
			params = new Array();
		}*/
		let SQLRequests = SQLRequest.split(';').filter(i => Boolean(i)).map((item) => `${item.trim()};`);
		let results = new Array();
		
		for (let i in compile_responses(SQLRequests)){
			SQLRequest = SQLRequests[i];
			if (Boolean(SQLRequest)) {
				try {
					this.debug(`\n################################################################\n${SQLRequest}\n################################################################`);
					this.debug(`${params}\n################################################################`);
					results.push(this.connection.query(SQLRequest, params));
				}
				catch (err) {
					// console.log(err.stack);
					throw new MySQL_error(err.message);
				}
			}
		}
		results = results.filter(i => Boolean(i));
		/*results = results.map((res) => {
			if (res != undefined) return res;
		});*/
		if (results.length == 1) return results[0];
		else return results;
    }
    get(table, filt = null, keys = '*', commit = false, session = null) {  // Select rows from table
        if (this.db_connection == undefined) throw new MySQL_error('You must choose database. Use [mysql_database Object].set_db(\'database_name\')');
		let SQLRequest = `\nSELECT ${keys} FROM ${this.db_connection}.${table}`;
        try {
			/*let args = new Array();
            if (Boolean(filt) != false) {
                let orBlock = new Array();
                for (let i = 0; i < filt.length; i++) {
                    let andBlock = new Array();
                    for (let key in filt[i]) {
                        andBlock.push(`${key}=?`);
						args.push(filt[i][key]);
                    }
                    orBlock.push(`(${andBlock.join(' AND ')})`);
                }
                SQLRequest = `${SQLRequest} WHERE ${orBlock.join(' OR ')}`;
            }
            this.debug(`GET: ${SQLRequest}`);
            this.debug(`ARGS: ${args}`);*/
			if (!!filt) SQLRequest = `${SQLRequest} WHERE ${filt.toString().str}`;
			this.debug(' GET >> SQLRequest:', SQLRequest);
			
			if (!!filt) this.operation(SQLRequest, filt.toString().values);
			else this.operation(SQLRequest, []);
			if (this.isCommiting || commit) return this.commit(session);
        }
        catch (err) {
			console.log(err.stack);
            throw new MySQL_error(err.message);
        }
    }
    add(table, addvArray, ignore = false, commit = false, session = null) {  // Insert new values
        if (this.db_connection == undefined) throw new MySQL_error('You must choose database. Use [mysql_database Object].set_db(\'database_name\')');
        try {
            this.get(table);
			
            let SQLRequest = new Array();
			let args = new Array();
            for (let i = 0; i < addvArray.length; i++) {
                let addObject = addvArray[i];
                let keys = new Array();
                let values = new Array();
                for (let key in addObject) {
                    keys.push(key);
                    values.push('?');
					args.push(addObject[key]);
                }
                let op = 'INSERT';
                if (ignore) op = 'INSERT OR IGNORE';
                SQLRequest.push(`${op} INTO ${this.db_connection}.${table} (${keys.join(', ')}) VALUES (${values.join(', ')});`);
            }
            SQLRequest = SQLRequest.join('\n');
			// let SQLRequest = `${}`;
			
			this.debug(` ADD >> ${SQLRequest}`);
            this.operation(SQLRequest, args);
			
			if (this.isCommiting || commit) return this.commit(session);
        }
        catch (err) {
            throw new MySQL_error(err.message);
        }
    }
    remove(table, index, commit = false, session = null) {  // Delete values
        if (this.db_connection == undefined) throw new MySQL_error('You must choose database. Use [mysql_database Object].set_db(\'database_name\')');
        try {
            this.get(table);
			let SQLRequest = new Array();
			let args = new Array();
			
            // let equal_req = '';
            // let equal_req = new Array();
            /*for (let key in index) {
                // equal_req = `${key} = ?`;
                equal_req.push(`${key} = ?`);
				args.push(index[key]);
                // break;
            }*/
            SQLRequest = `DELETE FROM ${this.db_connection}.${table} WHERE ${index.toString().str}`;
            this.debug(SQLRequest);
            this.operation(SQLRequest, index.toString().values);
			if (this.isCommiting || commit) return this.commit(session);
        }
        catch (err) {
            throw new MySQL_error(err.message);
        }
    }
	
    set(table, index, values, ignore=false, commit = false, session = null) {  // Updating setav data
        if (this.db_connection == undefined) throw new MySQL_error('You must choose database. Use [mysql_database Object].set_db(\'database_name\')');
        try {
			let op = 'UPDATE';
			
            this.get(table);
			let SQLRequest = new Array();
			let args = new Array();
			
            // let equal_index = new Array();
            let equal_values = new Array();
			
            for (let key in values) {
				equal_values.push(`${key} = ?`);
				args.push(values[key]);
            }
			for (let i in index.requestElements) {
				for (let key in index.requestElements[i]) {
					// equal_index.push(`${key} = ?`);
					args.push(index.requestElements[i][key]);
				}
			}
			if (ignore) op = 'UPDATE OR IGNORE';
            SQLRequest = `${op} ${this.db_connection}.${table} SET ${equal_values.join(', ')} WHERE ${index.toString().str}`;
            this.debug(SQLRequest);
            this.operation(SQLRequest, args);
			if (this.isCommiting || commit) return this.commit(session);
        }
        catch (err) {
			console.log(err.stack);
            throw new MySQL_error(err.message);
        }
    }
}


module.exports = {
    mysql_database: mysql_database,
    MySQL_error: MySQL_error
}
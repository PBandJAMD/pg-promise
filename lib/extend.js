'use strict';

var $npm = {
    result: require('./result'),
    special: require('./special'),
    events: require('./events'),
    utils: require('./utils')
};

var $p;

////////////////////////////////////////////////////
// Injects additional methods into an access object,
// extending the protocol's base method 'query'.
function $extend(ctx, obj) {

    /**
     * @method Database.none
     * @summary Executes a query that expects no data to be returned.
     * @param {String|Object} query -
     * - query string
     * - prepared statement object
     * @param {Array|value} [values] - formatting parameters for the query string
     * @returns {external:Promise} Result of the query call:
     * - when no records are returned, it resolves with `undefined`
     * - when any data is returned, it rejects with {@link QueryResultError}
     * = `No return data was expected.`
     */
    obj.none = function (query, values) {
        return obj.query.call(this, query, values, $npm.result.none);
    };

    /**
     * @method Database.one
     * @summary Executes a query that expects exactly one row of data.
     * @param {String|Object} query -
     * - query string
     * - prepared statement object
     * @param {Array|value} [values] - formatting parameters for the query string
     * @returns {external:Promise} Result of the query call:
     * - when 1 row is returned, it resolves with that row as a single object;
     * - when no rows are returned, it rejects with {@link QueryResultError}
     * = `No data returned from the query.`
     * - when multiple rows are returned, it rejects with {@link QueryResultError}
     * = `Multiple rows were not expected.`
     */
    obj.one = function (query, values) {
        return obj.query.call(this, query, values, $npm.result.one);
    };

    /**
     * @method Database.many
     * @summary Executes a query that expects one or more rows.
     * @param {String|Object} query -
     * - query string
     * - prepared statement object
     * @param {Array|value} [values] - formatting parameters for the query string
     * @returns {external:Promise} Result of the query call:
     * - when 1 or more rows are returned, it resolves with the array of rows
     * - when no rows are returned, it rejects with {@link QueryResultError}
     * = `No data returned from the query.`
     */
    obj.many = function (query, values) {
        return obj.query.call(this, query, values, $npm.result.many);
    };

    /**
     * @method Database.oneOrNone
     * @summary Executes a query that expects 0 or 1 rows.
     * @param {String|Object} query -
     * - query string
     * - prepared statement object
     * @param {Array|value} [values] - formatting parameters for the query string
     * @returns {external:Promise} Result of the query call:
     * - when no rows are returned, it resolves with `null`
     * - when 1 row is returned, it resolves with that row as a single object
     * - when multiple rows are returned, it rejects with {@link QueryResultError}
     * = `Multiple rows were not expected.`
     */
    obj.oneOrNone = function (query, values) {
        return obj.query.call(this, query, values, $npm.result.one | $npm.result.none);
    };

    /**
     * @method Database.manyOrNone
     * @summary Executes a query that expects any number of rows.
     * @param {String|Object} query -
     * - query string
     * - prepared statement object
     * @param {Array|value} [values] - formatting parameters for the query string
     * @returns {external:Promise} Result of the query call:
     * - when no rows are returned, it resolves with an empty array
     * - when 1 or more rows are returned, it resolves with the array of rows.
     * @see {@link Database.any}
     */
    obj.manyOrNone = function (query, values) {
        return obj.query.call(this, query, values, $npm.result.many | $npm.result.none);
    };

    /**
     * Alias for method {@link Database.manyOrNone manyOrNone}
     * @method Database.any
     * @summary Executes a query that expects any number of rows.
     * @param {String|Object} query -
     * - query string
     * - prepared statement object
     * @param {Array|value} [values] - formatting parameters for the query string
     * @returns {external:Promise} The same as method {@link Database.manyOrNone manyOrNone}
     * @see {@link Database.manyOrNone}
     */
    obj.any = function (query, values) {
        return obj.query.call(this, query, values, $npm.result.any);
    };

    /**
     * @method Database.result
     * @summary Executes a query without any expectation for the return data,
     * to provide direct access to the $[Result] object.
     * @param {String|Object} query -
     * - query string
     * - prepared statement object
     * @param {Array|value} [values] - formatting parameters for the query string
     * @returns {external:Promise} Result of the query call:
     * - resolves with the original $[Result] object
     */
    obj.result = function (query, values) {
        return obj.query.call(this, query, values, $npm.special.cache.resultQuery);
    };

    /**
     * @method Database.stream
     * @summary Custom data streaming, with the help of $[pg-query-stream].
     * @param {QueryStream} qs - stream object of type $[QueryStream].
     * @param {Function} init - stream initialization callback, with
     * the same `this` context as the calling method.
     * @returns {external:Promise} Result of the streaming operation.
     *
     * Once the streaming has finished successfully, the method resolves with
     * `{processed, duration}`:
     * - `processed` - total number of rows processed;
     * - `duration` - streaming duration, in milliseconds.
     *
     * Possible rejections messages:
     * - `Invalid or missing stream object.`
     * - `Invalid stream state.`
     * - `Invalid or missing stream initialization callback.`
     */
    obj.stream = function (qs, init) {
        return obj.query.call(this, qs, init, $npm.special.cache.streamQuery);
    };

    /**
     * @method pg-promise.Database.func
     * @summary Executes a query against a database function by its name:
     * `select * from funcName(values)`
     * @param {String} funcName - name of the function to be executed.
     * @param {Array|value} [values] - parameters for the function.
     * @param {queryResult} [qrm=queryResult.any] - {@link queryResult Query Result Mask}.
     * @returns {external:Promise} Result of the query call, according to `qrm`.
     * @see {@link Database.query}
     */
    obj.func = function (funcName, values, qrm) {
        return obj.query.call(this, {
            funcName: funcName
        }, values, qrm);
    };

    /**
     * @method Database.proc
     * @summary Executes a query against a stored procedure via its name:
     * `select * from procName(values)`
     * @param {String} procName - name of the stored procedure to be executed.
     * @param {Array|value} [values] - parameters for the procedure.
     * @returns {external:Promise} The same result as method {@link Database.oneOrNone oneOrNone}.
     * @see {@link Database.oneOrNone}
     * @see {@link Database.func}
     */
    obj.proc = function (procName, values) {
        return obj.func.call(this, procName, values, $npm.result.one | $npm.result.none);
    };

    /**
     * @method Database.task
     * @summary Executes a callback function (or generator) with an automatically managed connection.
     * @param {Object|Function|generator} p1 - task tag object, if `p2` is `undefined`,
     * or else it is the callback function for the task.
     * @param {Function|generator} [p2] - task callback function, if it is not `undefined`,
     * or else `p2` is ignored.
     * @returns {external:Promise} Result from the task callback function.
     */
    obj.task = function (p1, p2) {
        return taskProcessor.call(this, p1, p2, false);
    };

    /**
     * @method Database.tx
     * @summary Executes a callback function (or generator) as a transaction.
     * @description
     * Executes a task as a transaction. The transaction will execute `ROLLBACK`
     * in the end, if the callback function returns a rejected promise or throws
     * an error; and it will execute `COMMIT` in all other cases.
     * @param {Object|Function|generator} p1 - transaction tag object, if `p2`
     * is `undefined`, or else it is the callback function for the transaction.
     * @param {Function|generator} [p2] - transaction callback function, if it is not `undefined`,
     * or else `p2` is ignored.
     * @returns {external:Promise} Result from the transaction callback function.
     */
    obj.tx = function (p1, p2) {
        return taskProcessor.call(this, p1, p2, true);
    };

    // Task method;
    // Resolves with result from the callback function;
    function taskProcessor(p1, p2, isTX) {

        var tag, // tag object/value;
            taskCtx = ctx.clone(); // task context object;

        if (isTX) {
            taskCtx.txLevel = taskCtx.txLevel >= 0 ? (taskCtx.txLevel + 1) : 0;
        }

        if (this !== obj) {
            taskCtx.context = this; // calling context object;
        }

        taskCtx.cb = p1; // callback function;

        // allow inserting a tag in front of the callback
        // function, for better code readability;
        if (p2 !== undefined) {
            tag = p1; // overriding any default tag;
            taskCtx.cb = p2;
        }

        var cb = taskCtx.cb;

        if (typeof cb !== 'function') {
            return $p.reject("Callback function is required for the " + (isTX ? "transaction." : "task."));
        }

        if (tag === undefined) {
            if (cb.tag !== undefined) {
                // use the default tag associated with the task:
                tag = cb.tag;
            } else {
                if (cb.name) {
                    tag = cb.name; // use the function name as tag;
                }
            }
        }

        var tsk = new $npm.task(taskCtx, tag, isTX);
        $extend(taskCtx, tsk);

        if (taskCtx.db) {
            // reuse existing connection;
            return $npm.task.exec(taskCtx, tsk, isTX);
        }

        // connection required;
        return $npm.connect(taskCtx)
            .then(function (db) {
                taskCtx.connect(db);
                return $npm.task.exec(taskCtx, tsk, isTX);
            })
            .then(function (data) {
                taskCtx.disconnect();
                return data;
            })
            .catch(function (error) {
                taskCtx.disconnect();
                return $p.reject(error);
            });
    }

    // lock all default properties to read-only,
    // to prevent override by the client.
    $npm.utils.lock(obj, false, ctx.options);

    // extend the protocol;
    $npm.events.extend(ctx.options, obj);

    // freeze the protocol permanently;
    $npm.utils.lock(obj, true, ctx.options);
}

module.exports = function (p) {
    $p = p;
    $npm.connect = require('./connect')(p);
    $npm.task = require('./task')(p);
    return $extend;
};
var _VERSION = '{{.Version}}';
var _DEFAULT_OPEN_DELIMITER = '{{.OpenDelimiter}}';
var _DEFAULT_CLOSE_DELIMITER = '{{.CloseDelimiter}}';
var _DEFAULT_DELIMITER = '{{.Delimiter}}';
var _NAME = 'ejs';
var _REGEX_STRING = '(<%%|%%>|<%=|<%-|<%_|<%#|<%|%>|-%>|_%>)';
var _JS_IDENTIFIER = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
var _DEFAULT_LOCALS_NAME = 'locals';
var _OPTS_PASSABLE_WITH_DATA = ['delimiter', 'debug', 'compileDebug', 'rmWhitespace', 'filename'];

function rethrow(err, str, flnm, lineno, esc) {
	var lines = str.split('\n');
	var start = Math.max(lineno - 3, 0);
	var end = Math.min(lines.length, lineno + 3);
	var filename = esc(flnm);
	// Error context
	var context = lines.slice(start, end).map(function (line, i) {
		var curr = i + start + 1;
		return (curr == lineno ? ' >> ' : '    ')
			+ curr
			+ '| '
			+ line;
	}).join('\n');

	// Alter exception message
	err.path = filename;
	err.message = (filename || 'ejs') + ':'
		+ lineno + '\n'
		+ context + '\n\n'
		+ err.message;

	throw err;
}

function stripSemi(str) {
	return str.replace(/;(\s*$)/, '$1');
}

var exports = {};

exports.VERSION = _VERSION;

exports.compile = function compile(template, opts) {
	var templ = new Template(template, opts);
	return templ.compile();
};

exports.render = function (template, d, o) {
	var data = d || utils.createNullProtoObjWherePossible();
	var opts = o || utils.createNullProtoObjWherePossible();

	if (arguments.length == 2) {
		utils.shallowCopyFromList(opts, data, _OPTS_PASSABLE_WITH_DATA);
	}

	return exports.compile(template, opts)(data);
}

function Template(text, opts) {
	opts = opts || utils.createNullProtoObjWherePossible();
	var options = utils.createNullProtoObjWherePossible();
	this.templateText = text;

	this.mode = null;
	this.truncate = false;
	this.currentLine = 1;
	this.source = '';
	options.compileDebug = opts.compileDebug !== false;
	options.debug = !!opts.debug;
	options.openDelimiter = opts.openDelimiter || _DEFAULT_OPEN_DELIMITER;
	options.closeDelimiter = opts.closeDelimiter || _DEFAULT_CLOSE_DELIMITER;
	options.delimiter = opts.delimiter || _DEFAULT_DELIMITER;
	options.rmWhitespace = opts.rmWhitespace;
	options.escapeFn = opts.escapeFn || utils.escapeXML;
	options.filename = opts.filename;
	options.localsName = opts.localsName || _DEFAULT_LOCALS_NAME;

	this.opts = options;
	this.regex = this.createRegex();
}

Template.modes = {
	EVAL: 'eval',
	ESCAPED: 'escaped',
	RAW: 'raw',
	COMMENT: 'comment',
	LITERAL: 'literal'
};

Template.prototype = {
	createRegex: function () {
		var str = _REGEX_STRING;
		var delim = utils.escapeRegExpChars(this.opts.delimiter);
		var open = utils.escapeRegExpChars(this.opts.openDelimiter);
		var close = utils.escapeRegExpChars(this.opts.closeDelimiter);
		str = str.replace(/%/g, delim)
			.replace(/</g, open)
			.replace(/>/g, close);
		return new RegExp(str);
	},

	compile: function () {
		/** @type {string} */
		var src;
		/** @type {ClientFunction} */
		var fn;
		var opts = this.opts;
		var prepended = '';
		var appended = '';
		/** @type {EscapeCallback} */
		var escapeFn = opts.escapeFn;
		/** @type {FunctionConstructor} */
		var ctor;
		/** @type {string} */
		var sanitizedFilename = opts.filename ? JSON.stringify(opts.filename) : 'undefined';

		if (!this.source) {
			this.generateSource();
			prepended +=
				'  var __output = "";\n' +
				'  function __append(s) { if (s !== undefined && s !== null) __output += s }\n';
			if (opts.outputFunctionName) {
				if (!_JS_IDENTIFIER.test(opts.outputFunctionName)) {
					throw new Error('outputFunctionName is not a valid JS identifier.');
				}
				prepended += '  var ' + opts.outputFunctionName + ' = __append;' + '\n';
			}
			if (opts.localsName && !_JS_IDENTIFIER.test(opts.localsName)) {
				throw new Error('localsName is not a valid JS identifier.');
			}

			prepended += '  with (' + opts.localsName + ' || {}) {' + '\n';
			appended += '  }' + '\n';

			appended += '  return __output;' + '\n';
			this.source = prepended + this.source + appended;
		}

		if (opts.compileDebug) {
			src = 'var __line = 1' + '\n'
				+ '  , __lines = ' + JSON.stringify(this.templateText) + '\n'
				+ '  , __filename = ' + sanitizedFilename + ';' + '\n'
				+ 'try {' + '\n'
				+ this.source
				+ '} catch (e) {' + '\n'
				+ '  rethrow(e, __lines, __filename, __line, escapeFn);' + '\n'
				+ '}' + '\n';
		}
		else {
			src = this.source;
		}

		if (opts.debug) {
			console.log(src);
		}
		if (opts.compileDebug && opts.filename) {
			src = src + '\n'
				+ '//# sourceURL=' + sanitizedFilename + '\n';
		}

		try {
			fn = new Function(opts.localsName + ', escapeFn, rethrow', src);
		} catch (e) {
			if (e instanceof SyntaxError) {
				if (opts.filename) {
					e.message += ' in ' + opts.filename;
				}
				e.message += ' while compiling ejs\n\n';
				e.message += 'If the above error is not helpful, you may want to try EJS-Lint:\n';
				e.message += 'https://github.com/RyanZim/EJS-Lint';
				if (!opts.async) {
					e.message += '\n';
					e.message += 'Or, if you meant to create an async function, pass `async: true` as an option.';
				}
			}
			throw e;
		}

		var returnedFn = function(data) {
			return fn.apply(opts.context,
				[data || utils.createNullProtoObjWherePossible(), escapeFn, rethrow]);
		};

		return returnedFn;
	},

	generateSource: function () {
		var opts = this.opts;

		if (opts.rmWhitespace) {
			// Have to use two separate replace here as `^` and `$` operators don't
			// work well with `\r` and empty lines don't work well with the `m` flag.
			this.templateText =
				this.templateText.replace(/[\r\n]+/g, '\n').replace(/^\s+|\s+$/gm, '');
		}

		// keep this
		// Slurp spaces and tabs before <%_ and after _%>
		this.templateText =
			this.templateText.replace(/[ \t]*<%_/gm, '<%_').replace(/_%>[ \t]*/gm, '_%>');

		var self = this;
		var matches = this.parseTemplateText();
		var d = this.opts.delimiter;
		var o = this.opts.openDelimiter;
		var c = this.opts.closeDelimiter;

		if (matches && matches.length) {
			matches.forEach(function (line, index) {
				var closing;
				// If this is an opening tag, check for closing tags
				// FIXME: May end up with some false positives here
				// Better to store modes as k/v with openDelimiter + delimiter as key
				// Then this can simply check against the map
				if (line.indexOf(o + d) === 0        // If it is a tag
					&& line.indexOf(o + d + d) !== 0) { // and is not escaped
					closing = matches[index + 2];
					if (!(closing == d + c || closing == '-' + d + c || closing == '_' + d + c)) {
						throw new Error('Could not find matching close tag for "' + line + '".');
					}
				}
				self.scanLine(line);
			});
		}
	},

	parseTemplateText: function () {
		var str = this.templateText;
		var pat = this.regex;
		var result = pat.exec(str);
		var arr = [];
		var firstPos;

		while (result) {
			firstPos = result.index;

			if (firstPos !== 0) {
				arr.push(str.substring(0, firstPos));
				str = str.slice(firstPos);
			}

			arr.push(result[0]);
			str = str.slice(result[0].length);
			result = pat.exec(str);
		}

		if (str) {
			arr.push(str);
		}

		return arr;
	},

	_addOutput: function (line) {
		if (this.truncate) {
			// Only replace single leading linebreak in the line after
			// -%> tag -- this is the single, trailing linebreak
			// after the tag that the truncation mode replaces
			// Handle Win / Unix / old Mac linebreaks -- do the \r\n
			// combo first in the regex-or
			line = line.replace(/^(?:\r\n|\r|\n)/, '');
			this.truncate = false;
		}
		if (!line) {
			return line;
		}

		// Preserve literal slashes
		line = line.replace(/\\/g, '\\\\');

		// Convert linebreaks
		line = line.replace(/\n/g, '\\n');
		line = line.replace(/\r/g, '\\r');

		// Escape double-quotes
		// - this will be the delimiter during execution
		line = line.replace(/"/g, '\\"');
		this.source += '    ; __append("' + line + '")' + '\n';
	},

	scanLine: function (line) {
		var self = this;
		var d = this.opts.delimiter;
		var o = this.opts.openDelimiter;
		var c = this.opts.closeDelimiter;
		var newLineCount = 0;

		newLineCount = (line.split('\n').length - 1);

		switch (line) {
			case o + d:
			case o + d + '_':
				this.mode = Template.modes.EVAL;
				break;
			case o + d + '=':
				this.mode = Template.modes.ESCAPED;
				break;
			case o + d + '-':
				this.mode = Template.modes.RAW;
				break;
			case o + d + '#':
				this.mode = Template.modes.COMMENT;
				break;
			case o + d + d:
				this.mode = Template.modes.LITERAL;
				this.source += '    ; __append("' + line.replace(o + d + d, o + d) + '")' + '\n';
				break;
			case d + d + c:
				this.mode = Template.modes.LITERAL;
				this.source += '    ; __append("' + line.replace(d + d + c, d + c) + '")' + '\n';
				break;
			case d + c:
			case '-' + d + c:
			case '_' + d + c:
				if (this.mode == Template.modes.LITERAL) {
					this._addOutput(line);
				}

				this.mode = null;
				this.truncate = line.indexOf('-') === 0 || line.indexOf('_') === 0;
				break;
			default:
				// In script mode, depends on type of tag
				if (this.mode) {
					// If '//' is found without a line break, add a line break.
					switch (this.mode) {
						case Template.modes.EVAL:
						case Template.modes.ESCAPED:
						case Template.modes.RAW:
							if (line.lastIndexOf('//') > line.lastIndexOf('\n')) {
								line += '\n';
							}
					}
					switch (this.mode) {
						// Just executing code
						case Template.modes.EVAL:
							this.source += '    ; ' + line + '\n';
							break;
						// Exec, esc, and output
						case Template.modes.ESCAPED:
							this.source += '    ; __append(escapeFn(' + stripSemi(line) + '))' + '\n';
							break;
						// Exec and output
						case Template.modes.RAW:
							this.source += '    ; __append(' + stripSemi(line) + ')' + '\n';
							break;
						case Template.modes.COMMENT:
							// Do nothing
							break;
						// Literal <%% mode, append as raw output
						case Template.modes.LITERAL:
							this._addOutput(line);
							break;
					}
				}
				// In string mode, just add the output
				else {
					this._addOutput(line);
				}
		}

		if (self.opts.compileDebug && newLineCount) {
			this.currentLine += newLineCount;
			this.source += '    ; __line = ' + this.currentLine + '\n';
		}
	},
}

exports.Template = Template;

var _MATCH_HTML = /[&<>'"]/g;

var _ENCODE_HTML_RULES = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&#34;',
	"'": '&#39;'
};

function encode_char(c) {
	return _ENCODE_HTML_RULES[c] || c;
}

var regExpChars = /[|\\{}()[\]^$+*?.]/g;

var utils = {
	createNullProtoObjWherePossible: function () {
		if (typeof Object.create == 'function') {
			return function () {
				return Object.create(null);
			};
		}

		if (!({
			__proto__: null
		} instanceof Object)) {
			return function () {
				return {
					__proto__: null
				};
			};
		} // Not possible, just pass through


		return function () {
			return {};
		};
	},

	escapeRegExpChars: function (string) {
		// istanbul ignore if
		if (!string) {
			return '';
		}

		return String(string).replace(regExpChars, '\\$&');
	},

	escapeXML: function (markup) {
		return markup == undefined ? '' : String(markup).replace(_MATCH_HTML, encode_char);
	},

	shallowCopyFromList: function (to, from, list) {
		list = list || [];
		from = from || {};

		if (to !== null && to !== undefined) {
			for (var i = 0; i < list.length; i++) {
				var p = list[i];

				if (typeof from[p] != 'undefined') {
					to[p] = from[p];
				}
			}
		}

		return to;
	},
}

exports.name = _NAME;

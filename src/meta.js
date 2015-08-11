module.exports = {
	generateConstructor: function(name, schema) {
		var src = [
		"return function " + name + "(params) {",
		"if (this._index == null) { this._index = null }",
		"if (this.id == null) { this.id = null; }",
		];

		var withParams = ["if (params) {"];
		var withoutParams = ["} else {"];

		var keys = Object.keys(schema);

		for (var i=0; i<keys.length; i++) {
			var key = keys[i];
			var defaultValue = schema[key];
			var defaultString;

			var qkey = "'" + key + "'";
			var keySetter = "this[" + qkey + "] = ";
			var defaultValue = JSON.stringify(defaultValue);
			var setDefault = keySetter + defaultValue;
			var maybeSetDefault = 
				keySetter + 
				"(" + qkey + " in params) ? params[" + qkey + "] : " + 
				defaultValue + ";"; 

			withParams.push(maybeSetDefault);
			withoutParams.push(setDefault + ";");
		}

		src.push.apply(src, withParams);
		src.push.apply(src, withoutParams);
		src.push("}");
		src.push("}");

		return Function(src.join("\n"))();

	}
}
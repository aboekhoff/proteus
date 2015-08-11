// low level object pooling

function ObjectPool(klass, initialSize) {
	this.klass = klass;
	this.initialSize = initialSize || 100;
	this.pool = [];
	this.marker = 0;
	this.resizePool(this.initialSize);
}

ObjectPool.prototype.resizePool = function(newSize) {
	var oldSize = this.pool.length;
	this.pool.length = newSize;

	for (var i=oldSize; i<newSize; i++) {
		var instance = new this.klass(null);
		instance._index = i;
		this.pool[i] = instance;
	}
}

// public API

ObjectPool.prototype.toArray = function() {
	return this.pool.slice(0, this.marker);
}

// finds an instance by index
ObjectPool.prototype.get = function(index) {
	return this.pool[index];
}

// returns an index
ObjectPool.prototype.create = function(params) {
	var index = this.marker; 
	this.marker++;

	if (index >= this.pool.length) {
		this.resizePool(this.pool.length + this.initialSize);
	}

	var instance = this.pool[index];
	this.klass.call(instance, params);

	return instance;
}

ObjectPool.prototype.dispose = function(instance) {
	var index = instance._index;

	if (index < this.marker-1) {
		var swapIndex = this.marker-1;
		var swapInstance = this.pool[this.marker-1];

		this.pool[index] = swapInstance;
		swapInstance._index = index;

		this.pool[swapIndex] = instance;
		instance._index = swapIndex;
	}

	this.marker--;
}

module.exports = ObjectPool;
export class Queue {
	constructor() {
		this.items = [];
	}

	add(item) {
		this.items.push(item);
	}

	next() {
		if (this.isEmpty()) {
			return null;
		}
		return this.items.shift();
	}

	isEmpty() {
		return this.items.length === 0;
	}

	size() {
		return this.items.length;
	}
}

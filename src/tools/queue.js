import { EventEmitter } from "events";

export class Queue extends EventEmitter {
	constructor() {
		super();
		this.items = [];
	}

	add(item) {
		this.items.push(item);
		this.emit("item", item);
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

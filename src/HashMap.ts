/**
 * HashMap – in-memory key-value store.
 *
 * Internals
 * ─────────
 * • Bucket table  : plain object keyed by numeric index (no array)
 * • Collision resolution : separate chaining via singly-linked list nodes
 * • Hash function : polynomial rolling hash (djb2-style) over UTF-16 code units
 *
 * Average-case complexity
 * ───────────────────────
 * get / set / delete : O(1)
 * All iterations     : O(n)
 */

// ── Linked-list node ────────────────────────────────────────────────────────

interface Node<V> {
  key: string;
  value: V;
  next: Node<V> | null;
}

function makeNode<V>(key: string, value: V): Node<V> {
  return { key, value, next: null };
}

// ── Bucket table (plain object, no array) ───────────────────────────────────

type BucketTable<V> = Record<number, Node<V>>;

// ── HashMap class ────────────────────────────────────────────────────────────

export class HashMap<V = string> {
  /** Number of buckets – should be prime to reduce clustering. */
  private readonly capacity: number;
  private buckets: BucketTable<V>;
  private _size: number;

  constructor(capacity = 53) {
    this.capacity = capacity;
    this.buckets = Object.create(null) as BucketTable<V>;
    this._size = 0;
  }

  // ── Hash function ──────────────────────────────────────────────────────────

  /**
   * Polynomial rolling hash (djb2).
   * Returns an integer in [0, capacity).
   */
  private hash(key: string): number {
    let hash = 5381;
    for (let i = 0; i < key.length; i++) {
      // hash * 33 XOR char-code
      hash = (hash * 33) ^ key.charCodeAt(i);
      // keep within 32-bit signed range to stay fast
      hash |= 0;
    }
    return Math.abs(hash) % this.capacity;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Number of stored entries. */
  get size(): number {
    return this._size;
  }

  /**
   * Insert or update a key-value pair.
   * O(1) average – walks the chain only when a collision occurs.
   */
  set(key: string, value: V): void {
    const index = this.hash(key);
    const head = this.buckets[index];

    if (head === undefined) {
      // Empty bucket – no collision
      this.buckets[index] = makeNode(key, value);
      this._size++;
      return;
    }

    // Walk the chain looking for an existing entry to update
    let current: Node<V> | null = head;
    while (current !== null) {
      if (current.key === key) {
        current.value = value; // Update in place
        return;
      }
      if (current.next === null) break;
      current = current.next;
    }

    // Key not found – append a new node (collision handled via chaining)
    current!.next = makeNode(key, value);
    this._size++;
  }

  /**
   * Retrieve a value by key.
   * Returns `undefined` if the key does not exist.
   * O(1) average.
   */
  get(key: string): V | undefined {
    const index = this.hash(key);
    let current: Node<V> | null = this.buckets[index] ?? null;

    while (current !== null) {
      if (current.key === key) return current.value;
      current = current.next;
    }
    return undefined;
  }

  /**
   * Check whether a key exists.
   * O(1) average.
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete an entry by key.
   * Returns `true` if the key existed, `false` otherwise.
   * O(1) average.
   */
  delete(key: string): boolean {
    const index = this.hash(key);
    const head = this.buckets[index];
    if (head === undefined) return false;

    // Head matches
    if (head.key === key) {
      if (head.next === null) {
        delete this.buckets[index];
      } else {
        this.buckets[index] = head.next;
      }
      this._size--;
      return true;
    }

    // Walk the chain
    let prev: Node<V> = head;
    let current: Node<V> | null = head.next;

    while (current !== null) {
      if (current.key === key) {
        prev.next = current.next;
        this._size--;
        return true;
      }
      prev = current;
      current = current.next;
    }
    return false;
  }

  /** Remove all entries. */
  clear(): void {
    this.buckets = Object.create(null) as BucketTable<V>;
    this._size = 0;
  }

  /**
   * Iterate over all [key, value] pairs.
   * Walks every bucket in index order, then each chain.
   */
  entries(): Array<[string, V]> {
    const result: Array<[string, V]> = [];
    for (const indexStr of Object.keys(this.buckets)) {
      let node: Node<V> | null = this.buckets[Number(indexStr)];
      while (node !== null) {
        result.push([node.key, node.value]);
        node = node.next;
      }
    }
    return result;
  }

  /**
   * Returns a debug snapshot: for each occupied bucket index,
   * lists the chain of keys (shows where collisions occurred).
   */
  debugBuckets(): Array<{ index: number; chain: string[] }> {
    return Object.keys(this.buckets).map((indexStr) => {
      const index = Number(indexStr);
      const chain: string[] = [];
      let node: Node<V> | null = this.buckets[index];
      while (node !== null) {
        chain.push(node.key);
        node = node.next;
      }
      return { index, chain };
    });
  }
}

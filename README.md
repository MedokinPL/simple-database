# Simple Database

An in-memory key-value store built with a custom hashmap and a React + TypeScript frontend.

## Features

- **O(1) average lookups** — data is retrieved instantly regardless of how many entries are stored
- **Custom hashmap** — implemented from scratch, not backed by a JS `Map` or plain array
- **Separate chaining** — collisions are resolved using singly-linked list nodes; no data is lost when two keys hash to the same bucket
- **djb2 hash function** — polynomial rolling hash over UTF-16 code units
- **Bucket visualizer** — the UI shows which buckets are in use and highlights any collisions in real time

## How it works

```
Key  ──► hash(key) ──► bucket index ──► linked-list chain ──► value
```

The bucket table is a plain object (`Record<number, Node>`) with 53 prime-numbered slots. When two keys produce the same index (a collision), a new node is appended to the chain at that bucket — no data is overwritten.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript |
| Bundler | Vite |
| Storage | Custom `HashMap<V>` class (`src/HashMap.ts`) |

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Project structure

```
src/
  HashMap.ts   # Hashmap implementation (hash function + separate chaining)
  App.tsx      # React UI (insert, lookup, delete, bucket visualizer)
  main.tsx     # Entry point
  index.css    # Styles
```

## Complexity

| Operation | Average | Worst case |
|-----------|---------|------------|
| `set`     | O(1)    | O(n)       |
| `get`     | O(1)    | O(n)       |
| `delete`  | O(1)    | O(n)       |
| `entries` | O(n)    | O(n)       |

Worst case occurs only when all keys collide into the same bucket (extremely unlikely with a prime capacity and a good hash function).

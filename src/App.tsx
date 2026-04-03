import { useState, useMemo, useCallback } from "react";
import { HashMap } from "./HashMap";

// Singleton map that lives for the entire session
const db = new HashMap<string>();

type Entry = [string, string];
type DebugBucket = { index: number; chain: string[] };

type Notification = { kind: "ok" | "err"; text: string };

export default function App() {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [searchResult, setSearchResult] = useState<string | null | undefined>(
    undefined
  );

  // re-render trigger
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => t + 1), []);

  const [notification, setNotification] = useState<Notification | null>(null);

  function notify(kind: Notification["kind"], text: string) {
    setNotification({ kind, text });
    setTimeout(() => setNotification(null), 2500);
  }

  const entries: Entry[] = useMemo(() => db.entries(), [tick]);
  const debugBuckets: DebugBucket[] = useMemo(() => db.debugBuckets(), [tick]);
  const hasCollisions = debugBuckets.some((b) => b.chain.length > 1);

  // ── Operations ──────────────────────────────────────────────────────────────

  function handleSet() {
    const k = key.trim();
    const v = value.trim();
    if (!k) { notify("err", "Key cannot be empty."); return; }
    const existed = db.has(k);
    db.set(k, v);
    notify("ok", existed ? `Updated "${k}".` : `Inserted "${k}".`);
    setKey("");
    setValue("");
    bump();
  }

  function handleGet() {
    const k = searchKey.trim();
    if (!k) { notify("err", "Enter a key to search."); return; }
    setSearchResult(db.get(k));
  }

  function handleDelete(k: string) {
    db.delete(k);
    if (searchKey === k) setSearchResult(undefined);
    notify("ok", `Deleted "${k}".`);
    bump();
  }

  function handleClear() {
    db.clear();
    setSearchResult(undefined);
    notify("ok", "All entries cleared.");
    bump();
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="app">
      <header>
        <h1>Simple Database</h1>
        <p className="subtitle">
          In-memory key-value store &bull; Custom hashmap &bull; Separate
          chaining
        </p>
      </header>

      {notification && (
        <div className={`toast toast--${notification.kind}`}>
          {notification.text}
        </div>
      )}

      <div className="grid">
        {/* ── SET ── */}
        <section className="card">
          <h2>Insert / Update</h2>
          <label>
            Key
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g. username"
            />
          </label>
          <label>
            Value
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. alice"
            />
          </label>
          <button className="btn btn--primary" onClick={handleSet}>
            SET
          </button>
        </section>

        {/* ── GET ── */}
        <section className="card">
          <h2>Lookup</h2>
          <label>
            Key
            <input
              value={searchKey}
              onChange={(e) => { setSearchKey(e.target.value); setSearchResult(undefined); }}
              placeholder="e.g. username"
            />
          </label>
          <button className="btn btn--secondary" onClick={handleGet}>
            GET
          </button>
          {searchResult !== undefined && (
            <div className={`result ${searchResult === undefined ? "result--miss" : "result--hit"}`}>
              {searchResult !== undefined
                ? <><span className="label">Value:</span> <strong>{searchResult}</strong></>
                : <span className="label">Key not found.</span>}
            </div>
          )}
          {searchResult === undefined && searchKey && (
            <div className="result result--miss">
              <span className="label">Key not found.</span>
            </div>
          )}
        </section>
      </div>

      {/* ── ENTRIES TABLE ── */}
      <section className="card card--wide">
        <div className="card-header">
          <h2>Stored entries <span className="badge">{db.size}</span></h2>
          {db.size > 0 && (
            <button className="btn btn--danger btn--sm" onClick={handleClear}>
              Clear all
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <p className="empty">No entries yet. Insert something above.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
                <th>Hash index</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([k, v]) => (
                <tr key={k}>
                  <td className="mono">{k}</td>
                  <td>{v}</td>
                  <td className="mono center">{hashIndex(k)}</td>
                  <td>
                    <button
                      className="btn btn--danger btn--sm"
                      onClick={() => handleDelete(k)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── BUCKET VISUALIZER ── */}
      <section className="card card--wide">
        <h2>
          Bucket view{" "}
          {hasCollisions && (
            <span className="badge badge--warn">collisions detected</span>
          )}
        </h2>
        <p className="hint">
          Capacity: <strong>53</strong> buckets &mdash; each cell shows the
          linked-list chain stored in that bucket. Multiple keys in one cell
          means a collision was resolved by chaining.
        </p>

        {debugBuckets.length === 0 ? (
          <p className="empty">No buckets in use.</p>
        ) : (
          <div className="bucket-grid">
            {debugBuckets.map(({ index, chain }) => (
              <div
                key={index}
                className={`bucket ${chain.length > 1 ? "bucket--collision" : ""}`}
              >
                <span className="bucket-index">[{index}]</span>
                <div className="chain">
                  {chain.map((k, i) => (
                    <span key={k} className="chain-node">
                      <span className="chain-key">{k}</span>
                      {i < chain.length - 1 && (
                        <span className="chain-arrow">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/** Expose the same hash logic used by HashMap for display in the table. */
function hashIndex(key: string, capacity = 53): number {
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 33) ^ key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % capacity;
}

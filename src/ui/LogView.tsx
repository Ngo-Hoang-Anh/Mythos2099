import type { LogEntry } from "../engine/types";
import { LogGlyph } from "./icons";

function LogNode({ entry, depth }: { entry: LogEntry; depth: number }) {
  if (entry.children && entry.children.length > 0) {
    return (
      <section className={`log-frame depth-${Math.min(depth, 2)}`}>
        <header>
          <LogGlyph icon={entry.icon} size={depth === 0 ? 16 : 14} />
          <span>{entry.text}</span>
        </header>
        <div className="log-frame-body">
          {entry.children.map((child, i) => (
            <LogNode key={`${child.text}-${i}`} entry={child} depth={depth + 1} />
          ))}
        </div>
      </section>
    );
  }
  return (
    <div className="log-step">
      <LogGlyph icon={entry.icon} />
      <span>{entry.text}</span>
    </div>
  );
}

export function LogView({ entries }: { entries: LogEntry[] }) {
  if (entries.length === 0) return <p>No log yet.</p>;
  return (
    <>
      {[...entries].reverse().map((entry, i) => (
        <LogNode key={`${entry.text}-${i}`} entry={entry} depth={0} />
      ))}
    </>
  );
}

import type { Backup } from "../models/types";

interface DurableStore {
  read(): Promise<Backup>;
  replace(snapshot: Backup): Promise<void>;
  persist(snapshot: Backup): Promise<void>;
}

/** Serializes mutations. A successful save means native disk persistence completed. */
export function createDurableWriter(store: DurableStore) {
  let tail: Promise<unknown> = Promise.resolve();
  return function write<T>(work: () => Promise<T>): Promise<T> {
    const operation = tail.then(async () => {
      const previous = await store.read();
      try {
        const result = await work();
        await store.persist(await store.read());
        return result;
      } catch (error) {
        try {
          await store.replace(previous);
        } catch {
          throw new Error(
            "Speichern fehlgeschlagen. Bitte Tankmo neu öffnen, um den letzten gesicherten Stand zu laden.",
          );
        }
        throw error;
      }
    });
    // A rejected operation must not block later retries.
    tail = operation.catch(() => {});
    return operation;
  };
}

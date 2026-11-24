import { SOURCES, type Source } from "./types";

/** Builds a `Record<Source, T>` by calling `build` once per source. */
export function bySource<T>(build: (source: Source) => T): Record<Source, T> {
  return Object.fromEntries(SOURCES.map((source) => [source, build(source)])) as Record<Source, T>;
}

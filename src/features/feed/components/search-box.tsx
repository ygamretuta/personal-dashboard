import type { Ref } from "react";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  inputRef: Ref<HTMLInputElement>;
}

export function SearchBox({ value, onChange, onClear, inputRef }: SearchBoxProps) {
  return (
    <div className="px-4 pt-2">
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => event.key === "Escape" && onClear()}
        placeholder="Search…  ( / )"
        aria-label="Search inbox"
        className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm placeholder:text-muted"
      />
    </div>
  );
}

export function LoadFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center"
    >
      <p className="text-lg">Couldn&apos;t load your inbox</p>
      <p className="text-sm text-muted">
        Check your connection, or reconnect your accounts in settings.
      </p>
      <button type="button" onClick={onRetry} className="btn btn-primary">
        Try again
      </button>
    </div>
  );
}

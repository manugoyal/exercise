export function ErrorDisplay({ error }: { error: unknown }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{`${error}`}</pre>
    </div>
  );
}

import { createContext } from "react";

export type ErrorContextT = {
  error: unknown | undefined;
  setError: (error: unknown) => void;
};

export const ErrorContext = createContext<ErrorContextT>({
  error: undefined,
  setError: () => {},
});

export function ErrorDisplay({ error }: { error: any }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  );
}

export function wrapAsyncError<F extends (...args: any[]) => Promise<any>>(
  f: F,
  setError: (error: unknown) => void,
): (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>> | null> {
  return async (...args: any[]): Promise<Awaited<ReturnType<F>> | null> => {
    try {
      return await f(...args);
    } catch (error) {
      console.error(error);
      setError(error);
      return null;
    }
  };
}

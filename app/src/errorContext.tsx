import { createContext, useContext } from "react";

export type ErrorContextT = {
  error: unknown | undefined;
  setError: (error: unknown) => void;
};

export const ErrorContext = createContext<ErrorContextT>({
  error: undefined,
  setError: () => {},
});

export function ErrorDisplay({ error }: { error: { message: string } }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericFunctionT = (...args: any[]) => Promise<any>;

export type WrappedAsyncF<F extends GenericFunctionT> = (
  ...args: Parameters<F>
) => Promise<Awaited<ReturnType<F>> | null>;

export function wrapAsync<F extends GenericFunctionT>(
  f: F,
  setError: (error: unknown) => void,
): WrappedAsyncF<F> {
  return async (...args: unknown[]) => {
    try {
      return await f(...args);
    } catch (e) {
      console.log(e);
      setError(e);
      return null;
    }
  };
}

export function useWrapAsync<F extends GenericFunctionT>(
  f: F,
): WrappedAsyncF<F> {
  const { setError } = useContext(ErrorContext);
  return wrapAsync(f, setError);
}

import { createContext, useState } from "react";
import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { bark } from "./bark";

export type Connection = {
  client: SupabaseClient;
  auth_id: string;
  runRpc: (fn: string, args?: unknown) => Promise<unknown>;
};

export const ConnectionContext = createContext<Connection>({
  client: undefined as unknown as SupabaseClient,
  auth_id: undefined as unknown as string,
  runRpc: async () => {},
});

const SupabaseUrl =
  process.env.REACT_APP_SUPABASE_URL ??
  `http://${window.location.hostname}:54321`;

export function useMakeConnection() {
  const [connection, setConnection] = useState<Connection | undefined>(
    undefined,
  );

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    bark();
    if (!(username && password)) {
      throw new Error("All fields must be filled");
    }
    if (!process.env.REACT_APP_SUPABASE_ANON_KEY) {
      throw new Error("App was not built with required env vars");
    }

    const client = createClient(
      SupabaseUrl,
      process.env.REACT_APP_SUPABASE_ANON_KEY,
    );
    const runRpc = async (fn: string, args?: unknown) => {
      const { data, error } = await client.rpc(fn, args);
      if (error) {
        throw new Error(JSON.stringify(error));
      }
      return data;
    };
    const auth_id = z.string().parse(
      await runRpc("lookup_auth_id", {
        _name: username,
        _password: password,
      }),
    );
    if (auth_id) {
      setConnection({ client, auth_id, runRpc });
    }
  }

  function eventSetter(setter: (x: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.value);
  }

  const loginForm = (
    <form onSubmit={handleSubmit}>
      <label>
        Username:
        <input
          type="text"
          id="username"
          value={username}
          onChange={eventSetter(setUsername)}
        />
      </label>
      <br />
      <label>
        Password:
        <input
          type="password"
          id="password"
          value={password}
          onChange={eventSetter(setPassword)}
        />
      </label>
      <br />
      <button type="submit"> Submit </button>
    </form>
  );

  return { connection, loginForm };
}

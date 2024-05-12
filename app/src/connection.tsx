import { useContext, useState } from "react";
import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { ErrorContext, wrapAsyncError } from "./errorContext";

export type ConnectionState = {
  client: SupabaseClient;
  auth_id: string;
  runRpc: (fn: string, args?: any) => Promise<any>;
};

export function useMakeConnection() {
  const { setError } = useContext(ErrorContext);

  const [connection, setConnection] = useState<ConnectionState | undefined>(
    undefined,
  );

  const [supabaseUrl, setSupabaseUrl] = useState<string>(
    process.env.REACT_APP_SUPABASE_URL || "",
  );
  const [supabaseKey, setSupabaseKey] = useState<string>(
    process.env.REACT_APP_SUPABASE_ANON_KEY || "",
  );
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleSubmit = wrapAsyncError(async (e: any) => {
    e.preventDefault();
    if (!(supabaseUrl && supabaseKey && username && password)) {
      throw new Error("All fields must be filled");
    }

    const client = createClient(supabaseUrl, supabaseKey);
    const runRpc = wrapAsyncError(async (fn: string, args?: any) => {
      const { data, error } = await client.rpc(fn, args);
      if (error) {
        throw new Error(JSON.stringify(error));
      }
      return data;
    }, setError);
    const auth_id = z
      .string()
      .nullish()
      .parse(
        await runRpc("lookup_auth_id", {
          _name: username,
          _password: password,
        }),
      );
    if (auth_id) {
      setConnection({ client, auth_id, runRpc });
    }
  }, setError);

  function eventSetter(setter: any) {
    return (e: any) => setter(e.target.value);
  }

  const loginForm = (
    <form onSubmit={handleSubmit}>
      <label>
        Supabase URL:
        <input
          type="text"
          value={supabaseUrl}
          onChange={eventSetter(setSupabaseUrl)}
        />
      </label>
      <br />
      <label>
        Supabase key:
        <input
          type="text"
          value={supabaseKey}
          onChange={eventSetter(setSupabaseKey)}
        />
      </label>
      <br />
      <label>
        Username:
        <input
          type="text"
          value={username}
          onChange={eventSetter(setUsername)}
        />
      </label>
      <br />
      <label>
        Password:
        <input
          type="text"
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

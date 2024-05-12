import { useContext, useEffect, useState } from "react";
import { z } from "zod";

import { useMakeConnection } from "./connection";
import { ErrorContext, ErrorDisplay, wrapAsyncError } from "./errorContext";

function App() {
  const { error, setError } = useContext(ErrorContext);

  const { connection, loginForm } = useMakeConnection();

  const [userId, setUserId] = useState<string | undefined>(undefined);
  useEffect(() => {
    const fetchUserId = wrapAsyncError(async () => {
      if (!connection) return;
      const res = z.string().parse(
        await connection.runRpc("lookup_user_id", {
          _auth_id: connection.auth_id,
        }),
      );
      setUserId(res);
    }, setError);
    fetchUserId();
  }, [connection, setError]);

  if (error !== undefined) {
    return <ErrorDisplay error={error} />;
  }

  if (connection === undefined) {
    return <dialog open>{loginForm}</dialog>;
  }

  return <div> You are in, {userId}! </div>;
}

export default App;

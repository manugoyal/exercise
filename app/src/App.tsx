import { useContext, useEffect, useState } from "react";
import { z } from "zod";

import { useMakeConnection } from "./connection";
import { ErrorContext, wrapAsync } from "./errorContext";

function App() {
  const { connection, loginForm } = useMakeConnection();
  const { setError } = useContext(ErrorContext);

  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchUserId() {
      if (!connection) return;
      const res = z.string().parse(
        await connection.runRpc("lookup_user_id", {
          _auth_id: connection.auth_id,
        }),
      );
      setUserId(res);
    }
    wrapAsync(fetchUserId, setError)();
  }, [connection, setError]);

  if (connection === undefined) {
    return <dialog open>{loginForm}</dialog>;
  }

  return <div> You are in, {userId}! </div>;
}

export default App;

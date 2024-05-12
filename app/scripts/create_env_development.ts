import * as util from "node:util";
import * as child_process from "node:child_process";
import * as fs from "node:fs/promises";

const execFile = util.promisify(child_process.execFile);

async function main() {
  const { stdout } = await execFile("hostname", ["-f"]);
  const hostname = stdout.trim();

  const ENV_VARS = [
    `REACT_APP_SUPABASE_URL=http://${hostname}:54321`,
    "REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
  ];

  fs.writeFile(".env.development", ENV_VARS.join("\n"));
}

main();

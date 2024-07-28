import { useCallback, useContext, useRef, useState } from "react";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ConnectionContext } from "./connection";
import { ioDataSchema } from "./typespecs/io_types";
import { transformIoData, executeImport } from "./executeImport";
import { downloadBlob } from "./downloadBlob";

export function useImportData() {
  const connection = useContext(ConnectionContext);

  const [forbidInserts, setForbidInserts] = useState<boolean>(false);
  const [forbidUpdates, setForbidUpdates] = useState<boolean>(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileToImport = useRef<File | undefined>(undefined);

  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      fileToImport.current = e.target.files?.[0];
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      try {
        if (fileToImport.current === undefined) {
          alert("No file selected");
          return;
        }
        const fileText = await fileToImport.current.text();
        const ioData = ioDataSchema.parse(JSON.parse(fileText));
        const importData = await transformIoData({ connection, ioData });
        await executeImport({
          connection,
          importData,
          opts: {
            forbidInserts,
            forbidUpdates,
          },
        });
        alert("Import successful");
      } catch (e) {
        console.error("Failed to import data", e);
        alert(`Failed to import data:\n${e}`);
      } finally {
        dialogRef.current?.close();
      }
    },
    [connection, forbidInserts, forbidUpdates],
  );

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dialogRef.current?.close();
  }, []);

  const handleDownloadJsonSchema = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const schema = zodToJsonSchema(ioDataSchema);
    downloadBlob({
      blob: new Blob([JSON.stringify(schema, null, 2)], {
        type: "application/json",
      }),
      filename: "exercise_import_schema.json",
    });
  }, []);

  function eventSetter(setter: (x: boolean) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.checked);
  }

  const modal = (
    <dialog ref={dialogRef}>
      <label>
        Upload data:
        <input
          type="file"
          id="upload_data"
          onChange={handleFileInputChange}
          ref={fileInputRef}
        />
      </label>
      <br />
      <label>
        No new objects:
        <input
          type="checkbox"
          id="forbid_inserts"
          checked={forbidInserts}
          onChange={eventSetter(setForbidInserts)}
        />
      </label>
      <br />
      <label>
        No object updates:
        <input
          type="checkbox"
          id="forbid_updates"
          checked={forbidUpdates}
          onChange={eventSetter(setForbidUpdates)}
        />
      </label>
      <br />
      <button type="submit" onClick={handleSubmit}>
        {" "}
        Submit{" "}
      </button>
      <br />
      <button onClick={handleCancel}> Cancel </button>
      <br />
      <button onClick={handleDownloadJsonSchema}>
        {" "}
        Download Import Schema{" "}
      </button>
    </dialog>
  );

  const showModal = useCallback(() => {
    setForbidInserts(false);
    setForbidUpdates(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    dialogRef.current?.showModal();
  }, []);

  return { modal, showModal };
}

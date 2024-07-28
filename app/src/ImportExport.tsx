import { useExportData } from "./useExportData";
import { useImportData } from "./useImportData";

export function ImportExport() {
  const { modal: exportDataModal, showModal: showExportDataModal } =
    useExportData();
  const { modal: importDataModal, showModal: showImportDataModal } =
    useImportData();
  return (
    <>
      <nav>
        <ul>
          <li key="export_data">
            <button onClick={() => showExportDataModal()}>Export data</button>
          </li>
          <li key="import_data">
            <button onClick={() => showImportDataModal()}>Import data</button>
          </li>
        </ul>
      </nav>
      {exportDataModal}
      {importDataModal}
    </>
  );
}

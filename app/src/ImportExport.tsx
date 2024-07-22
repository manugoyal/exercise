import { useExportData } from "./useExportData";

export function ImportExport() {
  const { modal: exportDataModal, showModal: showExportDataModal } =
    useExportData();
  return (
    <>
      <nav>
        <ul>
          <li key="import_data">
            <button onClick={() => showExportDataModal()}>Export data</button>
          </li>
        </ul>
      </nav>
      {exportDataModal}
    </>
  );
}

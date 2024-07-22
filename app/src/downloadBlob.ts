export function downloadBlob({
  blob,
  filename,
}: {
  blob: Blob;
  filename: string;
}) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  try {
    a.click();
  } finally {
    document.body.removeChild(a);
  }
}

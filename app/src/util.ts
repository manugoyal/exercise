export function lastFinishedText(
  lastFinished: Date | null | undefined,
): string | undefined {
  if (lastFinished) {
    return `Last completed on ${lastFinished}`;
  } else {
    return undefined;
  }
}

export function createdOnText(d: Date | null | undefined): string | undefined {
  if (d) {
    return `Created on ${d.toLocaleString()}`;
  } else {
    return undefined;
  }
}

export function startedOnText(d: Date | null | undefined): string | undefined {
  if (d) {
    return `Started on ${d.toLocaleString()}`;
  } else {
    return undefined;
  }
}

export function finishedOnText(d: Date | null | undefined): string | undefined {
  if (d) {
    return `Finished on ${d.toLocaleString()}`;
  } else {
    return undefined;
  }
}

export function lastFinishedText(
  d: Date | null | undefined,
): string | undefined {
  if (d) {
    return `Last completed on ${d.toLocaleString()}`;
  } else {
    return undefined;
  }
}

export function instanceNotesText(x: string | null | undefined) {
  return x ? `Instance notes: ${x}` : undefined;
}

export function cartesianProduct<A, B>(
  a: Array<A>,
  b: Array<B>,
): Array<[A, B]> {
  return a.flatMap((a_elem) =>
    b.map((b_elem) => {
      const ret: [A, B] = [a_elem, b_elem];
      return ret;
    }),
  );
}

export function isRecoverExercise(name: string) {
  return name.toLocaleLowerCase() === "recover";
}

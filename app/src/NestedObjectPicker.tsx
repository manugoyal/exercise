import { useState } from "react";

export type NestedObject = (
  | {
      kind: "node";
      children: NestedObject[];
    }
  | {
      kind: "leaf";
      action?: () => void;
    }
) & {
  text: string;
  subtext?: string;
  highlight?: boolean;
  expandIfHighlighted?: boolean;
};

function makePathKey(path: number[]) {
  return path.map((x) => `${x}`).join(",");
}

function displayNestedObject({
  nestedObject,
  currentPath,
  expandedPaths,
  setExpandedPaths,
}: {
  nestedObject: NestedObject;
  currentPath: number[];
  expandedPaths: Map<string, boolean>;
  setExpandedPaths: React.Dispatch<React.SetStateAction<Map<string, boolean>>>;
}) {
  const currentPathKey = makePathKey(currentPath);
  const isExpanded = expandedPaths.get(currentPathKey) ?? false;
  const onClick =
    nestedObject.kind === "node"
      ? nestedObject.children.length > 0
        ? () => {
            const isExpanded = expandedPaths.get(currentPathKey) ?? false;
            setExpandedPaths((x) => {
              const newX = new Map(x);
              newX.set(currentPathKey, !isExpanded);
              return newX;
            });
          }
        : undefined
      : nestedObject.action;
  const buttonText =
    nestedObject.kind === "node" ? (isExpanded ? "Close" : "Open") : "Select";
  const subComponents =
    nestedObject.kind === "node" &&
    (isExpanded ||
      (nestedObject.highlight && nestedObject.expandIfHighlighted)) ? (
      <ul>
        {nestedObject.children.map((child, idx) => (
          <li key={`${idx}`}>
            {displayNestedObject({
              nestedObject: child,
              currentPath: currentPath.concat([idx]),
              expandedPaths,
              setExpandedPaths,
            })}
          </li>
        ))}
      </ul>
    ) : null;
  const elemStyle = {
    ...(nestedObject.highlight ? { color: "blue" } : {}),
  };
  return (
    <div>
      <p style={elemStyle}>
        {nestedObject.text}{" "}
        {onClick && <button onClick={onClick}> {buttonText} </button>}
      </p>
      {nestedObject.subtext ? <small>{nestedObject.subtext}</small> : null}
      {subComponents}
    </div>
  );
}

export function NestedObjectPicker({
  nestedObject,
}: {
  nestedObject: NestedObject;
}) {
  const [expandedPaths, setExpandedPaths] = useState(
    new Map<string, boolean>([[makePathKey([0]), true]]),
  );
  return displayNestedObject({
    nestedObject,
    currentPath: [0],
    expandedPaths,
    setExpandedPaths,
  });
}

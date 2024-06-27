import { Handle, type NodeProps, Position } from "reactflow";
import { BaseNodeData } from "./types";

export function BaseNode({ data }: NodeProps<BaseNodeData>) {
  return (
    <div
      className="base-node"
      style={{
        ["--max-props-count" as string]: Math.max(
          data.inputs?.length ?? 0,
          data.outputs?.length ?? 0
        ),
      }}
    >
      <label>{data.label}</label>
      <ul>
        {data.inputs?.map((input, idx) => (
          <li className="prop input" key={`i-${idx}`}>
            <Handle
              type="target"
              position={Position.Left}
              id={`i-${idx}`}
              data-label={input}
            >
              <label>{data.inputLabels?.[idx] ?? input}</label>
            </Handle>
          </li>
        ))}
      </ul>
      <ul>
        {data.outputs?.map((output, idx) => (
          <li className="prop output" key={`i-${idx}`}>
            <Handle
              type="source"
              position={Position.Right}
              id={`o-${idx}`}
              data-label={output}
            >
              <label>{output}</label>
            </Handle>
          </li>
        ))}
      </ul>
    </div>
  );
}

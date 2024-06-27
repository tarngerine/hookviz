import { BaseEdge as RFBaseEdge, EdgeProps, getBezierPath } from "reactflow";

export function BaseEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY } = props;
  const [path] = getBezierPath(props);
  return (
    <>
      <RFBaseEdge path={path} />
      <circle className="edge-cap start" r={3} cx={sourceX} cy={sourceY} />
      <circle className="edge-cap end" r={3} cx={targetX} cy={targetY} />
    </>
  );
}

import { useEffect, useState } from "react";
import Dagre from "dagre";
import ReactFlow, {
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import type { Node, Edge } from "reactflow";

import { BaseNode } from "./Nodes";
import { BaseNodeData } from "./types";
import { BaseEdge } from "./Edges";

function App() {
  const [graph, setGraph] = useState<ParsedResult | null>(null);
  const { fitView } = useReactFlow();
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log("handleMessage", event, event.data);
      if (message.type === "update") {
        setGraph(message.graph);
        const graphWithoutLayout = processParsedResult(message.graph);
        const [nodes, edges] = layout(...graphWithoutLayout);
        setNodes(nodes);
        setEdges(edges);
        fitView();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <div>
      <h1>framer-motion hook visualizer</h1>
      <pre>{graph && JSON.stringify(graph, null, 2)}</pre>
      <pre>{nodes && JSON.stringify(nodes, null, 2)}</pre>
      <pre>{edges && JSON.stringify(edges, null, 2)}</pre>
      <div
        style={{
          position: "fixed",
          inset: "0",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={customNodeTypes}
          edgeTypes={customEdgeTypes}
          fitView
        />
      </div>
    </div>
  );
}

const customNodeTypes = {
  useMotionValue: BaseNode,
  useTransform: BaseNode,
  component: BaseNode,
};
const customEdgeTypes = {
  default: BaseEdge,
};

export default App;

function processParsedResult(result: ParsedResult): [Node[], Edge[]] {
  const nodes: Node<BaseNodeData>[] = [];
  const edges: Edge[] = [];
  let id = 0;

  result.hooks.forEach((hook) => {
    nodes.push({
      id: String(id++),
      position: { x: 0, y: 0 },
      type: hook.type,
      data: {
        label: hook.type,
        outputs: hook.outputs,
        inputs: hook.inputs,
      },
    });
  });
  result.components.forEach((component) => {
    nodes.push({
      id: String(id++),
      position: { x: 0, y: 0 },
      type: "component",
      data: {
        label: component.type,
        inputs: Object.values(component.props),
        inputLabels: Object.keys(component.props),
      },
    });
  });

  nodes.forEach((node) => {
    node.data.outputs?.forEach((output) => {
      nodes.find((otherNode) => {
        if (otherNode.data.inputs?.includes(output)) {
          edges.push({
            id: `e${node.id}-${otherNode.id}`,
            source: node.id,
            target: otherNode.id,
            sourceHandle: `o-${node.data.outputs?.indexOf(output)}`,
            targetHandle: `i-${otherNode.data.inputs?.indexOf(output)}`,
          });
        }
      });
    });
  });

  return [nodes, edges] as const;
}

interface MotionHook {
  type: "useMotionValue" | "useTransform";
  outputs: string[];
  inputs: string[];
}

interface MotionComponent {
  name: string;
  type: "motion" | "styled-motion";
  props: Record<string, string>;
}

interface ParsedResult {
  hooks: MotionHook[];
  components: MotionComponent[];
}

function layout(nodes: Node[], edges: Edge[]): [Node[], Edge[]] {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  g.setGraph({ rankdir: "LR", ranksep: 200, nodesep: 50, edgesep: 100 });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) => g.setNode(node.id, node));

  Dagre.layout(g);

  return [
    nodes.map((node) => {
      const { x, y } = g.node(node.id);

      return { ...node, position: { x, y } };
    }),
    edges,
  ] as const;
}

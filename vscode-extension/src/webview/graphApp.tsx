import { useEffect, useMemo, useState, type JSX } from "react";
import { createRoot } from "react-dom/client";
import dagre from "@dagrejs/dagre";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./graphStyles.css";

import type { DependencyGraph, DependencyGraphNode } from "../types/analyzer";
import { getVisibleGraph, typeHasMembers } from "./graphModel";

interface VsCodeApi {
  postMessage(message: WebviewMessage): void;
}

interface GraphDataMessage {
  readonly type: "graph";
  readonly graph: DependencyGraph;
}

interface OpenSourceMessage {
  readonly type: "openSource";
  readonly nodeId: string;
}

type WebviewMessage = GraphDataMessage | OpenSourceMessage;

interface GraphNodeData extends Record<string, unknown> {
  readonly graphNode: DependencyGraphNode;
  readonly expandable: boolean;
  readonly expanded: boolean;
  readonly onToggle: (nodeId: string) => void;
}

type AegisFlowNode = Node<GraphNodeData, "aegis">;

declare function acquireVsCodeApi(): VsCodeApi;

declare global {
  interface Window {
    __AEGIS_GRAPH__?: DependencyGraph;
  }
}

const vscode = acquireVsCodeApi();

function GraphNodeCard({ data, selected }: NodeProps<AegisFlowNode>): JSX.Element {
  const { graphNode } = data;
  const className = `graph-node graph-node--${nodeTone(graphNode)}${selected ? " graph-node--selected" : ""}`;

  return (
    <div className={className} title={graphNode.qualifiedName}>
      <Handle type="target" position={Position.Left} />
      <div className="graph-node__content">
        <span className="graph-node__kind">{graphNode.kind}</span>
        <span className="graph-node__label">{graphNode.label}</span>
      </div>
      {data.expandable && (
        <button
          className="graph-node__toggle"
          type="button"
          title={data.expanded ? `Collapse ${graphNode.label}` : `Expand ${graphNode.label}`}
          aria-label={data.expanded ? `Collapse ${graphNode.label}` : `Expand ${graphNode.label}`}
          onClick={(event) => {
            event.stopPropagation();
            data.onToggle(graphNode.id);
          }}
        >
          {data.expanded ? "−" : "+"}
        </button>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { aegis: GraphNodeCard };

function GraphCanvas({ graph }: { readonly graph: DependencyGraph }): JSX.Element {
  const [expandedTypeIds, setExpandedTypeIds] = useState<ReadonlySet<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [query, setQuery] = useState("");
  const [nodeKindFilter, setNodeKindFilter] = useState("ALL");
  const { fitView } = useReactFlow();

  useEffect(() => {
    setExpandedTypeIds(new Set());
    setSelectedNodeId(undefined);
    setQuery("");
    setNodeKindFilter("ALL");
  }, [graph]);

  const toggleType = (nodeId: string): void => {
    setExpandedTypeIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const visibleGraph = useMemo(
    () => getVisibleGraph(graph, expandedTypeIds, nodeKindFilter),
    [expandedTypeIds, graph, nodeKindFilter]
  );
  const flow = useMemo(
    () => layoutGraph(graph, visibleGraph.nodes, visibleGraph.edges, expandedTypeIds, selectedNodeId, toggleType),
    [expandedTypeIds, graph, selectedNodeId, visibleGraph.edges, visibleGraph.nodes]
  );
  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId);

  useEffect(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.length === 0) {
      return;
    }

    const match = flow.nodes.find((node) => matchesQuery(node.data.graphNode, normalizedQuery));
    if (match) {
      setSelectedNodeId(match.id);
      requestAnimationFrame(() => {
        void fitView({ nodes: [{ id: match.id }], duration: 250, padding: 0.8 });
      });
    }
  }, [fitView, flow.nodes, query]);

  return (
    <div className="graph-app">
      <header className="graph-toolbar">
        <div className="graph-toolbar__title">Dependency Graph</div>
        <label className="graph-toolbar__search">
          <span>Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or qualified name"
          />
        </label>
        <label className="graph-toolbar__filter">
          <span>Nodes</span>
          <select value={nodeKindFilter} onChange={(event) => setNodeKindFilter(event.target.value)}>
            <option value="ALL">All</option>
            <option value="PACKAGE">Packages</option>
            <option value="TYPE">Types</option>
            <option value="METHOD">Methods</option>
            <option value="FIELD">Fields</option>
            <option value="EXTERNAL_TYPE">External types</option>
            <option value="ANNOTATION">Annotations</option>
          </select>
        </label>
        <div className="graph-toolbar__count">{visibleGraph.nodes.length} nodes · {visibleGraph.edges.length} edges</div>
      </header>
      <main className="graph-workspace">
        <section className="graph-canvas" aria-label="Dependency graph">
          <ReactFlow
            nodes={flow.nodes}
            edges={flow.edges}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(undefined)}
            fitView
            minZoom={0.2}
            maxZoom={2.5}
          >
            <Background color="#364152" gap={18} size={1} />
            <MiniMap nodeColor={(node) => nodeColor(node.data as GraphNodeData)} maskColor="rgba(15, 23, 42, 0.62)" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </section>
        <aside className="graph-inspector" aria-label="Selected node details">
          {selectedNode ? (
            <>
              <div className={`graph-inspector__kind graph-inspector__kind--${nodeTone(selectedNode)}`}>{selectedNode.kind}</div>
              <h1>{selectedNode.label}</h1>
              <dl>
                <div><dt>Qualified name</dt><dd>{selectedNode.qualifiedName}</dd></div>
                <div><dt>Package</dt><dd>{selectedNode.packageName || "(default)"}</dd></div>
                <div><dt>Source</dt><dd>{selectedNode.sourcePath || "External"}</dd></div>
                {Object.entries(selectedNode.metadata).map(([key, value]) => (
                  <div key={key}><dt>{key}</dt><dd>{value || "—"}</dd></div>
                ))}
              </dl>
              {selectedNode.sourcePath && (
                <button
                  className="graph-inspector__open"
                  type="button"
                  onClick={() => vscode.postMessage({ type: "openSource", nodeId: selectedNode.id })}
                >
                  Open Source
                </button>
              )}
            </>
          ) : (
            <div className="graph-inspector__empty">Select a node to inspect its dependency details.</div>
          )}
        </aside>
      </main>
    </div>
  );
}

function App(): JSX.Element {
  const [graph, setGraph] = useState<DependencyGraph | undefined>(window.__AEGIS_GRAPH__);

  useEffect(() => {
    const receiveMessage = (event: MessageEvent<WebviewMessage>): void => {
      if (event.data.type === "graph") {
        setGraph(event.data.graph);
      }
    };
    window.addEventListener("message", receiveMessage);
    return () => window.removeEventListener("message", receiveMessage);
  }, []);

  if (!graph) {
    return <div className="graph-loading">Loading dependency graph…</div>;
  }

  return <ReactFlowProvider><GraphCanvas graph={graph} /></ReactFlowProvider>;
}

function layoutGraph(
  graph: DependencyGraph,
  nodes: readonly DependencyGraphNode[],
  edges: readonly { readonly id: string; readonly sourceId: string; readonly targetId: string; readonly label: string }[],
  expandedTypeIds: ReadonlySet<string>,
  selectedNodeId: string | undefined,
  onToggle: (nodeId: string) => void
): { readonly nodes: AegisFlowNode[]; readonly edges: Edge[] } {
  const width = 208;
  const height = 58;
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "LR", nodesep: 32, ranksep: 88, marginx: 28, marginy: 28 });

  for (const node of nodes) {
    dagreGraph.setNode(node.id, { width, height });
  }
  for (const edge of edges) {
    dagreGraph.setEdge(edge.sourceId, edge.targetId);
  }
  dagre.layout(dagreGraph);

  const flowNodes: AegisFlowNode[] = nodes.map((graphNode) => {
    const position = dagreGraph.node(graphNode.id) as { readonly x: number; readonly y: number };
    return {
      id: graphNode.id,
      type: "aegis",
      position: { x: position.x - width / 2, y: position.y - height / 2 },
      selected: graphNode.id === selectedNodeId,
      data: {
        graphNode,
        expandable: graphNode.kind === "TYPE" && typeHasMembers(graph, graphNode.id),
        expanded: expandedTypeIds.has(graphNode.id),
        onToggle
      }
    };
  });
  const flowEdges: Edge[] = edges.map((edge) => {
    const connected = edge.sourceId === selectedNodeId || edge.targetId === selectedNodeId;
    return {
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      label: edge.label,
      animated: connected,
      style: { stroke: connected ? "#eab308" : "#64748b", strokeWidth: connected ? 2 : 1 },
      labelStyle: { fill: "#cbd5e1", fontSize: 10 }
    };
  });

  return { nodes: flowNodes, edges: flowEdges };
}

function matchesQuery(node: DependencyGraphNode, query: string): boolean {
  return node.label.toLowerCase().includes(query)
    || node.qualifiedName.toLowerCase().includes(query)
    || node.packageName.toLowerCase().includes(query);
}

function nodeTone(node: DependencyGraphNode): string {
  const annotations = node.metadata.annotations ?? "";
  if (annotations.includes("Controller") || annotations.includes("Mapping")) {
    return "api";
  }
  if (annotations.includes("Service")) {
    return "service";
  }
  if (annotations.includes("Repository")) {
    return "repository";
  }

  return node.kind.toLowerCase().replace("_", "-");
}

function nodeColor(data: GraphNodeData): string {
  const tone = nodeTone(data.graphNode);
  return {
    api: "#ef6b5b",
    service: "#4abf88",
    repository: "#e3a447",
    package: "#6395d8",
    method: "#70b6d9",
    field: "#d9876b",
    "external-type": "#858fb0",
    annotation: "#bd78be",
    type: "#5f9edc"
  }[tone] ?? "#5f9edc";
}

createRoot(document.getElementById("root")!).render(<App />);

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {TreeNode} from '../types';
import {ZoomIn, ZoomOut, RotateCcw} from 'lucide-react';

interface DecisionTreeViewerProps {
  rootNode: TreeNode;
  highlightedPath?: number[]; // node ids to highlight in yellow
  selectedNodeId?: number | null;
  onSelectNode?: (node: TreeNode) => void;
}

interface LayoutNode {
  node: TreeNode;
  x: number;
  y: number;
  width: number;
  height: number;
  children: LayoutNode[];
}

export const DecisionTreeViewer: React.FC<DecisionTreeViewerProps> = ({
  rootNode,
  highlightedPath = [],
  selectedNodeId = null,
  onSelectNode
}) => {
  const [zoom, setZoom] = useState(.65);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeNode, setActiveNode] = useState<TreeNode | null>(rootNode);

  // Layout calculation using clean tidy hierarchical positioning
  const { layoutTree, totalWidth, totalHeight } = useMemo(() => {
    const nodeWidth = 220;
    const nodeHeight = 110;
    const horizontalGap = 35;
    const verticalGap = 90;

    let leafCounter = 0;

    function assignPositions(node: TreeNode, depth: number): LayoutNode {
      if (!node.children || node.children.length === 0) {
        const x = leafCounter * (nodeWidth + horizontalGap);
        leafCounter++;
        return {
          node,
          x,
          y: depth * (nodeHeight + verticalGap),
          width: nodeWidth,
          height: nodeHeight,
          children: []
        };
      }

      const layoutChildren = node.children.map(c => assignPositions(c, depth + 1));
      const firstChildX = layoutChildren[0].x;
      const lastChildX = layoutChildren[layoutChildren.length - 1].x;
      const x = (firstChildX + lastChildX) / 2;

      return {
        node,
        x,
        y: depth * (nodeHeight + verticalGap),
        width: nodeWidth,
        height: nodeHeight,
        children: layoutChildren
      };
    }

    leafCounter = 0;
    const layout = assignPositions(rootNode, 0);
    const calculatedWidth = Math.max(1000, leafCounter * (nodeWidth + horizontalGap) + 150);
    const maximumDepth = (node: TreeNode): number => Math.max(node.depth, ...(node.children || []).map(maximumDepth));
    const calculatedHeight = (maximumDepth(rootNode) + 1) * (nodeHeight + verticalGap) + 70;

    return {
      layoutTree: layout,
      totalWidth: calculatedWidth,
      totalHeight: calculatedHeight
    };
  }, [rootNode]);

  // Handle Pan and Zoom
  const handleMouseDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || !e.isPrimary) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    const width = canvasRef.current?.clientWidth || 600;
    const height = canvasRef.current?.clientHeight || 600;
    const scale = Math.min(1, (width - 30) / totalWidth, (height - 30) / totalHeight);
    setZoom(scale); setPan({x: 15, y: 15});
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width;
      setPan({x: width / 2 - (layoutTree.x + 110) * .65, y: 30});
    });
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [layoutTree.x]);

  // Flatten layout to draw edges and nodes
  const { nodesList, edgesList } = useMemo(() => {
    const nodes: LayoutNode[] = [];
    const edges: Array<{ from: LayoutNode; to: LayoutNode; label: string; isHighlighted: boolean }> = [];

    function traverse(current: LayoutNode) {
      nodes.push(current);
      current.children.forEach((child, index) => {
        const isBranchHighlighted =
          highlightedPath.includes(current.node.id) && highlightedPath.includes(child.node.id);
        const branchLabel = index === 0 ? 'True (<=)' : 'False (>)';
        edges.push({
          from: current,
          to: child,
          label: branchLabel,
          isHighlighted: isBranchHighlighted
        });
        traverse(child);
      });
    }

    traverse(layoutTree);
    return { nodesList: nodes, edgesList: edges };
  }, [layoutTree, highlightedPath]);

  const handleNodeClick = (n: TreeNode) => {
    setActiveNode(n);
    if (onSelectNode) onSelectNode(n);
  };

  return (
    <div className="relative border border-appBorder rounded-lg bg-softIvory overflow-hidden select-none h-[720px] flex flex-col">
      {/* Top Toolbar */}
      <div className="min-h-14 flex-wrap gap-3 p-3 border-b border-appBorder bg-warmWhite flex items-center justify-between z-10">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accentYellow"></span>
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-nearBlack">
              Interactive Decision Tree
            </span>
          </div>
          <span className="text-xs text-mutedText border-l border-appBorder pl-4">
            {rootNode.impurity_type} Criterion | Depth: {Math.max(...nodesList.map(item => item.node.depth))} | Nodes: {nodesList.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center bg-softIvory border border-appBorder rounded-md p-1 mr-2 text-xs">
            <span className="flex items-center gap-1.5 px-2 py-0.5 font-medium text-nearBlack">
              <span className="w-2.5 h-2.5 rounded bg-accentYellow border border-nearBlack"></span>
              Selected / Active
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 font-medium text-accentRed">
              <span className="w-2.5 h-2.5 rounded bg-accentRed"></span>
              Churn majority
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 font-medium text-emerald-700">
              <span className="w-2.5 h-2.5 rounded bg-emerald-600"></span>
              Retained
            </span>
          </div>

          <button
            onClick={() => setZoom(z => Math.min(1.8, z + 0.15))}
            className="p-1.5 rounded hover:bg-softIvory border border-appBorder text-nearBlack transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(0.04, z - 0.10))}
            className="p-1.5 rounded hover:bg-softIvory border border-appBorder text-nearBlack transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded hover:bg-softIvory border border-appBorder text-nearBlack transition-colors"
            title="Fit whole tree"
            aria-label="Fit whole tree"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        className="flex-1 cursor-grab active:cursor-grabbing overflow-hidden relative"
        ref={canvasRef}
        style={{touchAction: 'none'}}
        onPointerDown={handleMouseDown}
        onPointerMove={handleMouseMove}
        onPointerUp={handleMouseUp}
        onPointerCancel={handleMouseUp}
        onLostPointerCapture={handleMouseUp}
      >
        <svg
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          width={totalWidth}
          height={totalHeight}
        >
          {/* Edges */}
          {edgesList.map((edge, idx) => {
            const startX = edge.from.x + edge.from.width / 2;
            const startY = edge.from.y + edge.from.height;
            const endX = edge.to.x + edge.to.width / 2;
            const endY = edge.to.y;
            const midY = (startY + endY) / 2;

            const pathD = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

            return (
              <g key={`edge-${idx}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={edge.isHighlighted ? '#FFD43B' : '#D1CEBF'}
                  strokeWidth={edge.isHighlighted ? 4 : 1.75}
                  strokeLinecap="round"
                />
                <rect
                  x={(startX + endX) / 2 - 28}
                  y={midY - 10}
                  width={56}
                  height={18}
                  rx={3}
                  fill="#FFFFFF"
                  stroke="#EAE7DF"
                  strokeWidth={1}
                />
                <text
                  x={(startX + endX) / 2}
                  y={midY + 3}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-nearBlack font-medium pointer-events-none"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodesList.map(n => {
            const isSelected = selectedNodeId === n.node.id || activeNode?.id === n.node.id;
            const isHighlighted = highlightedPath.includes(n.node.id);
            const isChurnDominated = n.node.churn_prob > 0.5;

            let borderStroke = '#EAE7DF';
            let strokeWidth = 1.5;
            let headerBg = '#F6F4EB';

            if (isSelected) {
              borderStroke = '#171717';
              strokeWidth = 2.5;
              headerBg = '#FFD43B';
            } else if (isHighlighted) {
              borderStroke = '#FFD43B';
              strokeWidth = 2.5;
            } else if (n.node.is_leaf) {
              if (isChurnDominated) {
                borderStroke = '#EF4444';
                headerBg = '#FEE2E2';
              } else {
                borderStroke = '#10B981';
                headerBg = '#D1FAE5';
              }
            }

            return (
              <g
                key={`node-${n.node.id}`}
                transform={`translate(${n.x}, ${n.y})`}
                role="button"
                tabIndex={0}
                aria-label={`Node ${n.node.id}: ${n.node.name}, churn probability ${(n.node.churn_prob * 100).toFixed(1)} percent`}
                onPointerDown={event => event.stopPropagation()}
                onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); handleNodeClick(n.node);} }}
                onClick={() => handleNodeClick(n.node)}
                className="cursor-pointer group"
              >
                {/* Node Box */}
                <rect
                  width={n.width}
                  height={n.height}
                  rx={6}
                  fill="#FFFFFF"
                  stroke={borderStroke}
                  strokeWidth={strokeWidth}
                  className="filter drop-shadow-sm transition-all group-hover:drop-shadow-md"
                />

                {/* Node Header */}
                <path
                  d={`M 0 6 A 6 6 0 0 1 6 0 L ${n.width - 6} 0 A 6 6 0 0 1 ${n.width} 6 L ${n.width} 28 L 0 28 Z`}
                  fill={headerBg}
                />

                {/* Node Header Text */}
                <text
                  x={12}
                  y={18}
                  className="text-xs font-mono font-bold fill-nearBlack select-none"
                >
                  {n.node.is_leaf ? `LEAF #${n.node.id}` : `NODE #${n.node.id}`}
                </text>

                <text
                  x={n.width - 12}
                  y={18}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-mutedText select-none"
                >
                  {n.node.samples} spl ({n.node.samples_pct}%)
                </text>

                {/* Feature or Split Condition */}
                <text
                  x={12}
                  y={48}
                  className="text-[12px] font-semibold fill-nearBlack truncate select-none"
                >
                  {n.node.is_leaf
                    ? n.node.predicted_class === 'Churn' ? 'Pred: CHURN' : 'Pred: RETAINED'
                    : n.node.name.length > 24 ? n.node.name.substring(0, 22) + '...' : n.node.name}
                </text>

                {/* Threshold or terminal details */}
                <text
                  x={12}
                  y={66}
                  className="text-[11px] font-mono fill-mutedText select-none"
                >
                  {n.node.is_leaf
                    ? `Churn Rate: ${(n.node.churn_prob * 100).toFixed(1)}%`
                    : `Threshold: ${n.node.threshold}`}
                </text>

                {/* Impurity Bar and stats */}
                <g transform="translate(12, 78)">
                  <rect width={n.width - 24} height={14} rx={3} fill="#F0EFE9" />
                  <rect
                    width={(n.width - 24) * n.node.churn_prob}
                    height={14}
                    rx={3}
                    fill={n.node.churn_prob > 0.5 ? '#EF4444' : '#FFD43B'}
                  />
                  <text
                    x={(n.width - 24) / 2}
                    y={10.5}
                    textAnchor="middle"
                    className="text-[9px] font-mono font-bold fill-nearBlack select-none"
                  >
                    Retained: {n.node.retained_count} | Churn: {n.node.churn_count}
                  </text>
                </g>

                {/* Depth and Impurity footer */}
                <text
                  x={12}
                  y={102}
                  className="text-[9px] font-mono fill-mutedText select-none"
                >
                  {n.node.impurity_type}: {n.node.impurity}
                </text>
                <text
                  x={n.width - 12}
                  y={102}
                  textAnchor="end"
                  className="text-[9px] font-mono fill-mutedText select-none"
                >
                  D: {n.node.depth}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Node Floating Details Panel */}
        {activeNode && (
          <div className="absolute bottom-4 right-4 w-84 bg-warmWhite/95 backdrop-blur-sm border border-appBorder rounded-lg p-5 shadow-lg text-nearBlack z-20">
            <div className="flex items-start justify-between mb-3 border-b border-appBorder pb-2">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-mutedText">
                  {activeNode.is_leaf ? 'Leaf Node Details' : 'Decision Node Details'}
                </span>
                <h4 className="text-sm font-bold text-nearBlack">
                  {activeNode.is_leaf ? `Node #${activeNode.id} (${activeNode.predicted_class})` : activeNode.name}
                </h4>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                  activeNode.predicted_class === 'Churn'
                    ? 'bg-accentRed/10 text-accentRed border border-accentRed/30'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {activeNode.predicted_class}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-appBorder/50">
                <span className="text-mutedText">Branch Evaluation:</span>
                <span className="font-mono font-medium text-right max-w-[180px] truncate" title={activeNode.branch_rule}>
                  {activeNode.branch_rule}
                </span>
              </div>

              {!activeNode.is_leaf && (
                <>
                  <div className="flex justify-between py-1 border-b border-appBorder/50">
                    <span className="text-mutedText">True Branch (Left):</span>
                    <span className="font-mono font-medium text-emerald-800 truncate max-w-[180px]" title={activeNode.left_rule}>
                      {activeNode.left_rule}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-appBorder/50">
                    <span className="text-mutedText">False Branch (Right):</span>
                    <span className="font-mono font-medium text-accentRed truncate max-w-[180px]" title={activeNode.right_rule}>
                      {activeNode.right_rule}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between py-1 border-b border-appBorder/50">
                <span className="text-mutedText">Samples Reaching Node:</span>
                <span className="font-mono font-bold text-nearBlack">
                  {activeNode.samples} ({activeNode.samples_pct}% of training data)
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-appBorder/50">
                <span className="text-mutedText">Cohort Churn Rate:</span>
                <span className="font-mono font-bold text-nearBlack">
                  {(activeNode.churn_prob * 100).toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-appBorder/50">
                <span className="text-mutedText">{activeNode.impurity_type} Impurity:</span>
                <span className="font-mono font-bold text-nearBlack">
                  {activeNode.impurity}
                </span>
              </div>

              <div className="flex justify-between pt-1">
                <span className="text-mutedText">Node Depth:</span>
                <span className="font-mono text-nearBlack">{activeNode.depth}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

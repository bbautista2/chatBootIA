"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Save, ArrowLeft, Loader2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { MessageNode } from "@/components/flow-builder/nodes"
import { ButtonsNode } from "@/components/flow-builder/nodes"
import { ConditionNode } from "@/components/flow-builder/nodes"
import { HandoffNode } from "@/components/flow-builder/nodes"
import { NodePalette } from "@/components/flow-builder/node-palette"
import { NodeEditor } from "@/components/flow-builder/node-editor"
import api from "@/lib/api"
import toast from "react-hot-toast"

const nodeTypes = {
  message: MessageNode,
  buttons: ButtonsNode,
  condition: ConditionNode,
  handoff: HandoffNode,
}

let nodeId = 0
const getNodeId = () => `node_${++nodeId}`

export default function FlowBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const accountId = params.id as string
  const flowId = params.flowId as string

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [flowName, setFlowName] = useState("")

  useEffect(() => {
    const loadFlow = async () => {
      try {
        const res = await api.get(`/accounts/${accountId}/flows/${flowId}`)
        const flow = res.data
        setFlowName(flow.name)

        if (flow.steps && flow.steps.length > 0) {
          const flowNodes: Node[] = flow.steps.map(
            (step: { id: string; type: string; content: string; position: { x: number; y: number }; config?: Record<string, unknown> }) => ({
              id: step.id,
              type: step.type,
              position: step.position || { x: 0, y: 0 },
              data: {
                label: step.content,
                ...step.config,
              },
            })
          )
          const flowEdges: Edge[] = []
          flow.steps.forEach(
            (step: { id: string; connections?: { targetStepId: string; label?: string; sourceHandle?: string }[] }) => {
              if (step.connections) {
                step.connections.forEach(
                  (conn: { targetStepId: string; label?: string; sourceHandle?: string }) => {
                    flowEdges.push({
                      id: `e_${step.id}_${conn.targetStepId}`,
                      source: step.id,
                      target: conn.targetStepId,
                      sourceHandle: conn.sourceHandle,
                      label: conn.label,
                    })
                  }
                )
              }
            }
          )
          setNodes(flowNodes)
          setEdges(flowEdges)
          nodeId = flow.steps.length
        }
      } catch {
        toast.error("Failed to load flow")
      } finally {
        setLoading(false)
      }
    }
    loadFlow()
  }, [accountId, flowId, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds))
    },
    [setEdges]
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const addNode = useCallback(
    (type: string) => {
      const newNode: Node = {
        id: getNodeId(),
        type,
        position: { x: 250, y: 250 },
        data: {
          label: type === "message" ? "New Message" : type === "buttons" ? "Choose Option" : type === "condition" ? "Condition?" : "Handoff to Human",
          ...(type === "buttons"
            ? { buttons: ["Button 1", "Button 2"] }
            : {}),
          ...(type === "condition"
            ? { condition: "default", trueLabel: "Yes", falseLabel: "No" }
            : {}),
        },
      }
      setNodes((nds) => [...nds, newNode])
    },
    [setNodes]
  )

  const updateNodeData = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n))
      )
      setSelectedNode((prev) =>
        prev && prev.id === nodeId
          ? { ...prev, data: { ...prev.data, ...data } }
          : prev
      )
    },
    [setNodes]
  )

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId))
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
      )
      setSelectedNode(null)
    },
    [setNodes, setEdges]
  )

  const saveFlow = async () => {
    setSaving(true)
    try {
      const steps = nodes.map((node) => ({
        id: node.id,
        type: node.type,
        content: node.data.label || "",
        position: node.position,
        config: {
          ...node.data,
          label: undefined,
        },
      }))

      const connections = edges.map((edge) => ({
        sourceStepId: edge.source,
        targetStepId: edge.target,
        label: edge.label || undefined,
        sourceHandle: edge.sourceHandle || undefined,
      }))

      await api.put(`/accounts/${accountId}/flows/${flowId}`, {
        steps,
        connections,
      })
      toast.success("Flow saved successfully")
    } catch {
      toast.error("Failed to save flow")
    } finally {
      setSaving(false)
    }
  }

  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 1 }), [])

  if (loading) {
    return (
      <AppLayout
        title="Flow Builder"
        breadcrumbs={[
          { label: "Accounts", href: "/accounts" },
          { label: "Flows", href: `/accounts/${accountId}/flows` },
          { label: "Builder" },
        ]}
      >
        <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      title={`Flow: ${flowName}`}
      breadcrumbs={[
        { label: "Accounts", href: "/accounts" },
        { label: "Flows", href: `/accounts/${accountId}/flows` },
        { label: flowName },
      ]}
    >
      <div className="flex h-[calc(100vh-10rem)] gap-4">
        <NodePalette onAddNode={addNode} />

        <div className="flex-1 rounded-lg border bg-background">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/accounts/${accountId}/flows`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={saveFlow} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Flow
            </Button>
          </div>
          <div className="h-[calc(100%-49px)]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              defaultViewport={defaultViewport}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
            >
              <Controls />
              <MiniMap />
              <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
            </ReactFlow>
          </div>
        </div>

        {selectedNode && (
          <NodeEditor
            node={selectedNode}
            onUpdate={(data) => updateNodeData(selectedNode.id, data)}
            onDelete={() => deleteNode(selectedNode.id)}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </AppLayout>
  )
}

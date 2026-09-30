"use client"

import { AppLayout } from "@/components/layout/app-layout"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import api from "@/lib/api"
import toast from "react-hot-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import type { Flow } from "@/types"

export default function FlowsPage() {
  const router = useRouter()
  const params = useParams()
  const accountId = params.id as string

  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newFlowName, setNewFlowName] = useState("")
  const [creating, setCreating] = useState(false)

  const fetchFlows = async () => {
    try {
      const res = await api.get(`/accounts/${accountId}/flows`)
      setFlows(res.data.flows || res.data)
    } catch {
      toast.error("Failed to load flows")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlows()
  }, [accountId])

  const createFlow = async () => {
    if (!newFlowName.trim()) return
    setCreating(true)
    try {
      const res = await api.post(`/accounts/${accountId}/flows`, {
        name: newFlowName,
      })
      toast.success("Flow created")
      setCreateDialogOpen(false)
      setNewFlowName("")
      router.push(`/accounts/${accountId}/flows/${res.data.id}`)
    } catch {
      toast.error("Failed to create flow")
    } finally {
      setCreating(false)
    }
  }

  const toggleFlow = async (flow: Flow) => {
    try {
      await api.patch(`/accounts/${accountId}/flows/${flow.id}`, {
        isActive: !flow.isActive,
      })
      toast.success(`Flow ${flow.isActive ? "deactivated" : "activated"}`)
      fetchFlows()
    } catch {
      toast.error("Failed to update flow")
    }
  }

  const deleteFlow = async (flowId: string) => {
    if (!confirm("Are you sure you want to delete this flow?")) return
    try {
      await api.delete(`/accounts/${accountId}/flows/${flowId}`)
      toast.success("Flow deleted")
      fetchFlows()
    } catch {
      toast.error("Failed to delete flow")
    }
  }

  return (
    <AppLayout
      title="Flows"
      breadcrumbs={[
        { label: "Accounts", href: "/accounts" },
        { label: "Flows" },
      ]}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/accounts")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h2 className="text-lg font-semibold">Conversation Flows</h2>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New Flow
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Flow</DialogTitle>
                <DialogDescription>
                  Give your flow a name to get started.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="flowName">Flow Name</Label>
                  <Input
                    id="flowName"
                    placeholder="e.g., Welcome Flow, Product Info"
                    value={newFlowName}
                    onChange={(e) => setNewFlowName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={createFlow} disabled={creating || !newFlowName.trim()}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : flows.length === 0 ? (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">
              No flows created yet. Click &quot;Create New Flow&quot; to start building conversation flows.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Triggers</TableHead>
                  <TableHead>Steps</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flows.map((flow) => (
                  <TableRow key={flow.id}>
                    <TableCell className="font-medium">{flow.name}</TableCell>
                    <TableCell>{flow.priority}</TableCell>
                    <TableCell>
                      <Badge variant={flow.isActive ? "default" : "secondary"}>
                        {flow.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{flow._count?.triggers || 0}</TableCell>
                    <TableCell>{flow._count?.steps || 0}</TableCell>
                    <TableCell>
                      {format(new Date(flow.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/accounts/${accountId}/flows/${flow.id}`
                            )
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFlow(flow)}
                        >
                          {flow.isActive ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteFlow(flow.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, ExternalLink } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import toast from "react-hot-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import type { Account } from "@/types"

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default",
  inactive: "secondary",
  error: "destructive",
}

export default function AccountsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [connectDialogOpen, setConnectDialogOpen] = useState(false)

  const fetchAccounts = async () => {
    try {
      const res = await api.get("/accounts")
      setAccounts(res.data.accounts || res.data)
    } catch {
      toast.error("Failed to load accounts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const toggleStatus = async (account: Account) => {
    try {
      await api.patch(`/accounts/${account.id}`, {
        status: account.status === "active" ? "inactive" : "active",
      })
      toast.success("Account status updated")
      fetchAccounts()
    } catch {
      toast.error("Failed to update account")
    }
  }

  const deleteAccount = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return
    try {
      await api.delete(`/accounts/${id}`)
      toast.success("Account deleted")
      fetchAccounts()
    } catch {
      toast.error("Failed to delete account")
    }
  }

  return (
    <AppLayout title="Accounts">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Connected Accounts</h2>
          <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Connect New Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Instagram Account</DialogTitle>
                <DialogDescription>
                  To connect a new Instagram account, follow these steps:
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <ol className="list-decimal space-y-2 pl-4">
                  <li>
                    Create a Facebook App at{" "}
                    <a
                      href="https://developers.facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      developers.facebook.com
                    </a>
                  </li>
                  <li>Set up Instagram Graph API product</li>
                  <li>
                    Configure OAuth redirect URI to:{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      {typeof window !== "undefined"
                        ? `${window.location.origin}/api/auth/callback/instagram`
                        : "/api/auth/callback/instagram"}
                    </code>
                  </li>
                  <li>Generate a long-lived access token</li>
                  <li>Add the account via the API or contact your admin</li>
                </ol>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    window.open("https://developers.facebook.com/docs/instagram-api/getting-started", "_blank")
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Meta Developer Docs
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">
              No accounts connected yet. Click &quot;Connect New Account&quot; to get started.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>IG User ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      {account.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {account.igUserId}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[account.status]}>
                        {account.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(account.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/accounts/${account.id}/config`)
                            }
                          >
                            View Config
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/accounts/${account.id}/flows`)
                            }
                          >
                            View Flows
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/accounts/${account.id}/inbox`)
                            }
                          >
                            View Inbox
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleStatus(account)}>
                            {account.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteAccount(account.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

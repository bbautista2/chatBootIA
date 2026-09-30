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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import toast from "react-hot-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { useSession } from "next-auth/react"
import type { User } from "@/types"

export default function SettingsPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    role: "admin" as "admin" | "superadmin",
  })
  const [submitting, setSubmitting] = useState(false)

  const isSuperAdmin = session?.user?.role === "superadmin"

  const fetchUsers = async () => {
    if (!isSuperAdmin) {
      setLoading(false)
      return
    }
    try {
      const res = await api.get("/users")
      setUsers(res.data.users || res.data)
    } catch {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [isSuperAdmin])

  const addUser = async () => {
    setSubmitting(true)
    try {
      await api.post("/users", {
        email: formData.email,
        name: formData.name,
        password: formData.password,
        role: formData.role,
      })
      toast.success("User added")
      setAddDialogOpen(false)
      setFormData({ email: "", name: "", password: "", role: "admin" })
      fetchUsers()
    } catch {
      toast.error("Failed to add user")
    } finally {
      setSubmitting(false)
    }
  }

  const updateUser = async () => {
    if (!editingUser) return
    setSubmitting(true)
    try {
      await api.patch(`/users/${editingUser.id}`, {
        role: formData.role,
      })
      toast.success("User updated")
      setEditDialogOpen(false)
      setEditingUser(null)
      fetchUsers()
    } catch {
      toast.error("Failed to update user")
    } finally {
      setSubmitting(false)
    }
  }

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return
    try {
      await api.delete(`/users/${id}`)
      toast.success("User deleted")
      fetchUsers()
    } catch {
      toast.error("Failed to delete user")
    }
  }

  return (
    <AppLayout title="Settings">
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-lg font-semibold">Your Profile</h2>
          <div className="mt-4 rounded-lg border p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{session?.user?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{session?.user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge variant={isSuperAdmin ? "default" : "secondary"}>
                  {session?.user?.role || "admin"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {isSuperAdmin && (
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">User Management</h2>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Create a new admin user account.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="add-email">Email</Label>
                      <Input
                        id="add-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-name">Name</Label>
                      <Input
                        id="add-name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-password">Password</Label>
                      <Input
                        id="add-password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            role: value as "admin" | "superadmin",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="superadmin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={addUser} disabled={submitting}>
                      {submitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add User
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.name || "N/A"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.role === "superadmin"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(user.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingUser(user)
                                  setFormData({
                                    ...formData,
                                    role: user.role,
                                  })
                                  setEditDialogOpen(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteUser(user.id)}
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
          </div>
        )}

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
              <DialogDescription>
                Update the role for {editingUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      role: value as "admin" | "superadmin",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={updateUser} disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}

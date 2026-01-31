import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    IconUsers,
    IconUserPlus,
    IconSearch,
    IconShieldCheck,
    IconEdit,
    IconTrash,
    IconLoader2,
    IconExternalLink,
    IconDotsVertical
} from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

const UserManagement = () => {
    const { getAllUsers, updateUserRole, createAdmin } = useAuth()
    const navigate = useNavigate()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newAdminEmail, setNewAdminEmail] = useState('')
    const [newAdminPassword, setNewAdminPassword] = useState('')
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        const result = await getAllUsers()
        if (result.success) {
            setUsers(result.users)
        } else {
            toast.error('Failed to fetch users: ' + result.error)
        }
        setLoading(false)
    }

    const handleRoleChange = async (email, newRole, userId) => {
        const result = await updateUserRole(email, newRole, userId)
        if (result.success) {
            toast.success(`Role updated to ${newRole} for ${email}`)
            fetchUsers()
        } else {
            toast.error('Failed to update role: ' + result.error)
        }
    }

    const handleCreateAdmin = async (e) => {
        e.preventDefault()
        setCreating(true)
        const result = await createAdmin(newAdminEmail, newAdminPassword)
        if (result.success) {
            toast.success('Admin created successfully')
            setIsCreateModalOpen(false)
            setNewAdminEmail('')
            setNewAdminPassword('')
            fetchUsers()
        } else {
            toast.error('Failed to create admin: ' + result.error)
        }
        setCreating(false)
    }

    const filteredUsers = users.filter(user =>
    (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const getStatusBadge = (completed) => {
        if (completed) {
            return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
        }
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
    }

    return (
        <div className="px-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">Manage platform users, roles, and onboarding status.</p>
                </div>
                <Button
                    className="bg-orange-600 hover:bg-orange-500"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <IconUserPlus className="mr-2 size-4" />
                    Create Real Admin
                </Button>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="pb-3 text-orange-600">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users by email or role..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <IconLoader2 className="size-8 text-orange-600 animate-spin" />
                            <p className="text-muted-foreground">Loading platform users...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-muted-foreground">
                                        <th className="text-left font-medium py-3 px-4 text-orange-600">User Email</th>
                                        <th className="text-left font-medium py-3 px-4 text-orange-600">Role</th>
                                        <th className="text-left font-medium py-3 px-4 text-orange-600">Joined Date</th>
                                        <th className="text-left font-medium py-3 px-4 text-orange-600">Status</th>
                                        <th className="text-right font-medium py-3 px-4 text-orange-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} className="border-b transition-colors hover:bg-gray-50/50">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                                            {(user.email?.[0] || 'U').toUpperCase()}
                                                        </div>
                                                        <span className="font-medium">{user.email || 'No email'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Select
                                                        defaultValue={user.role}
                                                        onValueChange={(val) => handleRoleChange(user.email, val, user.id)}
                                                    >
                                                        <SelectTrigger className="w-[120px] h-8 text-xs border-none bg-transparent hover:bg-gray-100">
                                                            <div className={`px-2 py-0.5 rounded-md text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                                    user.role === 'pro' ? 'bg-blue-100 text-blue-700' :
                                                                        'bg-green-100 text-green-700'
                                                                }`}>
                                                                {user.role || 'No Role'}
                                                            </div>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="client">Client</SelectItem>
                                                            <SelectItem value="pro">Pro</SelectItem>
                                                            <SelectItem value="admin">Admin</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="py-4 px-4 text-muted-foreground">
                                                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="py-4 px-4">
                                                    {getStatusBadge(user.onboarding_completed)}
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                            onClick={() => navigate(`/admin/users/${user.id}`)}
                                                            title="View Full Profile"
                                                        >
                                                            <IconExternalLink className="size-4" />
                                                        </Button>

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                                                                    <IconDotsVertical className="size-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}`)}>
                                                                    <IconEdit className="mr-2 size-4" /> Edit Profile
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="text-red-600">
                                                                    <IconTrash className="mr-2 size-4" /> Delete User
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="py-12 text-center text-muted-foreground">
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Admin Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <Card className="w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
                        <CardHeader>
                            <CardTitle>Create Real Admin</CardTitle>
                            <CardDescription>
                                This will create a new user account with full administrative privileges on Supabase.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateAdmin} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email Address</label>
                                    <Input
                                        type="email"
                                        required
                                        placeholder="admin@example.com"
                                        value={newAdminEmail}
                                        onChange={(e) => setNewAdminEmail(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Password</label>
                                    <Input
                                        type="password"
                                        required
                                        placeholder="Min 6 characters"
                                        value={newAdminPassword}
                                        onChange={(e) => setNewAdminPassword(e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        disabled={creating}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-orange-600 hover:bg-orange-500 text-white"
                                        disabled={creating}
                                    >
                                        {creating ? (
                                            <>
                                                <IconLoader2 className="mr-2 size-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Admin'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

export default UserManagement

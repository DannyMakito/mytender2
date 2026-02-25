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
    IconDotsVertical,
    IconFilter,
    IconFilterOff,
    IconSortDescending,
    IconRotate
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
    const [filterRole, setFilterRole] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')
    const [sortBy, setSortBy] = useState('newest')
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

    const filteredUsers = users
        .filter(user => {
            const matchesSearch = !searchQuery ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.role?.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesRole = filterRole === 'all' || user.role === filterRole

            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'pending' && (!user.account_status || user.account_status === 'pending')) ||
                user.account_status === filterStatus

            return matchesSearch && matchesRole && matchesStatus
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at)
            if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
            if (sortBy === 'email_asc') return (a.email || '').localeCompare(b.email || '')
            if (sortBy === 'email_desc') return (b.email || '').localeCompare(a.email || '')
            return 0
        })

    const resetFilters = () => {
        setSearchQuery('')
        setFilterRole('all')
        setFilterStatus('all')
        setSortBy('newest')
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
            case 'rejected':
                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>
            default:
                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
        }
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

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b pb-6">
                    <div className="flex flex-col space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-orange-50 rounded-lg">
                                    <IconFilter className="size-5 text-orange-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Smart Filters</CardTitle>
                                    <CardDescription>Narrow down user lists and sort results</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchUsers}
                                    className="h-9"
                                >
                                    <IconRotate className="mr-2 size-4" />
                                    Refresh
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetFilters}
                                    className="h-9 text-muted-foreground"
                                >
                                    <IconFilterOff className="mr-2 size-4" />
                                    Clear Filters
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Search</label>
                                <div className="relative">
                                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Email or keyword..."
                                        className="pl-10 h-10 border-gray-200 focus:border-orange-500 focus:ring-orange-500 transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Role</label>
                                <Select value={filterRole} onValueChange={setFilterRole}>
                                    <SelectTrigger className="h-10 border-gray-200 focus:ring-orange-500">
                                        <SelectValue placeholder="All Roles" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="admin">Admins</SelectItem>
                                        <SelectItem value="client">Clients</SelectItem>
                                        <SelectItem value="pro">Pro Users</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Status</label>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="h-10 border-gray-200 focus:ring-orange-500">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="approved">Active</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Sort By</label>
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="h-10 border-gray-200 focus:ring-orange-500">
                                        <div className="flex items-center gap-2">
                                            <IconSortDescending className="size-4 text-muted-foreground" />
                                            <SelectValue placeholder="Sort Order" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">Newest First</SelectItem>
                                        <SelectItem value="oldest">Oldest First</SelectItem>
                                        <SelectItem value="email_asc">Email (A-Z)</SelectItem>
                                        <SelectItem value="email_desc">Email (Z-A)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <span className="text-sm text-muted-foreground">
                                Showing <span className="font-semibold text-foreground">{filteredUsers.length}</span> users
                                {users.length !== filteredUsers.length && (
                                    <> of <span className="font-semibold">{users.length}</span> total</>
                                )}
                            </span>
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
                                    <tr className="border-b bg-gray-50/30">
                                        <th className="text-left font-semibold py-4 px-4 text-orange-600 uppercase tracking-tight text-xs">User Email</th>
                                        <th className="text-left font-semibold py-4 px-4 text-orange-600 uppercase tracking-tight text-xs">Role</th>
                                        <th className="text-left font-semibold py-4 px-4 text-orange-600 uppercase tracking-tight text-xs">Joined Date</th>
                                        <th className="text-left font-semibold py-4 px-4 text-orange-600 uppercase tracking-tight text-xs">Status</th>
                                        <th className="text-right font-semibold py-4 px-4 text-orange-600 uppercase tracking-tight text-xs">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} className="border-b transition-colors hover:bg-orange-50/30 group">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                                            {(user.email?.[0] || 'U').toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-gray-900">{user.email || 'No email'}</span>
                                                            <span className="text-[10px] text-muted-foreground uppercase">{user.id?.slice(0, 8)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Select
                                                        defaultValue={user.role}
                                                        onValueChange={(val) => handleRoleChange(user.email, val, user.id)}
                                                    >
                                                        <SelectTrigger className="w-[120px] h-8 text-xs border-none bg-transparent hover:bg-orange-100/50">
                                                            <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
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
                                                <td className="py-4 px-4 text-muted-foreground font-medium">
                                                    {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                                </td>
                                                <td className="py-4 px-4">
                                                    {getStatusBadge(user.account_status)}
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
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
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuLabel>User Options</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}`)}>
                                                                    <IconEdit className="mr-2 size-4" /> Edit Profile
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50">
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
                                            <td colSpan="5" className="py-24 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <div className="p-4 bg-gray-50 rounded-full">
                                                        <IconSearch className="size-10 text-gray-300" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-lg font-semibold text-gray-900">No users found</p>
                                                        <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms to find what you're looking for.</p>
                                                    </div>
                                                    <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2">
                                                        <IconFilterOff className="mr-2 size-4" />
                                                        Clear All Filters
                                                    </Button>
                                                </div>
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

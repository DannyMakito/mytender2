import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    IconArrowLeft,
    IconUser,
    IconMail,
    IconPhone,
    IconMapPin,
    IconBriefcase,
    IconBuildingSkyscraper,
    IconCalendar,
    IconLoader2,
    IconShieldCheck,
    IconCheck,
    IconX,
    IconTrash,
    IconEdit
} from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

const UserProfile = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { getUserProfile, updateUserRole, deleteUserProfile } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        fetchProfile()
    }, [id])

    const fetchProfile = async () => {
        setLoading(true)
        const result = await getUserProfile(id)
        if (result.success) {
            setProfile(result.profile)
        } else {
            toast.error('Failed to load profile: ' + result.error)
            navigate('/admin/users')
        }
        setLoading(false)
    }

    const handleRoleChange = async (newRole) => {
        setUpdating(true)
        const result = await updateUserRole(profile.email, newRole, id)
        if (result.success) {
            toast.success('User role updated successfully')
            setProfile({ ...profile, role: newRole })
        } else {
            toast.error('Failed to update role: ' + result.error)
        }
        setUpdating(false)
    }

    const handleDeleteUser = async () => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return

        setIsDeleting(true)
        const result = await deleteUserProfile(id)
        if (result.success) {
            toast.success('User deleted successfully')
            navigate('/admin/users')
        } else {
            toast.error('Failed to delete user: ' + result.error)
        }
        setIsDeleting(false)
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <IconLoader2 className="size-8 text-orange-600 animate-spin" />
                <p className="text-muted-foreground">Fetching profile details...</p>
            </div>
        )
    }

    if (!profile) return null

    return (
        <div className="px-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/users')}>
                    <IconArrowLeft className="size-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Details</h1>
                    <p className="text-sm text-muted-foreground">ID: {id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Identity Card */}
                <Card className="lg:col-span-1 border-none shadow-sm h-full">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-3xl font-bold mb-4">
                            {(profile.email?.[0] || 'U').toUpperCase()}
                        </div>
                        <CardTitle className="text-xl">
                            {profile.first_name ? `${profile.first_name} ${profile.last_name || ''}` : profile.email}
                        </CardTitle>
                        <CardDescription>{profile.email}</CardDescription>
                        <div className="pt-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${profile.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                    profile.role === 'pro' ? 'bg-blue-100 text-blue-700' :
                                        'bg-green-100 text-green-700'
                                }`}>
                                {profile.role?.toUpperCase()}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 mt-6">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground font-medium uppercase">Change Account Role</Label>
                            <Select
                                defaultValue={profile.role}
                                onValueChange={handleRoleChange}
                                disabled={updating}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="client">Client</SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="pt-4">
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={handleDeleteUser}
                                disabled={isDeleting}
                            >
                                <IconTrash className="mr-2 size-4" />
                                Delete User Account
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <IconUser className="size-5 text-orange-600" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Full Name</Label>
                                <p className="font-medium">{profile.first_name || 'N/A'} {profile.last_name || ''}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Phone Number</Label>
                                <p className="font-medium">{profile.phone || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Province</Label>
                                <p className="font-medium">{profile.province || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Joined At</Label>
                                <p className="font-medium">{profile.created_at ? new Date(profile.created_at).toLocaleString() : 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <IconBuildingSkyscraper className="size-5 text-orange-600" />
                                Business Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Business Name</Label>
                                    <p className="font-medium">{profile.business_name || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Business Type</Label>
                                    <p className="font-medium">{profile.business_type || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Industry</Label>
                                    <p className="font-medium">{profile.industry || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Onboarding Status</Label>
                                    <div className="flex items-center gap-2">
                                        {profile.onboarding_completed ? (
                                            <>
                                                <IconCheck className="size-4 text-green-600" />
                                                <span className="text-green-600 font-medium">Completed</span>
                                            </>
                                        ) : (
                                            <>
                                                <IconX className="size-4 text-yellow-600" />
                                                <span className="text-yellow-600 font-medium">Pending</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Description</Label>
                                <p className="font-medium">{profile.business_desc || 'No description provided.'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <IconBriefcase className="size-5 text-orange-600" />
                                Tender Interests
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Operating Regions</Label>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {profile.operating_regions?.length > 0 ? (
                                        profile.operating_regions.map((reg, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">{reg}</span>
                                        ))
                                    ) : <p className="text-sm font-medium">None specified</p>}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Tender Categories</Label>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {profile.tender_categories?.length > 0 ? (
                                        profile.tender_categories.map((cat, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">{cat}</span>
                                        ))
                                    ) : <p className="text-sm font-medium">None specified</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default UserProfile

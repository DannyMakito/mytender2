import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    IconArrowLeft,
    IconUser,
    IconBuildingSkyscraper,
    IconBriefcase,
    IconLoader2,
    IconCheck,
    IconX,
    IconTrash,
    IconFileCheck,
    IconFileX,
    IconExternalLink,
    IconAlertCircle,
    IconClock
} from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

const UserProfile = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { getUserProfile, deleteUserProfile, approveAccount, rejectAccount } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')

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

    const handleApprove = async () => {
        setUpdating(true)
        const result = await approveAccount(id)
        if (result.success) {
            // Create a notification for the user
            try {
                await supabase.from('notifications').insert({
                    user_email: profile.email,
                    type: 'AWARDED_TENDER', // Using existing enum type for DB compatibility 
                    title: 'Account Verified!',
                    message: 'Congratulations! Your business account has been approved. You can now start using all platform features.',
                    is_read: false
                })
            } catch (notifErr) {
                console.error('Failed to create notification:', notifErr)
            }

            toast.success('Account approved successfully!')
            setProfile({ ...profile, account_status: 'approved', onboarding_completed: true })
        } else {
            toast.error('Failed to approve account: ' + result.error)
        }
        setUpdating(false)
    }

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection')
            return
        }
        setUpdating(true)
        const result = await rejectAccount(id, rejectionReason)
        if (result.success) {
            // Create a notification for the user
            try {
                await supabase.from('notifications').insert({
                    user_email: profile.email,
                    type: 'REJECTED_BID', // Using existing enum type for DB compatibility
                    title: 'Account Verification Update',
                    message: `Your account verification results: Rejected. Reason: ${rejectionReason}`,
                    is_read: false
                })
            } catch (notifErr) {
                console.error('Failed to create notification:', notifErr)
            }

            toast.success('Account rejected')
            setProfile({ ...profile, account_status: 'rejected', onboarding_completed: false, rejection_reason: rejectionReason })
            setShowRejectModal(false)
            setRejectionReason('')
        } else {
            toast.error('Failed to reject account: ' + result.error)
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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                        <IconCheck className="size-4" />
                        Active
                    </span>
                )
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                        <IconX className="size-4" />
                        Rejected
                    </span>
                )
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
                        <IconClock className="size-4" />
                        Pending Review
                    </span>
                )
        }
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
                        <div className="pt-4 space-y-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${profile.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                profile.role === 'pro' ? 'bg-blue-100 text-blue-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                {profile.role?.toUpperCase()}
                            </span>
                            <div className="mt-2">
                                {getStatusBadge(profile.account_status)}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 mt-6">
                        {/* Account Verification Actions */}
                        <div className="space-y-3">
                            <Label className="text-xs text-muted-foreground font-medium uppercase">Account Verification</Label>

                            {profile.account_status === 'pending' && (
                                <div className="space-y-2">
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-500 text-white"
                                        onClick={handleApprove}
                                        disabled={updating}
                                    >
                                        <IconFileCheck className="mr-2 size-4" />
                                        Approve Account
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                                        onClick={() => setShowRejectModal(true)}
                                        disabled={updating}
                                    >
                                        <IconFileX className="mr-2 size-4" />
                                        Reject Account
                                    </Button>
                                </div>
                            )}

                            {profile.account_status === 'approved' && (
                                <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
                                    <IconCheck className="inline size-4 mr-1" />
                                    This account has been verified and approved.
                                </div>
                            )}

                            {profile.account_status === 'rejected' && (
                                <div className="space-y-2">
                                    <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
                                        <IconAlertCircle className="inline size-4 mr-1" />
                                        <span className="font-medium">Rejected:</span> {profile.rejection_reason || 'No reason provided'}
                                    </div>
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-500 text-white"
                                        onClick={handleApprove}
                                        disabled={updating}
                                    >
                                        <IconFileCheck className="mr-2 size-4" />
                                        Approve Account
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t">
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
                    {/* Business Document Section */}
                    <Card className="border-none shadow-sm border-l-4 border-l-orange-500">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <IconFileCheck className="size-5 text-orange-600" />
                                Business Verification Document
                            </CardTitle>
                            <CardDescription>Review the submitted business documents</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {profile.business_document_url ? (
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                            <IconFileCheck className="size-6 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Business Document</p>
                                            <p className="text-sm text-muted-foreground">Click to view or download</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => window.open(profile.business_document_url, '_blank')}
                                    >
                                        <IconExternalLink className="mr-2 size-4" />
                                        View Document
                                    </Button>
                                </div>
                            ) : (
                                <div className="p-6 text-center bg-gray-50 rounded-lg">
                                    <IconAlertCircle className="size-8 text-yellow-500 mx-auto mb-2" />
                                    <p className="text-muted-foreground">No business document uploaded</p>
                                    <p className="text-sm text-muted-foreground">The user has not submitted verification documents yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

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
                                    <Label className="text-muted-foreground">Business Address</Label>
                                    <p className="font-medium">{profile.business_address || 'N/A'}</p>
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

            {/* Reject Modal */}
            <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Account</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this account. The user will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Enter rejection reason..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={updating}
                        >
                            {updating ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : null}
                            Reject Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default UserProfile

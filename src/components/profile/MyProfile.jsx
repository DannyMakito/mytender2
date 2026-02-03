import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    IconUser,
    IconBuildingSkyscraper,
    IconBriefcase,
    IconLoader2,
    IconCheck,
    IconX,
    IconUpload,
    IconFileCheck,
    IconAlertCircle,
    IconClock,
    IconEdit,
    IconRefresh
} from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

const MyProfile = () => {
    const navigate = useNavigate()
    const { user, role, getMyProfile, uploadBusinessDocument, updateMyProfile } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        fetchProfile()
    }, [user])

    const fetchProfile = async () => {
        if (!user) return
        setLoading(true)
        const result = await getMyProfile()
        if (result.success) {
            setProfile(result.profile)
        } else {
            toast.error('Failed to load profile: ' + result.error)
        }
        setLoading(false)
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please upload a PDF or image file (JPG, PNG)')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB')
            return
        }

        setUploading(true)
        const result = await uploadBusinessDocument(file)
        if (result.success) {
            toast.success('Document uploaded successfully! Your account is now under review.')
            setProfile({ ...profile, business_document_url: result.url, account_status: 'pending', rejection_reason: null })
        } else {
            toast.error('Failed to upload document: ' + result.error)
        }
        setUploading(false)

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <IconCheck className="size-6 text-green-600" />
                        <div>
                            <p className="font-semibold text-green-700">Account Active</p>
                            <p className="text-sm text-green-600">Your account has been verified and you can create tenders.</p>
                        </div>
                    </div>
                )
            case 'rejected':
                return (
                    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <IconX className="size-6 text-red-600" />
                        <div>
                            <p className="font-semibold text-red-700">Account Rejected</p>
                            <p className="text-sm text-red-600">{profile?.rejection_reason || 'Your verification was not approved.'}</p>
                        </div>
                    </div>
                )
            default:
                return (
                    <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <IconClock className="size-6 text-yellow-600" />
                        <div>
                            <p className="font-semibold text-yellow-700">Pending Review</p>
                            <p className="text-sm text-yellow-600">Your account is under review. You'll be notified once approved.</p>
                        </div>
                    </div>
                )
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <IconLoader2 className="size-8 text-orange-600 animate-spin" />
                <p className="text-muted-foreground">Loading your profile...</p>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <IconAlertCircle className="size-8 text-red-500" />
                <p className="text-muted-foreground">Could not load profile. Please try again.</p>
                <Button onClick={fetchProfile}>
                    <IconRefresh className="mr-2 size-4" />
                    Retry
                </Button>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
                    <p className="text-muted-foreground">View and manage your account details</p>
                </div>
            </div>

            {/* Account Status Banner */}
            {getStatusBadge(profile.account_status)}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <Card className="lg:col-span-1 border-none shadow-sm">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-3xl font-bold mb-4">
                            {(profile.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                        </div>
                        <CardTitle className="text-xl">
                            {profile.first_name ? `${profile.first_name} ${profile.last_name || ''}` : 'Complete your profile'}
                        </CardTitle>
                        <CardDescription>{user?.email}</CardDescription>
                        <div className="pt-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                    role === 'pro' ? 'bg-blue-100 text-blue-700' :
                                        'bg-green-100 text-green-700'
                                }`}>
                                {role?.toUpperCase() || 'USER'}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 mt-4">
                        <div className="text-center text-sm text-muted-foreground">
                            Member since {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Document Upload Section */}
                    <Card className={`border-none shadow-sm border-l-4 ${profile.account_status === 'rejected' ? 'border-l-red-500' :
                            profile.account_status === 'approved' ? 'border-l-green-500' :
                                'border-l-orange-500'
                        }`}>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <IconFileCheck className="size-5 text-orange-600" />
                                Business Verification Document
                            </CardTitle>
                            <CardDescription>
                                Upload your business registration document (CIPC certificate, tax clearance, or company registration)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {profile.business_document_url ? (
                                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                <IconFileCheck className="size-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium">Document Uploaded</p>
                                                <p className="text-sm text-muted-foreground">Your document has been submitted</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(profile.business_document_url, '_blank')}
                                        >
                                            View
                                        </Button>
                                    </div>

                                    {(profile.account_status === 'rejected' || profile.account_status === 'pending') && (
                                        <div className="pt-3 border-t">
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {profile.account_status === 'rejected'
                                                    ? 'Your previous document was rejected. Please upload a new one.'
                                                    : 'Want to upload a different document?'
                                                }
                                            </p>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                id="doc-upload-replace"
                                            />
                                            <Button
                                                variant="outline"
                                                onClick={() => document.getElementById('doc-upload-replace').click()}
                                                disabled={uploading}
                                            >
                                                {uploading ? (
                                                    <>
                                                        <IconLoader2 className="mr-2 size-4 animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconRefresh className="mr-2 size-4" />
                                                        Replace Document
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-orange-300 transition-colors">
                                    <IconUpload className="size-12 text-gray-400 mx-auto mb-4" />
                                    <p className="font-medium text-gray-700 mb-1">Upload your business document</p>
                                    <p className="text-sm text-muted-foreground mb-4">PDF, JPG, or PNG up to 5MB</p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="doc-upload"
                                    />
                                    <Button
                                        onClick={() => document.getElementById('doc-upload').click()}
                                        disabled={uploading}
                                        className="bg-orange-600 hover:bg-orange-500"
                                    >
                                        {uploading ? (
                                            <>
                                                <IconLoader2 className="mr-2 size-4 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <IconUpload className="mr-2 size-4" />
                                                Choose File
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {profile.account_status !== 'approved' && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <IconAlertCircle className="size-3" />
                                    You won't be able to create tenders until your account is verified.
                                </p>
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
                                <Label className="text-muted-foreground">Email</Label>
                                <p className="font-medium">{user?.email || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <IconBuildingSkyscraper className="size-5 text-orange-600" />
                                Business Details
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
                                Preferences
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
                                    ) : <p className="text-sm font-medium text-muted-foreground">None specified</p>}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Tender Categories</Label>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {profile.tender_categories?.length > 0 ? (
                                        profile.tender_categories.map((cat, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">{cat}</span>
                                        ))
                                    ) : <p className="text-sm font-medium text-muted-foreground">None specified</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default MyProfile

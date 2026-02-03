import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Check, User, Building, MapPin, Target, Bell, CreditCard, ChevronLeft, ChevronRight, Loader2, FileText, Upload, Clock } from 'lucide-react'
import supabase from '../../../supabase-client'
import { toast } from 'sonner'

const STEPS = [
    { id: 1, label: 'Personal Info', icon: User },
    { id: 2, label: 'Business Details', icon: Building },
    { id: 3, label: 'Location', icon: MapPin },
    { id: 4, label: 'Tender Interests', icon: Target },
    { id: 5, label: 'Documents', icon: FileText },
    { id: 6, label: 'Notifications', icon: Bell },
    { id: 7, label: 'Subscription', icon: CreditCard },
    { id: 8, label: 'Welcome', icon: Check },
]

const PROVINCES = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
    'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'
]

const CATEGORIES = [
    'Construction', 'Transportation', 'Professional Services',
    'Others', 'Supplier', 'Catering'
]

const INDUSTRIES = [
    'Agriculture', 'Construction', 'Education', 'Energy', 'finance',
    'Healthcare', 'Hospitality', 'IT & Telecoms', 'Manufacturing',
    'Mining', 'Retail', 'Transport', 'Other Service Activities'
]

// --- Step Components Defined Outside ---

const Step1Personal = ({ formData, handleInputChange }) => (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome to MyTender!</h2>
            <p className="text-gray-500">Let's start by getting to know you better</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Daniel"
                    className="h-11"
                />
            </div>
            <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Doe"
                    className="h-11"
                />
            </div>
        </div>
        <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+27 123 456 7890"
                className="h-11"
            />
        </div>
        <div className="space-y-2">
            <Label>Province</Label>
            <Select
                value={formData.province}
                onValueChange={(val) => handleInputChange('province', val)}
            >
                <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select your province" />
                </SelectTrigger>
                <SelectContent>
                    {PROVINCES.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    </div>
)

const Step2Business = ({ formData, handleInputChange, role }) => {
    const isPro = role === 'pro'
    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">{isPro ? 'Tell us about your professional service' : 'Tell us about your business'}</h2>
                <p className="text-gray-500">This helps us find relevant tenders for you</p>
            </div>
            <div className="space-y-2">
                <Label>{isPro ? 'Job' : 'Business Name'}</Label>
                <Input
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="Afrinexel"
                    className="h-11"
                />
            </div>
            <div className="space-y-2">
                <Label>{isPro ? 'Work sector' : 'Business Type'}</Label>
                <Select
                    value={formData.businessType}
                    onValueChange={(val) => handleInputChange('businessType', val)}
                >
                    <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Private Company (Pty Ltd)">Private Company (Pty Ltd)</SelectItem>
                        <SelectItem value="Sole Proprietor">Sole Proprietor</SelectItem>
                        <SelectItem value="Free lance">Free lance</SelectItem>
                        <SelectItem value="Public Company">Public Company</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Industry</Label>
                <Select
                    value={formData.industry}
                    onValueChange={(val) => handleInputChange('industry', val)}
                >
                    <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select Industry" />
                    </SelectTrigger>
                    <SelectContent>
                        {INDUSTRIES.map(i => (
                            <SelectItem key={i} value={i}>{i}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>{isPro ? 'Work Description' : 'Business Description'}</Label>
                <textarea
                    value={formData.businessDescription}
                    onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                    placeholder="We build digital solutions and services..."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>
        </div>
    )
}

const Step3Location = ({ formData, handleInputChange, handleCheckboxChange }) => (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Where do you operate?</h2>
            <p className="text-gray-500">Select the regions where you can fulfill tenders</p>
        </div>
        <div className="space-y-2">
            <Label>Business Address</Label>
            <textarea
                value={formData.businessAddress}
                onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                placeholder="Enter your business address"
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
            />
        </div>
        <div className="space-y-3">
            <Label>Preferred Operating Regions</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...PROVINCES, 'National'].map(region => (
                    <div key={region} className="flex items-center space-x-2">
                        <Checkbox
                            id={`region-${region}`}
                            checked={formData.operatingRegions.includes(region)}
                            onCheckedChange={(checked) => handleCheckboxChange('operatingRegions', region, checked)}
                        />
                        <label
                            htmlFor={`region-${region}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                            {region}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    </div>
)

const Step4Interests = ({ formData, handleInputChange, handleCheckboxChange }) => (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">What type of tenders interest you?</h2>
            <p className="text-gray-500">Select categories to get personalized recommendations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-1">
            {CATEGORIES.map(cat => (
                <div key={cat} className="flex items-start space-x-2">
                    <Checkbox
                        id={`cat-${cat}`}
                        checked={formData.tenderCategories.includes(cat)}
                        onCheckedChange={(checked) => handleCheckboxChange('tenderCategories', cat, checked)}
                        className="mt-1"
                    />
                    <label htmlFor={`cat-${cat}`} className="grid gap-1.5 leading-none cursor-pointer">
                        <span className="text-sm font-medium leading-none">{cat}</span>
                        <span className="text-xs text-muted-foreground">Relevent tenders for {cat}</span>
                    </label>
                </div>
            ))}
        </div>

        <div className="space-y-2 mt-4">
            <Label>Budget Range (Typical Project Size)</Label>
            <Select
                value={formData.budgetRange}
                onValueChange={(val) => handleInputChange('budgetRange', val)}
            >
                <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select your typical project budget" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="0-50k">R0 - R50,000</SelectItem>
                    <SelectItem value="50k-500k">R50,000 - R500,000</SelectItem>
                    <SelectItem value="500k-1m">R500,000 - R1 Million</SelectItem>
                    <SelectItem value="1m-5m">R1 Million - R5 Million</SelectItem>
                    <SelectItem value="5m+">R5 Million+</SelectItem>
                </SelectContent>
            </Select>
        </div>
    </div>
)

// Document Upload Step
const Step5Documents = ({ formData, handleDocumentUpload, uploading, role }) => (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Business Verification</h2>
            <p className="text-gray-500">Upload your business registration document for verification</p>
        </div>

        <div className="max-w-md mx-auto space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="font-medium text-blue-800">Required Documents</p>
                        <ul className="text-sm text-blue-700 mt-1 space-y-1">
                            <li>• CIPC Certificate / Company Registration</li>
                            <li>• Tax Clearance Certificate</li>
                            <li>• Letter of Good Standing</li>
                        </ul>
                    </div>
                </div>
            </div>

            {formData.businessDocumentUrl ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-600" />
                        <div>
                            <p className="font-medium text-green-800">Document Uploaded</p>
                            <p className="text-sm text-green-700">Your document has been uploaded successfully.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-lime-300 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="font-medium text-gray-700 mb-1">Upload your business document</p>
                    <p className="text-sm text-muted-foreground mb-4">PDF, JPG, or PNG up to 5MB</p>
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleDocumentUpload}
                        className="hidden"
                        id="business-doc-upload"
                    />
                    <Button
                        onClick={() => document.getElementById('business-doc-upload').click()}
                        disabled={uploading}
                        className="bg-lime-500 hover:bg-lime-600"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Choose File
                            </>
                        )}
                    </Button>
                </div>
            )}

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                        <p className="font-medium text-yellow-800">Optional but Recommended</p>
                        <p className="text-sm text-yellow-700">You can skip this step, but your account will remain pending until documents are verified. You won't be able to {role === 'client' ? 'create tenders' : 'bid on tenders'} until approved.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
)

const Step7Notifications = ({ formData, handleNotificationChange, role }) => (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Stay informed</h2>
            <p className="text-gray-500">Choose how you'd like to receive updates</p>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <Checkbox
                    id="notif-email"
                    checked={formData.notifications.email}
                    onCheckedChange={(c) => handleNotificationChange('email', c)}
                />
                <div className="grid gap-1.5 leading-none">
                    <label htmlFor="notif-email" className="text-sm font-medium leading-none cursor-pointer">
                        Email notifications for new tenders
                    </label>
                    <p className="text-xs text-muted-foreground">{role === 'client' ? 'When bids are placed' : 'Matches found immediately'}</p>
                </div>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <Checkbox
                    id="notif-sms"
                    checked={formData.notifications.sms}
                    onCheckedChange={(c) => handleNotificationChange('sms', c)}
                />
                <div className="grid gap-1.5 leading-none">
                    <label htmlFor="notif-sms" className="text-sm font-medium leading-none cursor-pointer">
                        SMS notifications for urgent tenders
                    </label>
                    <p className="text-xs text-muted-foreground">Get alerted on your phone</p>
                </div>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <Checkbox
                    id="notif-digest"
                    checked={formData.notifications.digest}
                    onCheckedChange={(c) => handleNotificationChange('digest', c)}
                />
                <div className="grid gap-1.5 leading-none">
                    <label htmlFor="notif-digest" className="text-sm font-medium leading-none cursor-pointer">
                        Weekly digest email
                    </label>
                    <p className="text-xs text-muted-foreground">Summary of all activity</p>
                </div>
            </div>
        </div>
    </div>
)

const Step8Subscription = ({ role }) => (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Choose your plan</h2>
            <p className="text-gray-500">Unlock expected potential features</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className={`cursor-pointer border-2 transition-all ${role === 'pro' ? 'border-lime-500 bg-lime-50' : 'border-gray-200'}`}>
                <CardHeader>
                    <CardTitle>Free Tier</CardTitle>
                    <CardDescription>Basic access to tenders</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="text-sm space-y-2">
                        <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> View Public Tenders</li>
                        <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> Limited Bids</li>
                    </ul>
                    <Button className="w-full mt-4" variant="outline">Selected</Button>
                </CardContent>
            </Card>
            <Card className="cursor-pointer border-2 border-gray-100 hover:border-lime-200 opacity-60">
                <CardHeader>
                    <CardTitle>Pro Tier (Coming Soon)</CardTitle>
                    <CardDescription>Advanced analytics & Unlimited bids</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="text-sm space-y-2">
                        <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> Unlimited Bids</li>
                        <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> Advanced Filtering</li>
                    </ul>
                    <Button className="w-full mt-4" disabled>Coming Soon</Button>
                </CardContent>
            </Card>
        </div>
    </div>
)

const Step9Welcome = ({ finishOnboarding, loading, role }) => (
    <div className="space-y-6 text-center animate-in zoom-in duration-500 py-10">
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center bg-yellow-100 rounded-full mb-6">
            <Clock className="w-12 h-12 text-yellow-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Almost There!</h2>
        <p className="text-gray-500 max-w-md mx-auto">
            Your profile has been submitted and is now <span className="font-semibold text-yellow-600">under review</span>.
        </p>

        <div className="max-w-md mx-auto p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
            <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                    <p className="font-medium text-yellow-800">What happens next?</p>
                    <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                        <li>• Our team will verify your business documents</li>
                        <li>• You'll receive a notification once approved</li>
                        <li>• Until then, you can explore but {role === 'client' ? 'cannot create tenders' : 'cannot place bids'}</li>
                    </ul>
                </div>
            </div>
        </div>

        <Button
            onClick={finishOnboarding}
            size="lg"
            className="mt-8 bg-lime-600 hover:bg-lime-700 text-white min-w-[200px]"
            disabled={loading}
        >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Go to Dashboard'}
        </Button>

        <p className="text-xs text-muted-foreground">Thank you for your patience!</p>
    </div>
)


export default function Onboarding() {
    const { user, role, navigateByRole, uploadBusinessDocument } = useAuth()
    const navigate = useNavigate()
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        province: '',
        businessName: '',
        businessType: '',
        industry: '',
        businessDescription: '',
        businessAddress: '',
        operatingRegions: [],
        tenderCategories: [],
        budgetRange: '',
        businessDocumentUrl: null,
        notifications: {
            email: true,
            sms: false,
            digest: false
        }
    })

    const effectiveSteps = role === 'client'
        ? STEPS.filter(s => s.id !== 4) // Skip Interests for clients
        : STEPS

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleCheckboxChange = (field, item, checked) => {
        setFormData(prev => {
            const list = prev[field] || []
            if (checked) {
                return { ...prev, [field]: [...list, item] }
            } else {
                return { ...prev, [field]: list.filter(i => i !== item) }
            }
        })
    }

    const handleNotificationChange = (key, checked) => {
        setFormData(prev => ({
            ...prev,
            notifications: { ...prev.notifications, [key]: checked }
        }))
    }

    // Handle document upload during onboarding
    const handleDocumentUpload = async (e) => {
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

        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/business_doc_${Date.now()}.${fileExt}`

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('business-documents')
                .upload(fileName, file, { upsert: true })

            if (uploadError) throw uploadError

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('business-documents')
                .getPublicUrl(fileName)

            const publicUrl = urlData.publicUrl
            setFormData(prev => ({ ...prev, businessDocumentUrl: publicUrl }))
            toast.success('Document uploaded successfully!')
        } catch (error) {
            console.error('Error uploading document:', error)
            toast.error('Failed to upload document. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    const validateStep = (step) => {
        // Basic validation
        if (step === 1) {
            return formData.firstName && formData.lastName && formData.phone && formData.province
        }
        if (step === 2) {
            return formData.businessName && formData.businessType && formData.industry && formData.businessDescription
        }
        if (step === 3) {
            return formData.businessAddress && formData.operatingRegions.length > 0
        }
        if (step === 4 && role === 'pro') {
            return formData.tenderCategories.length > 0 && formData.budgetRange
        }
        return true
    }

    const handleNext = async () => {
        if (!validateStep(currentStep)) {
            toast.error('Please fill in all required fields to continue')
            return
        }

        const currentIndex = effectiveSteps.findIndex(s => s.id === currentStep)
        if (currentIndex < effectiveSteps.length - 1) {
            setCurrentStep(effectiveSteps[currentIndex + 1].id)
            window.scrollTo(0, 0)
        } else {
            await finishOnboarding()
        }
    }

    const handleBack = () => {
        const currentIndex = effectiveSteps.findIndex(s => s.id === currentStep)
        if (currentIndex > 0) {
            setCurrentStep(effectiveSteps[currentIndex - 1].id)
            window.scrollTo(0, 0)
        }
    }

    const finishOnboarding = async () => {
        setLoading(true)
        try {
            if (!user) {
                throw new Error('No user found')
            }

            const updates = {
                id: user.id,
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone: formData.phone,
                province: formData.province,
                business_name: formData.businessName,
                business_type: formData.businessType,
                industry: formData.industry,
                business_desc: formData.businessDescription,
                business_address: formData.businessAddress,
                operating_regions: formData.operatingRegions,
                tender_categories: formData.tenderCategories,
                budget_range: formData.budgetRange,
                notifications: formData.notifications,
                business_document_url: formData.businessDocumentUrl,
                onboarding_completed: false, // Stays false until admin approves
                account_status: 'pending', // Account pending admin review
                role: role,
                updated_at: new Date(),
            }

            // Check if profile exists, if not insert
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single()

            let error
            if (existingProfile) {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', user.id)
                error = updateError
            } else {
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert(updates)
                error = insertError
            }

            if (error) {
                console.error('Error saving profile:', error)
                // Check if error is due to missing table
                if (error.code === '42P01') {
                    toast.error('System config error: Profiles table missing. Please contact admin.')
                } else {
                    toast.error('Failed to save profile. Please try again.')
                }
            } else {
                toast.success('Profile setup complete!')
                navigateByRole(navigate)
            }
        } catch (err) {
            console.error('Onboarding Error:', err)
            toast.error('An unexpected error occurred.')
        } finally {
            setLoading(false)
        }
    }

    const renderStepIndicator = () => {
        return (
            <div className="w-full max-w-4xl mx-auto mb-8 px-4">
                <div className="flex items-center justify-between relative">
                    {/* Progress Bar Background */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded" />

                    {/* Active Progress Bar */}
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-lime-500 transition-all duration-300 -z-10 rounded"
                        style={{
                            width: `${((effectiveSteps.findIndex(s => s.id === currentStep)) / (effectiveSteps.length - 1)) * 100}%`
                        }}
                    />

                    {effectiveSteps.map((step, index) => {
                        const isActive = step.id === currentStep
                        const isCompleted = effectiveSteps.findIndex(s => s.id === currentStep) > index

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 bg-transparent">
                                <div
                                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 bg-white
                    ${isActive ? 'border-lime-500 text-lime-500 scale-110 shadow-lg' :
                                            isCompleted ? 'border-lime-500 bg-lime-500 text-white' : 'border-gray-300 text-gray-400'}
                  `}
                                >
                                    {isCompleted ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                                </div>
                                <span className={`text-xs font-medium hidden md:block ${isActive || isCompleted ? 'text-lime-600' : 'text-gray-400'}`}>
                                    {step.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: return <Step1Personal formData={formData} handleInputChange={handleInputChange} />
            case 2: return <Step2Business formData={formData} handleInputChange={handleInputChange} role={role} />
            case 3: return <Step3Location formData={formData} handleInputChange={handleInputChange} handleCheckboxChange={handleCheckboxChange} />
            case 4: return <Step4Interests formData={formData} handleInputChange={handleInputChange} handleCheckboxChange={handleCheckboxChange} />
            case 5: return <Step5Documents formData={formData} handleDocumentUpload={handleDocumentUpload} uploading={uploading} role={role} />
            case 6: return <Step7Notifications formData={formData} handleNotificationChange={handleNotificationChange} role={role} />
            case 7: return <Step8Subscription role={role} />
            case 8: return <Step9Welcome finishOnboarding={finishOnboarding} loading={loading} role={role} />
            default: return null
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10">

            {/* Header */}
            <div className="text-center mb-10 space-y-2">
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Welcome to MyTender</h1>
                <p className="text-lg text-gray-500">Let's set up your account to get you started</p>
            </div>

            {renderStepIndicator()}

            <Card className="w-full max-w-3xl mx-4 shadow-xl border-t-4 border-t-lime-500">
                <CardContent className="p-8">
                    {renderStepContent()}

                    {/* Navigation Buttons for all steps except the last Welcome step */}
                    {currentStep !== 8 && (
                        <div className="flex justify-between mt-10 pt-6 border-t">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={effectiveSteps.findIndex(s => s.id === currentStep) === 0}
                                className="flex items-center text-gray-600"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Previous
                            </Button>

                            <Button
                                onClick={handleNext}
                                className="bg-lime-500 hover:bg-lime-600 text-white px-8"
                            >
                                {effectiveSteps.findIndex(s => s.id === currentStep) === effectiveSteps.length - 2 ? 'Finish' : 'Next'}
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="mt-8 text-center text-sm text-gray-400">
                Step {effectiveSteps.findIndex(s => s.id === currentStep) + 1} of {effectiveSteps.length}
            </div>
        </div>
    )
}

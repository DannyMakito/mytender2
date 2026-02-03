import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconMapPin, IconTag, IconClock, IconSearch, IconUpload } from "@tabler/icons-react"
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import supabase from "../../../supabase-client.js"
import { useAuth } from "@/context/AuthContext"

const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
]

const CATEGORIES = [
  "Construction", "Transportation", "Professional Services",
  "Others", "Supplier", "Catering"
]

function daysUntil(dateStr) {
  const today = new Date()
  const then = new Date(dateStr + "T00:00:00")
  const diff = Math.ceil((then - today) / (1000 * 60 * 60 * 24))
  return diff
}

export default function Tender() {
  const navigate = useNavigate()
  const [tenders, setTenders] = useState([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { user, getMyProfile } = useAuth()
  const [accountStatus, setAccountStatus] = useState(null)

  const [form, setForm] = useState({
    title: "",
    description: "",
    province: "",
    budget: "",
    category: "",
    closingDate: "",
    document_url: "",
  })

  const [selectedFile, setSelectedFile] = useState(null)

  // Fetch tenders from Supabase
  useEffect(() => {
    if (user?.email) {
      fetchTenders()
      checkAccountStatus()
    }
  }, [user?.email])

  const checkAccountStatus = async () => {
    if (!user) return
    const result = await getMyProfile()
    console.log('Tender Check Status:', result)
    if (result.success) {
      setAccountStatus(result.profile?.account_status)
    }
  }

  const fetchTenders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .eq('posted_by', user?.email || '')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTenders(data || [])
    } catch (error) {
      console.error('Error fetching tenders:', error)
      alert('Failed to load tenders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const uploadDocument = async (file) => {
    if (!file) return null

    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `tender-documents/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('tender-documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('tender-documents')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    } finally {
      setUploading(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      return alert("Please provide a title")
    }
    if (!user?.email) {
      return alert("You must be logged in to create a tender")
    }

    try {
      setLoading(true)

      // Upload document if selected
      let documentUrl = form.document_url
      if (selectedFile) {
        documentUrl = await uploadDocument(selectedFile)
      }

      const newTender = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        province: form.province || null,
        budget: form.budget.trim() || null,
        category: form.category || null,
        closing_date: form.closingDate || null,
        document_url: documentUrl || null,
        posted_by: user.email,
        status: 'open',
      }

      let { data, error } = await supabase
        .from('tenders')
        .insert([newTender])
        .select()
        .single()

      // Attempt auto-fix for RLS error (missing/incorrect role)
      if (error && error.code === '42501') {
        console.log("RLS error detected. Attempting to repair user permissions...")
        try {
          const { error: roleError } = await supabase.rpc('insert_user_role', {
            p_user_email: user.email,
            p_role: 'client',
            p_user_id: user.id
          })

          if (!roleError) {
            // Retry insert after role fix
            const retry = await supabase
              .from('tenders')
              .insert([newTender])
              .select()
              .single()

            if (!retry.error) {
              error = null
              data = retry.data
              toast.success("User permissions repaired successfully")
            } else {
              error = retry.error
            }
          }
        } catch (err) {
          console.error("Failed to auto-repair role:", err)
        }
      }

      if (error) throw error

      // Refresh tenders list
      await fetchTenders()

      // Reset form
      setForm({
        title: "",
        description: "",
        province: "",
        budget: "",
        category: "",
        closingDate: "",
        document_url: "",
      })
      setSelectedFile(null)

      // Reset file input
      const fileInput = document.querySelector('input[type="file"]')
      if (fileInput) fileInput.value = ''

      // Show success toast
      toast.success('Tender created successfully!', {
        description: `${form.title} has been created and is now visible to bidders.`,
        duration: 5000,
      })

      // Close sheet/modal after successful creation
      setSheetOpen(false)
    } catch (error) {
      console.error('Error creating tender:', error)
      toast.error('Failed to create tender', {
        description: error.message,
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter tenders based on search query
  const filteredTenders = tenders.filter((t) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      t.title?.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.province?.toLowerCase().includes(query) ||
      t.budget?.toString().toLowerCase().includes(query) ||
      t.category?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="container mx-auto p-6">
      <div className="mb-">
        <h1 className="text-2xl font-bold">Create Tender</h1>
        <p className="text-muted-foregroun6d">Create a new tender — the card will appear below after creation.</p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground"><IconSearch className="size-4" /></span>
            <Input placeholder="Search tenders, departments, or keywords..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </div>
        {accountStatus === 'approved' ? (
          <Button onClick={() => setSheetOpen(true)}>Create Tender</Button>
        ) : (
          <Button
            variant="secondary"
            className="opacity-50 cursor-not-allowed"
            onClick={() => toast.error("Account Verification Required", {
              description: "Your account must be approved by an admin before you can create tenders. Please check your profile status."
            })}
          >
            Create Tender (Locked)
          </Button>
        )}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="w-full sm:w-3/4 sm:max-w-sm flex flex-col">


            <form onSubmit={handleCreate} className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <Input
                    placeholder="Enter tender title"
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full rounded-md border p-3 text-sm"
                    rows={6}
                    placeholder="Enter tender description"
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Budget</label>
                    <Input
                      placeholder="Enter budget amount"
                      value={form.budget}
                      onChange={(e) => update("budget", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Province</label>
                    <Select value={form.province} onValueChange={(value) => update("province", value)} required>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVINCES.map((province) => (
                          <SelectItem key={province} value={province}>
                            {province}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Select value={form.category} onValueChange={(value) => update("category", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Closing Date</label>
                  <input
                    type="date"
                    value={form.closingDate}
                    onChange={(e) => update("closingDate", e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Document</label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                      />
                      <div className="flex items-center gap-2 w-full rounded-md border px-3 py-2 hover:bg-accent cursor-pointer">
                        <IconUpload className="size-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {selectedFile ? selectedFile.name : "Upload document (PDF, DOC, XLS)"}
                        </span>
                      </div>
                    </label>
                    {selectedFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null)
                          const fileInput = document.querySelector('input[type="file"]')
                          if (fileInput) fileInput.value = ''
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || uploading}
                  >
                    {uploading ? 'Uploading...' : loading ? 'Creating...' : 'Create Tender'}
                  </Button>
                </div>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {loading && tenders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Loading tenders...</div>
      ) : filteredTenders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery ? 'No tenders found matching your search.' : 'No tenders created yet. Create your first tender above.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredTenders.map((t) => {
            const days = t.closing_date ? daysUntil(t.closing_date) : null
            const publishedDate = t.created_at ? new Date(t.created_at).toISOString().slice(0, 10) : ''
            return (
              <Card key={t.id} className="flex flex-col h-full border rounded-lg">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Company: {t.posted_by || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-green-50 text-green-700 px-2 py-1 text-xs font-medium border border-green-100 capitalize">{t.status}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardTitle className="font-semibold mb-2">{t.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mb-4">
                    {t.description && (
                      <p className="mb-2 line-clamp-2">{t.description}</p>
                    )}
                    <div className="flex flex-col gap-1 mb-2">
                      {t.province && (
                        <div className="flex items-center gap-2 text-sm">
                          <IconMapPin className="size-4 text-muted-foreground" />
                          {t.province}
                        </div>
                      )}
                      {t.budget && (
                        <div className="flex items-center gap-2 text-sm">
                          <IconTag className="size-4 text-muted-foreground" />
                          R{t.budget}
                        </div>
                      )}
                      {t.category && (
                        <div className="flex items-center gap-2 text-sm">
                          <IconTag className="size-4 text-muted-foreground" />
                          {t.category}
                        </div>
                      )}
                      {t.closing_date && (
                        <div className="flex items-center gap-2 text-sm">
                          <IconClock className="size-4 text-muted-foreground" />
                          {days !== null ? (days > 0 ? `Closes in ${days} days` : days === 0 ? "Closes today" : "Closed") : t.closing_date}
                        </div>
                      )}
                    </div>
                    <div className="text-orange-600 font-medium mt-2">
                      {days !== null && days > 0 && `CLOSES in ${days} days`}
                      {days === 0 && "CLOSES today"}
                      {days !== null && days < 0 && "CLOSED"}
                    </div>
                    {publishedDate && (
                      <div className="text-xs text-muted-foreground mt-2">Published {publishedDate}</div>
                    )}
                  </CardDescription>
                </CardContent>
                <CardFooter className="mt-4">
                  <div className="w-full flex flex-col gap-2">
                    {t.document_url && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(t.document_url, '_blank')}
                      >
                        View Document
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/tender/${t.id}/bids`)}
                    >
                      View Bids
                    </Button>
                    <Button className="w-full">View Details</Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

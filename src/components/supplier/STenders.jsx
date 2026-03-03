import React, { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import supabase from "../../../supabase-client"
import {
    IconSearch,
    IconFilter,
    IconCalendar,
    IconMapPin,
    IconFileDescription
} from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import { format } from "date-fns"

export default function STenders() {
    const [tenders, setTenders] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        fetchTenders()
    }, [])

    const fetchTenders = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('tenders')
                .select('*')
                .eq('tender_type', 'supplier')
                .eq('status', 'open')
                .order('created_at', { ascending: false })

            if (error) throw error
            setTenders(data || [])
        } catch (error) {
            console.error("Error fetching tenders:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredTenders = tenders.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quotation Tenders</h1>
                    <p className="text-muted-foreground">Find and bid on tenders requiring supplier quotations.</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder="Search tenders..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon">
                    <IconFilter className="h-4 w-4" />
                </Button>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse">
                            <div className="h-32 bg-muted rounded-t-lg" />
                            <CardContent className="p-6 space-y-4">
                                <div className="h-4 bg-muted w-3/4" />
                                <div className="h-4 bg-muted w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredTenders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-lg border border-dashed">
                    <IconFileDescription className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                    <h3 className="text-lg font-medium">No Tenders Found</h3>
                    <p className="text-muted-foreground">There are currently no open quotation tenders.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTenders.map(t => (
                        <Card key={t.id} className="flex flex-col hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="secondary">{t.category || "General"}</Badge>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <IconCalendar className="h-3 w-3 mr-1" />
                                        Ends {format(new Date(t.closing_date), 'MMM d, yyyy')}
                                    </div>
                                </div>
                                <CardTitle className="line-clamp-1">{t.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{t.description}</p>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <IconMapPin className="h-4 w-4 mr-1" />
                                    {t.province}
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 border-t mt-4 p-4">
                                <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
                                    <Link to={`/stenders/${t.id}`}>View Details & Bid</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

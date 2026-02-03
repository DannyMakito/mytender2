import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import supabase from '../../../supabase-client'
import {
    IconHash,
    IconSend,
    IconMenu2,
    IconArrowLeft,
    IconDotsVertical,
    IconFolder,
    IconPlus,
    IconUserCircle,
    IconChecks
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'

export default function TeamsPage() {
    const { user } = useAuth()
    const [projects, setProjects] = useState([])
    const [selectedProject, setSelectedProject] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [showChat, setShowChat] = useState(false) // For mobile view
    const [unreadCounts, setUnreadCounts] = useState({}) // { projectId: count }

    const messagesEndRef = useRef(null)
    const subscriptionsRef = useRef([])

    // Fetch Projects & Unread Counts
    useEffect(() => {
        if (user?.email) {
            fetchProjects()
            fetchUnreadCounts()
        }
    }, [user?.email])

    // Set up subscriptions when projects are loaded
    useEffect(() => {
        if (projects.length > 0) {
            setupSubscriptions()
        }
        return () => {
            // Cleanup all subs
            subscriptionsRef.current.forEach(sub => sub.unsubscribe())
            subscriptionsRef.current = []
        }
    }, [projects])

    // Handle Project Selection (Mark as Read)
    useEffect(() => {
        if (selectedProject) {
            fetchMessages(selectedProject.id)
            markMessagesAsRead(selectedProject.id)

            // Clear local unread count
            setUnreadCounts(prev => ({ ...prev, [selectedProject.id]: 0 }))

            if (window.innerWidth < 768) {
                setShowChat(true)
            }
        } else {
            setMessages([])
        }
    }, [selectedProject])

    const fetchProjects = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .or(`owner_email.eq.${user.email},winner_email.eq.${user.email}`)
                .order('updated_at', { ascending: false })

            if (error) throw error

            setProjects(data || [])
            // Note: We don't auto-select project anymore to allow seeing the dashboard of teams first, 
            // or we select first but then it marks as read immediately. 
            // Let's select first if available, same as before.
            if (data && data.length > 0 && !selectedProject) {
                // Determine which one to select? default first.
                // But maybe wait for user interaction? User asked for "Notification system", easier if they see the list.
                // Let's NOT auto-select if we want them to see badges. 
                // But previous code auto-selected. Let's keep auto-select off or selection logic simple.
                // Reverting to auto-select first for continuity, but this auto-reads the first project.
                setSelectedProject(data[0])
            }
        } catch (error) {
            console.error('Error fetching projects:', error)
            toast.error('Failed to load projects')
        } finally {
            setLoading(false)
        }
    }

    const fetchUnreadCounts = async () => {
        try {
            const { data, error } = await supabase.rpc('get_unread_counts', { p_user_email: user.email })
            if (error) throw error

            const counts = {}
            data.forEach(item => {
                counts[item.project_id] = item.count
            })
            setUnreadCounts(counts)
        } catch (error) {
            console.error('Error fetching unread counts:', error)
        }
    }

    const markMessagesAsRead = async (projectId) => {
        try {
            await supabase.rpc('mark_messages_read', {
                p_project_id: projectId,
                p_user_email: user.email
            })
            // Realtime update should handle the tick update in UI if we are listening
        } catch (error) {
            console.error('Error marking read:', error)
        }
    }

    const setupSubscriptions = () => {
        // Unsubscribe existing
        subscriptionsRef.current.forEach(sub => sub.unsubscribe())
        subscriptionsRef.current = []

        // Subscribe to EACH project channel
        projects.forEach(project => {
            const sub = supabase
                .channel(`public:messages:project_id=eq.${project.id}`)
                .on('postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages', filter: `project_id=eq.${project.id}` },
                    (payload) => {
                        handleIncomingMessage(payload.new, project.id)
                    }
                )
                .on('postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'messages', filter: `project_id=eq.${project.id}` },
                    (payload) => {
                        handleMessageUpdate(payload.new, project.id)
                    }
                )
                .subscribe()

            subscriptionsRef.current.push(sub)
        })
    }

    const handleIncomingMessage = (newMessage, projectId) => {
        // If it's the currently selected project
        if (selectedProject?.id === projectId) {
            setMessages(prev => {
                if (prev.some(msg => msg.id === newMessage.id)) return prev
                return [...prev, newMessage]
            })
            scrollToBottom()

            // Mark as read immediately since we are viewing it
            if (newMessage.sender_email !== user.email) {
                markMessagesAsRead(projectId)
            }
        } else {
            // Otherwise increment badge
            if (newMessage.sender_email !== user.email) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [projectId]: (prev[projectId] || 0) + 1
                }))
                toast.info(`New message in team`)
            }
        }
    }

    const handleMessageUpdate = (updatedMessage, projectId) => {
        // If we are looking at this project, update the message in list (e.g. read status changed)
        if (selectedProject?.id === projectId) {
            setMessages(prev => prev.map(msg =>
                msg.id === updatedMessage.id ? updatedMessage : msg
            ))
        }
    }

    const fetchMessages = async (projectId) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: true })

            if (error) throw error

            setMessages(data || [])
            scrollToBottom()
        } catch (error) {
            console.error('Error fetching messages:', error)
        }
    }

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedProject) return

        const content = newMessage.trim()
        setNewMessage('')

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    project_id: selectedProject.id,
                    content: content,
                    sender_email: user.email,
                    sender_name: user.user_metadata?.full_name || user.email.split('@')[0],
                    read_by: []
                })
                .select()
                .single()

            if (error) throw error

            setMessages(prev => [...prev, data])
            scrollToBottom()
        } catch (error) {
            console.error('Error sending message:', error)
            toast.error('Failed to send message')
            setNewMessage(content)
        }
    }

    const getInitials = (name) => {
        return name ? name.substring(0, 2).toUpperCase() : '??'
    }

    // Helper to render ticks
    // Status: 
    // - Sent (1 Tick) -> Optimistic only (not implemented fully here, assuming save is fast)
    // - Delivered (2 Grey Ticks) -> Saved in DB
    // - Read (2 Blue Ticks) -> read_by contains someone else
    const RenderTicks = ({ message }) => {
        // Only show for my messages
        if (message.sender_email !== user.email) return null

        const isRead = message.read_by && message.read_by.length > 0
            ? message.read_by.some(email => email !== user.email)
            : false

        // Simulating: If message matches our optimistic state we might show 1 tick, 
        // but here we only have synced messages so they are at least 'Delivered'.
        // So always show 2 checks, color depends on read.

        return (
            <div className={`flex items-center ml-1 ${isRead ? 'text-blue-500' : 'text-gray-400'}`}>
                <IconChecks className="size-4" />
            </div>
        )
    }

    // Render empty state if no projects
    if (!loading && projects.length === 0) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg border border-dashed">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <IconFolder className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No Projects Found</h2>
                <p className="text-muted-foreground max-w-sm mb-6">
                    You need to be part of a project (either as a client or a winner) to access Teams.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.20))] md:h-[calc(100vh-theme(spacing.12))] -my-4 -mx-4 md:m-0 rounded-none md:rounded-lg overflow-hidden border bg-background">
            <div className="flex flex-1 overflow-hidden relative">

                {/* Sidebar (Projects List) */}
                <div className={`
          absolute inset-0 z-20 flex w-full md:relative md:w-80 flex-col bg-muted/20 border-r
          transition-transform duration-300 ease-in-out md:translate-x-0
          ${showChat ? '-translate-x-full md:transform-none' : 'translate-x-0'}
        `}>
                    {/* Projects Header */}
                    <div className="p-4 border-b bg-background/50 backdrop-blur-sm">
                        <h2 className="font-semibold px-2 mb-2 text-sm text-muted-foreground uppercase tracking-wider">Your Teams</h2>
                    </div>

                    {/* Projects List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                        {projects.map(project => (
                            <button
                                key={project.id}
                                onClick={() => setSelectedProject(project)}
                                className={`w-full flex items-center gap-3 p-3 rounded-md transition-colors text-left border relative
                    ${selectedProject?.id === project.id ? 'bg-background border-primary/50 shadow-sm' : 'bg-background hover:bg-muted border-transparent'}
                  `}
                            >
                                <div className={`p-2 rounded-md ${selectedProject?.id === project.id ? 'bg-primary/20 text-primary' : 'bg-muted'}`}>
                                    <IconFolder className="size-5" />
                                </div>
                                <div className="flex flex-col overflow-hidden flex-1">
                                    <span className="font-medium truncate">{project.name}</span>
                                    <span className="text-xs text-muted-foreground truncate">
                                        {project.owner_email === user.email ? 'Owner' : 'Member'}
                                    </span>
                                </div>

                                {/* Unread Badge */}
                                {unreadCounts[project.id] > 0 && (
                                    <div className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center">
                                        {unreadCounts[project.id]}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`
          absolute inset-0 z-10 flex flex-col w-full bg-background transition-transform duration-300 ease-in-out md:relative md:transform-none
          ${showChat ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
                    {/* Top Bar */}
                    <div className="flex items-center gap-3 p-4 border-b h-16 shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={() => setShowChat(false)}>
                            <IconArrowLeft className="size-5" />
                        </Button>

                        {selectedProject ? (
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-primary/10 rounded-md">
                                    <IconHash className="size-4 text-primary" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-sm">{selectedProject.name}</h2>
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                        {[selectedProject.owner_email, selectedProject.winner_email]
                                            .filter(Boolean)
                                            .map(email => email.split('@')[0])
                                            .join(', ')}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-muted-foreground">Select a team to start chatting</div>
                        )}

                        <div className="ml-auto">
                            <Button variant="ghost" size="icon">
                                <IconDotsVertical className="size-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {messages.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground p-8 opacity-50">
                                <IconHash className="h-12 w-12 mb-2" />
                                <p>No messages yet.</p>
                                <p className="text-sm">Start the conversation with your team!</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                const isMe = msg.sender_email === user?.email
                                const showAvatar = index === 0 || messages[index - 1].sender_email !== msg.sender_email

                                return (
                                    <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`flex-shrink-0 w-8 ${!showAvatar ? 'invisible' : ''}`}>
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={`https://avatar.vercel.sh/${msg.sender_email}`} />
                                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                    {getInitials(msg.sender_email || 'User')}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>

                                        <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                                            {showAvatar && (
                                                <span className="text-xs text-muted-foreground mb-1 ml-1 mr-1">
                                                    {msg.sender_email.split('@')[0]}
                                                    <span className="mx-1">•</span>
                                                    {format(new Date(msg.created_at), 'h:mm a')}
                                                </span>
                                            )}
                                            <div className={`
                          px-4 py-2 rounded-2xl text-sm shadow-sm flex items-end gap-2
                          ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-white border rounded-tl-none'}
                        `}>
                                                <span>{msg.content}</span>
                                                {isMe && <RenderTicks message={msg} />}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-background border-t">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={`Message ${selectedProject?.name || 'team'}...`}
                                className="flex-1"
                                disabled={!selectedProject}
                                autoComplete="off"
                            />
                            <Button type="submit" disabled={!selectedProject || !newMessage.trim()} size="icon">
                                <IconSend className="size-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

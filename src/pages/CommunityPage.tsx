import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { 
  MessageSquare, 
  Users, 
  Plus, 
  Search,
  Pin,
  Lock,
  MessageCircle,
  Clock,
  User,
  Crown,
  Shield,
  Loader2,
  Send
} from 'lucide-react'
import blink from '../lib/blink'

interface User {
  id: string
  email: string
  displayName?: string
  role: string
}

interface ForumCategory {
  id: string
  name: string
  description: string
  isHostOnly: boolean
  sortOrder: number
  createdAt: string
}

interface ForumThread {
  id: string
  categoryId: string
  title: string
  authorId: string
  isPinned: boolean
  isLocked: boolean
  replyCount: number
  lastReplyAt?: string
  createdAt: string
}

interface ForumPost {
  id: string
  threadId: string
  authorId: string
  content: string
  isFirstPost: boolean
  createdAt: string
  updatedAt: string
}

export default function CommunityPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [threads, setThreads] = useState<ForumThread[]>([])
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false)
  const [newThreadTitle, setNewThreadTitle] = useState('')
  const [newThreadContent, setNewThreadContent] = useState('')
  const [newThreadCategory, setNewThreadCategory] = useState<string>('')
  const [newReplyContent, setNewReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      loadThreads(selectedCategory)
    }
  }, [selectedCategory])

  useEffect(() => {
    if (selectedThread) {
      loadPosts(selectedThread.id)
    }
  }, [selectedThread])

  useEffect(() => {
    if (showNewThreadDialog) {
      const defaultCat = selectedCategory || categories[0]?.id || ''
      setNewThreadCategory(defaultCat)
    }
  }, [showNewThreadDialog, selectedCategory, categories])

  const loadCategories = async () => {
    try {
      const allCategories = await blink.db.forumCategories.list({
        orderBy: { sortOrder: 'asc' }
      })
      setCategories(allCategories)
      if (allCategories.length > 0) {
        setSelectedCategory(allCategories[0].id)
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const loadThreads = async (categoryId: string) => {
    try {
      const categoryThreads = await blink.db.forumThreads.list({
        where: { categoryId },
        orderBy: { isPinned: 'desc', lastReplyAt: 'desc' },
        limit: 50
      })
      setThreads(categoryThreads)
      setSelectedThread(null)
    } catch (error) {
      console.error('Failed to load threads:', error)
    }
  }

  const loadPosts = async (threadId: string) => {
    try {
      const threadPosts = await blink.db.forumPosts.list({
        where: { threadId },
        orderBy: { createdAt: 'asc' }
      })
      setPosts(threadPosts)
    } catch (error) {
      console.error('Failed to load posts:', error)
    }
  }

  const createThread = async () => {
    if (!user || !newThreadTitle.trim() || !newThreadContent.trim()) return

    setSubmitting(true)
    try {
      // Validate category before creating thread to avoid FK constraint failures
      const categoryToUse = newThreadCategory || selectedCategory || categories[0]?.id
      if (!categoryToUse || !categories.find(c => c.id === categoryToUse)) {
        throw new Error('Please choose a valid category before creating a thread.')
      }

      // Create thread
      const thread = await blink.db.forumThreads.create({
        categoryId: categoryToUse,
        title: newThreadTitle.trim(),
        authorId: user.id,
        isPinned: false,
        isLocked: false,
        replyCount: 0
      })

      // Create first post
      await blink.db.forumPosts.create({
        threadId: thread.id,
        authorId: user.id,
        content: newThreadContent.trim(),
        isFirstPost: true
      })

      // Refresh threads
      loadThreads(selectedCategory)
      
      // Reset form
      setNewThreadTitle('')
      setNewThreadContent('')
      setNewThreadCategory('')
      setShowNewThreadDialog(false)
    } catch (error) {
      console.error('Failed to create thread:', error)
      const message = (error as any)?.message || 'Failed to create thread. Please try again.'
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  const createReply = async () => {
    if (!user || !selectedThread || !newReplyContent.trim()) return

    setSubmitting(true)
    try {
      // Create reply
      await blink.db.forumPosts.create({
        threadId: selectedThread.id,
        authorId: user.id,
        content: newReplyContent.trim(),
        isFirstPost: false
      })

      // Update thread reply count and last reply time
      await blink.db.forumThreads.update(selectedThread.id, {
        replyCount: selectedThread.replyCount + 1,
        lastReplyAt: new Date().toISOString()
      })

      // Refresh posts and threads
      loadPosts(selectedThread.id)
      loadThreads(selectedCategory)
      
      // Reset form
      setNewReplyContent('')
    } catch (error) {
      console.error('Failed to create reply:', error)
      alert('Failed to create reply. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'host':
        return <Shield className="w-4 h-4 text-blue-500" />
      default:
        return <User className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'host':
        return 'Host'
      default:
        return 'Participant'
    }
  }

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background sdg-theme-16">
      {/* Hero Section */}
      <section className="relative py-20 hero-pattern">
        <div className="absolute inset-0 bg-background/80 -z-10" />
        {/* Hero kept clean per original style (no decorative overlays) */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
            <Users className="w-4 h-4 mr-2" />
            Global Community
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Community <span className="text-primary-solid">Forum</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Connect with hosts and participants worldwide. Share experiences, ask questions, 
            and collaborate on solutions for the Global Goals.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {category.name}
                    {category.isHostOnly && (
                      <Lock className="w-3 h-3 ml-auto" />
                    )}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!selectedThread ? (
              /* Thread List */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {categories.find(c => c.id === selectedCategory)?.name}
                    </h2>
                    <p className="text-muted-foreground">
                      {categories.find(c => c.id === selectedCategory)?.description}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search threads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    
                    {user && (
                      <Dialog open={showNewThreadDialog} onOpenChange={setShowNewThreadDialog}>
                        <DialogTrigger asChild>
                          <Button className="bg-primary-solid text-white hover:bg-primary/90">
                            <Plus className="w-4 h-4 mr-2" />
                            New Thread
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Thread</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="title">Thread Title</Label>
                              <Input
                                id="title"
                                value={newThreadTitle}
                                onChange={(e) => setNewThreadTitle(e.target.value)}
                                placeholder="Enter thread title..."
                              />
                            </div>
                            <div>
                              <Label htmlFor="content">Content</Label>
                              <Textarea
                                id="content"
                                value={newThreadContent}
                                onChange={(e) => setNewThreadContent(e.target.value)}
                                placeholder="Write your post content..."
                                className="min-h-[120px]"
                              />
                            </div>
                            <div>
                              <Label htmlFor="category">Category</Label>
                              <Select value={newThreadCategory} onValueChange={(val) => setNewThreadCategory(val)}>
                                <SelectTrigger id="category" className="w-full">
                                  <SelectValue placeholder="Choose a category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" onClick={() => setShowNewThreadDialog(false)}>
                                Cancel
                              </Button>
                              <Button 
                                onClick={createThread}
                                disabled={submitting || !newThreadTitle.trim() || !newThreadContent.trim() || !newThreadCategory}
                                className="bg-primary-solid text-white hover:bg-primary/90"
                              >
                                {submitting ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                  </>
                                ) : (
                                  'Create Thread'
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredThreads.map((thread) => (
                    <Card 
                      key={thread.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedThread(thread)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {thread.isPinned && (
                                <Pin className="w-4 h-4 text-primary" />
                              )}
                              {thread.isLocked && (
                                <Lock className="w-4 h-4 text-muted-foreground" />
                              )}
                              <h3 className="font-semibold text-foreground hover:text-primary">
                                {thread.title}
                              </h3>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                {thread.replyCount} replies
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDate(thread.lastReplyAt || thread.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredThreads.length === 0 && (
                    <Card>
                      <CardContent className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No threads found</h3>
                        <p className="text-muted-foreground mb-4">
                          {searchTerm 
                            ? 'Try adjusting your search terms.'
                            : 'Be the first to start a discussion in this category!'}
                        </p>
                        {user && !searchTerm && (
                          <Button 
                            onClick={() => setShowNewThreadDialog(true)}
                            className="bg-primary-solid text-white hover:bg-primary/90"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Start Discussion
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ) : (
              /* Thread View */
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => setSelectedThread(null)}>
                    ← Back to Threads
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{selectedThread.title}</h2>
                    <p className="text-muted-foreground">
                      {selectedThread.replyCount} replies • Created {formatDate(selectedThread.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {posts.map((post, index) => (
                    <Card key={post.id}>
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-primary-solid/10 rounded-full flex items-center justify-center">
                              {getRoleIcon('participant')}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">User</span>
                              <Badge variant="outline" className="text-xs">
                                {getRoleLabel('participant')}
                              </Badge>
                              {post.isFirstPost && (
                                <Badge variant="secondary" className="text-xs">
                                  Original Post
                                </Badge>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {formatDate(post.createdAt)}
                              </span>
                            </div>
                            <div className="prose max-w-none">
                              <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Reply Form */}
                {user && !selectedThread.isLocked && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reply to Thread</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Textarea
                          value={newReplyContent}
                          onChange={(e) => setNewReplyContent(e.target.value)}
                          placeholder="Write your reply..."
                          className="min-h-[120px]"
                        />
                        <div className="flex justify-end">
                          <Button 
                            onClick={createReply}
                            disabled={submitting || !newReplyContent.trim()}
                            className="bg-primary-solid text-white hover:bg-primary/90"
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Posting...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Post Reply
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!user && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        Continue with Email to participate in the discussion
                      </p>
                      <Button onClick={() => {
                        const redirectUrl = window.location.href
                        window.location.href = `/sign-in?redirect=${encodeURIComponent(redirectUrl)}`
                      }}>
                        Continue with Email
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
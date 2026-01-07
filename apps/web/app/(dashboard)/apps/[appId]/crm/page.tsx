'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Users, Plus, Search, Edit, Trash2, Mail, Phone, Building, MapPin,
  Calendar, DollarSign, TrendingUp, MoreHorizontal, Filter, RefreshCw,
  UserPlus, Briefcase, Target, ArrowRight, Clock, CheckCircle, XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
  job_title: string
  status: 'lead' | 'prospect' | 'customer' | 'churned'
  source: string
  tags: string[]
  notes: string
  created_at: string
  last_contacted: string
}

interface Deal {
  id: string
  title: string
  value: number
  stage: string
  contact_id: string
  contact_name: string
  probability: number
  expected_close: string
  created_at: string
}

interface Activity {
  id: string
  type: 'call' | 'email' | 'meeting' | 'note' | 'task'
  title: string
  description: string
  contact_id: string
  contact_name: string
  completed: boolean
  due_date: string
  created_at: string
}

const PIPELINE_STAGES = [
  { id: 'lead', name: 'Lead', color: 'bg-slate-100' },
  { id: 'qualified', name: 'Qualified', color: 'bg-blue-100' },
  { id: 'proposal', name: 'Proposal', color: 'bg-yellow-100' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-purple-100' },
  { id: 'closed_won', name: 'Closed Won', color: 'bg-green-100' },
  { id: 'closed_lost', name: 'Closed Lost', color: 'bg-red-100' }
]

export default function CRMPage() {
  const params = useParams()
  const appId = params.appId as string
  
  const [activeTab, setActiveTab] = useState('contacts')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [showDealDialog, setShowDealDialog] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [stats, setStats] = useState<any>(null)

  const [contactForm, setContactForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    status: 'lead' as const,
    source: '',
    notes: ''
  })

  const [dealForm, setDealForm] = useState({
    title: '',
    value: 0,
    stage: 'lead',
    contact_id: '',
    probability: 20,
    expected_close: ''
  })

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [contactsRes, dealsRes, activitiesRes, statsRes] = await Promise.all([
        apiClient.get(`/apps/${appId}/crm/contacts`),
        apiClient.get(`/apps/${appId}/crm/deals`),
        apiClient.get(`/apps/${appId}/crm/activities`),
        apiClient.get(`/apps/${appId}/crm/stats`)
      ])
      setContacts(contactsRes.data.contacts || [])
      setDeals(dealsRes.data.deals || [])
      setActivities(activitiesRes.data.activities || [])
      setStats(statsRes.data)
    } catch (error) {
      console.error('Failed to fetch CRM data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [appId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreateContact = async () => {
    try {
      await apiClient.post(`/apps/${appId}/crm/contacts`, contactForm)
      setShowContactDialog(false)
      resetContactForm()
      fetchData()
    } catch (error) {
      console.error('Failed to create contact:', error)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    try {
      await apiClient.delete(`/apps/${appId}/crm/contacts/${contactId}`)
      fetchData()
    } catch (error) {
      console.error('Failed to delete contact:', error)
    }
  }

  const handleCreateDeal = async () => {
    try {
      await apiClient.post(`/apps/${appId}/crm/deals`, dealForm)
      setShowDealDialog(false)
      resetDealForm()
      fetchData()
    } catch (error) {
      console.error('Failed to create deal:', error)
    }
  }

  const resetContactForm = () => {
    setContactForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: '',
      job_title: '',
      status: 'lead',
      source: '',
      notes: ''
    })
  }

  const resetDealForm = () => {
    setDealForm({
      title: '',
      value: 0,
      stage: 'lead',
      contact_id: '',
      probability: 20,
      expected_close: ''
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead': return 'bg-blue-100 text-blue-700'
      case 'prospect': return 'bg-yellow-100 text-yellow-700'
      case 'customer': return 'bg-green-100 text-green-700'
      case 'churned': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredContacts = contacts.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase())
  )

  const dealsByStage = PIPELINE_STAGES.map(stage => ({
    ...stage,
    deals: deals.filter(d => d.stage === stage.id),
    total: deals.filter(d => d.stage === stage.id).reduce((sum, d) => sum + d.value, 0)
  }))

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CRM</h1>
          <p className="text-muted-foreground">Manage contacts, deals, and activities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDealDialog(true)}>
            <Target className="w-4 h-4 mr-2" />
            Add Deal
          </Button>
          <Button onClick={() => { resetContactForm(); setEditingContact(null); setShowContactDialog(true) }}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_contacts || 0}</p>
                <p className="text-xs text-muted-foreground">Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.open_deals || 0}</p>
                <p className="text-xs text-muted-foreground">Open Deals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats?.pipeline_value?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">Pipeline Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.conversion_rate || 0}%</p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map(contact => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{contact.first_name[0]}{contact.last_name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                        <p className="text-xs text-muted-foreground">{contact.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{contact.company}</p>
                      <p className="text-xs text-muted-foreground">{contact.job_title}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(contact.status)}>{contact.status}</Badge>
                  </TableCell>
                  <TableCell>{contact.source}</TableCell>
                  <TableCell>{contact.last_contacted ? new Date(contact.last_contacted).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Add Deal</DropdownMenuItem>
                          <DropdownMenuItem>Log Activity</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteContact(contact.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {dealsByStage.map(stage => (
              <div key={stage.id} className="flex-shrink-0 w-72">
                <div className={cn("p-3 rounded-t-lg", stage.color)}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{stage.name}</h3>
                    <Badge variant="secondary">{stage.deals.length}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">${stage.total.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-b-lg min-h-[400px] space-y-2">
                  {stage.deals.map(deal => (
                    <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <h4 className="font-medium">{deal.title}</h4>
                        <p className="text-sm text-muted-foreground">{deal.contact_name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-semibold text-green-600">${deal.value.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button variant="ghost" className="w-full border-2 border-dashed" onClick={() => setShowDealDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Deal
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deals" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Probability</TableHead>
                <TableHead>Expected Close</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map(deal => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">{deal.title}</TableCell>
                  <TableCell>{deal.contact_name}</TableCell>
                  <TableCell className="font-semibold text-green-600">${deal.value.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{PIPELINE_STAGES.find(s => s.id === deal.stage)?.name}</Badge>
                  </TableCell>
                  <TableCell>{deal.probability}%</TableCell>
                  <TableCell>{deal.expected_close ? new Date(deal.expected_close).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <div className="space-y-3">
            {activities.map(activity => (
              <Card key={activity.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-2 rounded-lg",
                      activity.completed ? "bg-green-100" : "bg-slate-100"
                    )}>
                      {activity.type === 'call' && <Phone className="w-4 h-4" />}
                      {activity.type === 'email' && <Mail className="w-4 h-4" />}
                      {activity.type === 'meeting' && <Calendar className="w-4 h-4" />}
                      {activity.type === 'task' && <CheckCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{activity.title}</h4>
                        <Badge variant={activity.completed ? "default" : "secondary"}>
                          {activity.completed ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{activity.contact_name}</span>
                        <span>•</span>
                        <span>{new Date(activity.due_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={contactForm.first_name}
                  onChange={(e) => setContactForm({ ...contactForm, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={contactForm.last_name}
                  onChange={(e) => setContactForm({ ...contactForm, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={contactForm.company}
                  onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  value={contactForm.job_title}
                  onChange={(e) => setContactForm({ ...contactForm, job_title: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={contactForm.status} onValueChange={(v: any) => setContactForm({ ...contactForm, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="churned">Churned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Input
                  value={contactForm.source}
                  onChange={(e) => setContactForm({ ...contactForm, source: e.target.value })}
                  placeholder="e.g., Website, Referral"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={contactForm.notes}
                onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateContact}>
              {editingContact ? 'Update' : 'Create'} Contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deal Dialog */}
      <Dialog open={showDealDialog} onOpenChange={setShowDealDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Deal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Deal Title</Label>
              <Input
                value={dealForm.title}
                onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                placeholder="e.g., Enterprise License"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  type="number"
                  value={dealForm.value}
                  onChange={(e) => setDealForm({ ...dealForm, value: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Probability (%)</Label>
                <Input
                  type="number"
                  value={dealForm.probability}
                  onChange={(e) => setDealForm({ ...dealForm, probability: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contact</Label>
              <Select value={dealForm.contact_id} onValueChange={(v) => setDealForm({ ...dealForm, contact_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select value={dealForm.stage} onValueChange={(v) => setDealForm({ ...dealForm, stage: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPELINE_STAGES.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Close</Label>
                <Input
                  type="date"
                  value={dealForm.expected_close}
                  onChange={(e) => setDealForm({ ...dealForm, expected_close: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDealDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateDeal}>Create Deal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { m } from 'framer-motion'
import {
  Plus,
  Database,
  Table,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Users,
  Calendar,
  Tag,
  Hash,
  Type,
  ToggleLeft
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const COLLECTIONS = [
  {
    id: 1,
    name: 'Products',
    description: 'E-commerce product catalog',
    records: 1247,
    fields: 12,
    lastUpdated: '2 hours ago',
    icon: Database,
    color: 'bg-blue-500'
  },
  {
    id: 2,
    name: 'Blog Posts',
    description: 'Content management for blog',
    records: 89,
    fields: 8,
    lastUpdated: '5 hours ago',
    icon: Type,
    color: 'bg-green-500'
  },
  {
    id: 3,
    name: 'Customers',
    description: 'Customer database',
    records: 2156,
    fields: 15,
    lastUpdated: '1 day ago',
    icon: Users,
    color: 'bg-purple-500'
  },
  {
    id: 4,
    name: 'Events',
    description: 'Event management system',
    records: 45,
    fields: 10,
    lastUpdated: '3 days ago',
    icon: Calendar,
    color: 'bg-orange-500'
  }
]

const FIELD_TYPES = [
  { type: 'text', icon: Type, label: 'Text' },
  { type: 'number', icon: Hash, label: 'Number' },
  { type: 'date', icon: Calendar, label: 'Date' },
  { type: 'boolean', icon: ToggleLeft, label: 'Boolean' },
  { type: 'select', icon: Tag, label: 'Select' },
  { type: 'user', icon: Users, label: 'User' }
]

const STATS = [
  { label: 'Total Collections', value: '12', icon: Database, color: 'bg-blue-500' },
  { label: 'Total Records', value: '15.2K', icon: Table, color: 'bg-green-500' },
  { label: 'API Calls', value: '2.4K', icon: Upload, color: 'bg-purple-500' },
  { label: 'Storage Used', value: '245 MB', icon: Download, color: 'bg-orange-500' }
]

export default function CollectionsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage custom databases for your applications
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/collections/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Collection
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat, i) => (
          <m.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </m.div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {COLLECTIONS.map((collection, index) => {
          const Icon = collection.icon
          return (
            <m.div
              key={collection.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300 group cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 ${collection.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Records
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Schema
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Export Data
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div>
                    <CardTitle className="text-xl">{collection.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {collection.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Records</span>
                      <Badge variant="outline">{collection.records.toLocaleString()}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Fields</span>
                      <Badge variant="outline">{collection.fields}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span className="text-muted-foreground">{collection.lastUpdated}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Button size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      View Data
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </m.div>
          )
        })}
      </div>

      {/* Quick Start Guide */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Getting Started with Collections</CardTitle>
          <CardDescription>
            Collections are custom databases that you can create to store and manage data for your applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Available Field Types</h4>
              <div className="space-y-2">
                {FIELD_TYPES.map((fieldType) => {
                  const Icon = fieldType.icon
                  return (
                    <div key={fieldType.type} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">{fieldType.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Common Use Cases</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>• Product catalogs for e-commerce</div>
                <div>• Blog posts and content management</div>
                <div>• Customer and user databases</div>
                <div>• Event and booking systems</div>
                <div>• Inventory management</div>
                <div>• Form submissions and surveys</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
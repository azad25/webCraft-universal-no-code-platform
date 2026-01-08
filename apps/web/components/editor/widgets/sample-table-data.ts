// Sample data for table widget demonstrations

export const sampleUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Admin',
    status: 'active',
    created_at: '2024-01-15T10:30:00Z',
    last_login: '2024-01-20T14:22:00Z',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'Editor',
    status: 'active',
    created_at: '2024-01-14T09:15:00Z',
    last_login: '2024-01-20T11:45:00Z',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    role: 'User',
    status: 'inactive',
    created_at: '2024-01-13T16:45:00Z',
    last_login: '2024-01-18T08:30:00Z',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face'
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice.brown@example.com',
    role: 'Editor',
    status: 'pending',
    created_at: '2024-01-12T12:00:00Z',
    last_login: null,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face'
  },
  {
    id: '5',
    name: 'Charlie Wilson',
    email: 'charlie.wilson@example.com',
    role: 'User',
    status: 'active',
    created_at: '2024-01-11T14:30:00Z',
    last_login: '2024-01-19T16:20:00Z',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face'
  }
]

export const sampleProducts = [
  {
    id: '1',
    name: 'Wireless Headphones',
    price: 99.99,
    currency: '$',
    category: 'Electronics',
    status: 'available',
    stock: 45,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=64&h=64&fit=crop',
    description: 'High-quality wireless headphones with noise cancellation'
  },
  {
    id: '2',
    name: 'Smart Watch',
    price: 299.99,
    currency: '$',
    category: 'Electronics',
    status: 'available',
    stock: 23,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=64&h=64&fit=crop',
    description: 'Feature-rich smartwatch with health monitoring'
  },
  {
    id: '3',
    name: 'Coffee Maker',
    price: 149.99,
    currency: '$',
    category: 'Appliances',
    status: 'low_stock',
    stock: 3,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=64&h=64&fit=crop',
    description: 'Programmable coffee maker with thermal carafe'
  },
  {
    id: '4',
    name: 'Desk Lamp',
    price: 79.99,
    currency: '$',
    category: 'Furniture',
    status: 'out_of_stock',
    stock: 0,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop',
    description: 'Modern LED desk lamp with adjustable brightness'
  },
  {
    id: '5',
    name: 'Bluetooth Speaker',
    price: 59.99,
    currency: '$',
    category: 'Electronics',
    status: 'available',
    stock: 67,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=64&h=64&fit=crop',
    description: 'Portable Bluetooth speaker with excellent sound quality'
  }
]

export const sampleOrders = [
  {
    id: 'ORD-001',
    customer: 'John Doe',
    customer_email: 'john.doe@example.com',
    total: 299.99,
    currency: '$',
    status: 'completed',
    date: '2024-01-20T10:30:00Z',
    items: 2,
    shipping_address: '123 Main St, City, State 12345'
  },
  {
    id: 'ORD-002',
    customer: 'Jane Smith',
    customer_email: 'jane.smith@example.com',
    total: 149.99,
    currency: '$',
    status: 'processing',
    date: '2024-01-19T14:22:00Z',
    items: 1,
    shipping_address: '456 Oak Ave, City, State 12345'
  },
  {
    id: 'ORD-003',
    customer: 'Bob Johnson',
    customer_email: 'bob.johnson@example.com',
    total: 79.99,
    currency: '$',
    status: 'shipped',
    date: '2024-01-18T09:15:00Z',
    items: 1,
    shipping_address: '789 Pine St, City, State 12345'
  },
  {
    id: 'ORD-004',
    customer: 'Alice Brown',
    customer_email: 'alice.brown@example.com',
    total: 459.97,
    currency: '$',
    status: 'pending',
    date: '2024-01-17T16:45:00Z',
    items: 3,
    shipping_address: '321 Elm St, City, State 12345'
  }
]

export const userColumns = [
  { id: '1', key: 'avatar', label: 'Avatar', type: 'image' as const, sortable: false, filterable: false, visible: true, width: '60px', align: 'center' as const },
  { id: '2', key: 'name', label: 'Name', type: 'text' as const, sortable: true, filterable: true, visible: true },
  { id: '3', key: 'email', label: 'Email', type: 'text' as const, sortable: true, filterable: true, visible: true },
  { id: '4', key: 'role', label: 'Role', type: 'badge' as const, sortable: true, filterable: true, visible: true },
  { id: '5', key: 'status', label: 'Status', type: 'badge' as const, sortable: true, filterable: true, visible: true },
  { id: '6', key: 'created_at', label: 'Created', type: 'date' as const, sortable: true, filterable: false, visible: true },
  { id: '7', key: 'actions', label: 'Actions', type: 'actions' as const, sortable: false, filterable: false, visible: true, width: '120px' }
]

export const productColumns = [
  { id: '1', key: 'image', label: 'Image', type: 'image' as const, sortable: false, filterable: false, visible: true, width: '80px', align: 'center' as const },
  { id: '2', key: 'name', label: 'Product Name', type: 'text' as const, sortable: true, filterable: true, visible: true },
  { id: '3', key: 'price', label: 'Price', type: 'number' as const, sortable: true, filterable: false, visible: true, align: 'right' as const },
  { id: '4', key: 'category', label: 'Category', type: 'badge' as const, sortable: true, filterable: true, visible: true },
  { id: '5', key: 'status', label: 'Status', type: 'badge' as const, sortable: true, filterable: true, visible: true },
  { id: '6', key: 'stock', label: 'Stock', type: 'number' as const, sortable: true, filterable: false, visible: true, align: 'right' as const },
  { id: '7', key: 'actions', label: 'Actions', type: 'actions' as const, sortable: false, filterable: false, visible: true, width: '120px' }
]

export const orderColumns = [
  { id: '1', key: 'id', label: 'Order ID', type: 'text' as const, sortable: true, filterable: true, visible: true },
  { id: '2', key: 'customer', label: 'Customer', type: 'text' as const, sortable: true, filterable: true, visible: true },
  { id: '3', key: 'total', label: 'Total', type: 'number' as const, sortable: true, filterable: false, visible: true, align: 'right' as const },
  { id: '4', key: 'status', label: 'Status', type: 'badge' as const, sortable: true, filterable: true, visible: true },
  { id: '5', key: 'date', label: 'Date', type: 'date' as const, sortable: true, filterable: false, visible: true },
  { id: '6', key: 'items', label: 'Items', type: 'number' as const, sortable: true, filterable: false, visible: true, align: 'center' as const },
  { id: '7', key: 'actions', label: 'Actions', type: 'actions' as const, sortable: false, filterable: false, visible: true, width: '120px' }
]

export const defaultTableActions = [
  { id: '1', label: 'View', icon: 'eye', variant: 'ghost' as const, onClick: 'console.log("View", row)' },
  { id: '2', label: 'Edit', icon: 'edit', variant: 'ghost' as const, onClick: 'console.log("Edit", row)' },
  { id: '3', label: 'Delete', icon: 'trash2', variant: 'ghost' as const, onClick: 'console.log("Delete", row)', confirmation: 'Are you sure you want to delete this item?' }
]
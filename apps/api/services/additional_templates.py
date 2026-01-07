"""
Additional Templates - ERP, LMS, Management Systems, Restaurant, Shop, etc.
"""

ADDITIONAL_TEMPLATES = {
    # ERP System Template
    "erp-dashboard": {
        "id": "erp-dashboard",
        "name": "ERP Dashboard",
        "description": "Complete ERP system with inventory, HR, finance, and reporting modules",
        "category": "erp",
        "thumbnail": "/templates/erp-dashboard.png",
        "tags": ["erp", "enterprise", "management", "dashboard", "business"],
        "pages": [
            {
                "name": "Dashboard",
                "slug": "dashboard",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "ERP System", "variant": "dashboard", "showNotifications": True, "showProfile": True}},
                    {"id": "metrics-1", "type": "stats", "props": {"title": "Overview", "stats": [{"value": "$125K", "label": "Revenue", "change": 12}, {"value": "1,234", "label": "Orders", "change": 8}, {"value": "456", "label": "Customers", "change": 15}, {"value": "89%", "label": "Efficiency", "change": -2}]}},
                    {"id": "chart-1", "type": "chart", "props": {"title": "Revenue Overview", "chartType": "line", "height": 300}},
                    {"id": "chart-2", "type": "chart", "props": {"title": "Department Performance", "chartType": "bar"}},
                    {"id": "table-1", "type": "data", "props": {"title": "Recent Orders", "columns": ["Order ID", "Customer", "Amount", "Status"]}},
                    {"id": "alerts-1", "type": "alert", "props": {"variant": "warning", "title": "Low Stock Alert", "message": "5 items need restocking"}}
                ]
            },
            {
                "name": "Inventory",
                "slug": "inventory",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "ERP System", "variant": "dashboard"}},
                    {"id": "breadcrumb-1", "type": "breadcrumb", "props": {"items": [{"label": "Dashboard", "href": "/"}, {"label": "Inventory"}]}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "2,456", "label": "Total Items"}, {"value": "123", "label": "Low Stock"}, {"value": "45", "label": "Out of Stock"}]}},
                    {"id": "table-1", "type": "data", "props": {"title": "Inventory List", "showFilters": True, "showSearch": True, "columns": ["SKU", "Product", "Quantity", "Location", "Status"]}}
                ]
            },
            {
                "name": "HR Management",
                "slug": "hr",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "ERP System", "variant": "dashboard"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "156", "label": "Employees"}, {"value": "12", "label": "Departments"}, {"value": "8", "label": "Open Positions"}]}},
                    {"id": "team-1", "type": "team", "props": {"title": "Department Heads", "variant": "compact"}},
                    {"id": "table-1", "type": "data", "props": {"title": "Employee Directory", "showSearch": True}}
                ]
            },
            {
                "name": "Finance",
                "slug": "finance",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "ERP System", "variant": "dashboard"}},
                    {"id": "metrics-1", "type": "stats", "props": {"stats": [{"value": "$1.2M", "label": "Total Revenue"}, {"value": "$890K", "label": "Expenses"}, {"value": "$310K", "label": "Profit"}]}},
                    {"id": "chart-1", "type": "chart", "props": {"title": "Cash Flow", "chartType": "area"}},
                    {"id": "table-1", "type": "data", "props": {"title": "Recent Transactions"}}
                ]
            }
        ]
    },

    # LMS Template
    "lms-platform": {
        "id": "lms-platform",
        "name": "Learning Management System",
        "description": "Complete LMS with courses, students, instructors, and progress tracking",
        "category": "lms",
        "thumbnail": "/templates/lms-platform.png",
        "tags": ["lms", "education", "courses", "learning", "e-learning"],
        "pages": [
            {
                "name": "Home",
                "slug": "home",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "LearnHub", "links": [{"label": "Courses", "href": "/courses"}, {"label": "Instructors", "href": "/instructors"}, {"label": "Pricing", "href": "/pricing"}], "ctaText": "Start Learning"}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "Learn Anything, Anytime", "subtitle": "Access thousands of courses from expert instructors", "primaryCta": "Browse Courses", "secondaryCta": "Become Instructor"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "10K+", "label": "Courses"}, {"value": "500K+", "label": "Students"}, {"value": "1K+", "label": "Instructors"}, {"value": "95%", "label": "Satisfaction"}]}},
                    {"id": "courses-1", "type": "card", "props": {"title": "Popular Courses", "layout": "grid", "columns": 4}},
                    {"id": "categories-1", "type": "features", "props": {"title": "Browse Categories", "columns": 6, "variant": "icons"}},
                    {"id": "testimonials-1", "type": "testimonial", "props": {"title": "Student Success Stories"}},
                    {"id": "cta-1", "type": "cta", "props": {"title": "Start Your Learning Journey", "primaryCta": "Get Started Free"}},
                    {"id": "footer-1", "type": "footer", "props": {}}
                ]
            },
            {
                "name": "Student Dashboard",
                "slug": "dashboard",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "LearnHub", "variant": "dashboard", "showProfile": True}},
                    {"id": "welcome-1", "type": "hero", "props": {"title": "Welcome back, Student!", "subtitle": "Continue your learning journey", "variant": "simple"}},
                    {"id": "progress-1", "type": "progress", "props": {"title": "Your Progress", "items": [{"label": "Courses Completed", "value": 12, "max": 20}, {"label": "Hours Learned", "value": 45, "max": 100}]}},
                    {"id": "courses-1", "type": "card", "props": {"title": "Continue Learning", "layout": "grid", "columns": 3}},
                    {"id": "calendar-1", "type": "calendar", "props": {"title": "Upcoming Classes"}}
                ]
            },
            {
                "name": "Course Catalog",
                "slug": "courses",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "LearnHub"}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "Explore Courses", "showSearch": True, "variant": "simple"}},
                    {"id": "filters-1", "type": "tabs", "props": {"tabs": [{"label": "All"}, {"label": "Development"}, {"label": "Business"}, {"label": "Design"}, {"label": "Marketing"}]}},
                    {"id": "courses-1", "type": "card", "props": {"layout": "grid", "columns": 4, "showFilters": True}},
                    {"id": "footer-1", "type": "footer", "props": {}}
                ]
            }
        ]
    },

    # Restaurant Management System
    "restaurant-pos": {
        "id": "restaurant-pos",
        "name": "Restaurant Management",
        "description": "Complete restaurant system with menu, orders, reservations, and POS",
        "category": "restaurant",
        "thumbnail": "/templates/restaurant-pos.png",
        "tags": ["restaurant", "food", "pos", "orders", "reservations"],
        "pages": [
            {
                "name": "Home",
                "slug": "home",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "Bistro", "links": [{"label": "Menu", "href": "/menu"}, {"label": "Reservations", "href": "/reservations"}, {"label": "About", "href": "/about"}, {"label": "Contact", "href": "/contact"}], "ctaText": "Order Now", "variant": "overlay"}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "Authentic Italian Cuisine", "subtitle": "Experience the taste of Italy in every bite", "primaryCta": "View Menu", "secondaryCta": "Reserve Table", "backgroundType": "video"}},
                    {"id": "about-1", "type": "columns", "props": {"columns": 2}},
                    {"id": "menu-1", "type": "tabs", "props": {"title": "Our Menu", "tabs": [{"label": "Appetizers"}, {"label": "Main Course"}, {"label": "Desserts"}, {"label": "Drinks"}]}},
                    {"id": "specials-1", "type": "card", "props": {"title": "Today's Specials", "layout": "grid", "columns": 3}},
                    {"id": "gallery-1", "type": "gallery", "props": {"title": "Gallery", "layout": "masonry"}},
                    {"id": "testimonials-1", "type": "testimonial", "props": {"title": "What Our Guests Say"}},
                    {"id": "hours-1", "type": "features", "props": {"title": "Opening Hours", "columns": 3}},
                    {"id": "cta-1", "type": "cta", "props": {"title": "Reserve Your Table", "primaryCta": "Book Now"}},
                    {"id": "map-1", "type": "map", "props": {"title": "Find Us"}},
                    {"id": "footer-1", "type": "footer", "props": {"showSocial": True}}
                ]
            },
            {
                "name": "Menu",
                "slug": "menu",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "Bistro"}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "Our Menu", "variant": "simple"}},
                    {"id": "menu-1", "type": "accordion", "props": {"items": [{"title": "Appetizers", "content": ""}, {"title": "Salads", "content": ""}, {"title": "Main Courses", "content": ""}, {"title": "Desserts", "content": ""}, {"title": "Beverages", "content": ""}]}},
                    {"id": "footer-1", "type": "footer", "props": {}}
                ]
            },
            {
                "name": "Reservations",
                "slug": "reservations",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "Bistro"}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "Make a Reservation", "variant": "simple"}},
                    {"id": "form-1", "type": "form", "props": {"title": "Book Your Table", "fields": [{"name": "name", "type": "text", "label": "Name"}, {"name": "email", "type": "email", "label": "Email"}, {"name": "phone", "type": "tel", "label": "Phone"}, {"name": "date", "type": "date", "label": "Date"}, {"name": "time", "type": "select", "label": "Time"}, {"name": "guests", "type": "number", "label": "Number of Guests"}]}},
                    {"id": "footer-1", "type": "footer", "props": {}}
                ]
            },
            {
                "name": "Admin Dashboard",
                "slug": "admin",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "Bistro Admin", "variant": "dashboard"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "$4,250", "label": "Today's Sales"}, {"value": "45", "label": "Orders"}, {"value": "12", "label": "Reservations"}, {"value": "8", "label": "Tables Occupied"}]}},
                    {"id": "chart-1", "type": "chart", "props": {"title": "Sales Overview", "chartType": "line"}},
                    {"id": "orders-1", "type": "data", "props": {"title": "Recent Orders", "columns": ["Order #", "Table", "Items", "Total", "Status"]}},
                    {"id": "reservations-1", "type": "data", "props": {"title": "Today's Reservations", "columns": ["Time", "Name", "Guests", "Table", "Status"]}}
                ]
            }
        ]
    },

    # Shop/Retail Management
    "retail-shop": {
        "id": "retail-shop",
        "name": "Retail Shop Management",
        "description": "Complete retail management with POS, inventory, customers, and reports",
        "category": "shop",
        "thumbnail": "/templates/retail-shop.png",
        "tags": ["shop", "retail", "pos", "inventory", "sales"],
        "pages": [
            {
                "name": "Storefront",
                "slug": "home",
                "elements": [
                    {"id": "banner-1", "type": "banner", "props": {"text": "🎉 Grand Opening Sale - 20% Off Everything!", "variant": "gradient"}},
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "ShopName", "links": [{"label": "Products", "href": "/products"}, {"label": "Categories", "href": "/categories"}, {"label": "Deals", "href": "/deals"}, {"label": "About", "href": "/about"}], "showCart": True, "showSearch": True}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "Quality Products, Great Prices", "subtitle": "Shop the latest trends", "primaryCta": "Shop Now"}},
                    {"id": "categories-1", "type": "features", "props": {"title": "Shop by Category", "columns": 6, "variant": "icons"}},
                    {"id": "products-1", "type": "ecommerce", "props": {"title": "Featured Products", "layout": "grid", "columns": 4}},
                    {"id": "deals-1", "type": "card", "props": {"title": "Hot Deals", "layout": "grid", "columns": 3}},
                    {"id": "features-1", "type": "features", "props": {"columns": 4, "features": [{"icon": "Truck", "title": "Free Delivery"}, {"icon": "Shield", "title": "Secure Payment"}, {"icon": "RefreshCw", "title": "Easy Returns"}, {"icon": "Headphones", "title": "24/7 Support"}]}},
                    {"id": "newsletter-1", "type": "newsletter", "props": {"title": "Subscribe & Save 10%"}},
                    {"id": "footer-1", "type": "footer", "props": {"showPaymentIcons": True}}
                ]
            },
            {
                "name": "POS Dashboard",
                "slug": "pos",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "ShopName POS", "variant": "dashboard"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "$2,450", "label": "Today's Sales"}, {"value": "67", "label": "Transactions"}, {"value": "$36.57", "label": "Avg. Order"}, {"value": "12", "label": "Items Sold"}]}},
                    {"id": "pos-1", "type": "columns", "props": {"columns": 2}},
                    {"id": "recent-1", "type": "data", "props": {"title": "Recent Transactions"}}
                ]
            },
            {
                "name": "Inventory",
                "slug": "inventory",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "ShopName", "variant": "dashboard"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "1,234", "label": "Total Products"}, {"value": "56", "label": "Low Stock"}, {"value": "12", "label": "Out of Stock"}]}},
                    {"id": "table-1", "type": "data", "props": {"title": "Inventory", "showFilters": True, "showSearch": True}}
                ]
            }
        ]
    },

    # CRM System
    "crm-system": {
        "id": "crm-system",
        "name": "CRM System",
        "description": "Customer relationship management with contacts, deals, and pipeline",
        "category": "crm",
        "thumbnail": "/templates/crm-system.png",
        "tags": ["crm", "sales", "customers", "pipeline", "leads"],
        "pages": [
            {
                "name": "Dashboard",
                "slug": "dashboard",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "SalesCRM", "variant": "dashboard", "showNotifications": True}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "$125K", "label": "Pipeline Value"}, {"value": "45", "label": "Active Deals"}, {"value": "12", "label": "Won This Month"}, {"value": "89%", "label": "Win Rate"}]}},
                    {"id": "chart-1", "type": "chart", "props": {"title": "Sales Pipeline", "chartType": "funnel"}},
                    {"id": "deals-1", "type": "data", "props": {"title": "Recent Deals", "columns": ["Deal", "Company", "Value", "Stage", "Close Date"]}},
                    {"id": "activities-1", "type": "timeline", "props": {"title": "Recent Activities"}}
                ]
            },
            {
                "name": "Contacts",
                "slug": "contacts",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "SalesCRM", "variant": "dashboard"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "2,456", "label": "Total Contacts"}, {"value": "123", "label": "New This Month"}, {"value": "45", "label": "Companies"}]}},
                    {"id": "table-1", "type": "data", "props": {"title": "Contacts", "showSearch": True, "showFilters": True, "columns": ["Name", "Company", "Email", "Phone", "Status"]}}
                ]
            },
            {
                "name": "Deals",
                "slug": "deals",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "SalesCRM", "variant": "dashboard"}},
                    {"id": "pipeline-1", "type": "tabs", "props": {"title": "Pipeline", "tabs": [{"label": "Qualification"}, {"label": "Proposal"}, {"label": "Negotiation"}, {"label": "Closed Won"}]}},
                    {"id": "deals-1", "type": "card", "props": {"layout": "kanban"}}
                ]
            }
        ]
    },

    # Project Management
    "project-management": {
        "id": "project-management",
        "name": "Project Management",
        "description": "Project tracking with tasks, teams, timelines, and reporting",
        "category": "management",
        "thumbnail": "/templates/project-management.png",
        "tags": ["project", "tasks", "team", "management", "agile"],
        "pages": [
            {
                "name": "Dashboard",
                "slug": "dashboard",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "ProjectHub", "variant": "dashboard"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "12", "label": "Active Projects"}, {"value": "45", "label": "Tasks Due"}, {"value": "8", "label": "Team Members"}, {"value": "85%", "label": "On Track"}]}},
                    {"id": "projects-1", "type": "card", "props": {"title": "Active Projects", "layout": "grid", "columns": 3}},
                    {"id": "timeline-1", "type": "timeline", "props": {"title": "Project Timeline"}},
                    {"id": "tasks-1", "type": "data", "props": {"title": "My Tasks", "columns": ["Task", "Project", "Due Date", "Priority", "Status"]}}
                ]
            },
            {
                "name": "Projects",
                "slug": "projects",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "ProjectHub", "variant": "dashboard"}},
                    {"id": "projects-1", "type": "card", "props": {"title": "All Projects", "layout": "grid", "columns": 3, "showFilters": True}}
                ]
            },
            {
                "name": "Tasks",
                "slug": "tasks",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "ProjectHub", "variant": "dashboard"}},
                    {"id": "tabs-1", "type": "tabs", "props": {"tabs": [{"label": "Board View"}, {"label": "List View"}, {"label": "Calendar"}]}},
                    {"id": "tasks-1", "type": "card", "props": {"layout": "kanban", "columns": ["To Do", "In Progress", "Review", "Done"]}}
                ]
            },
            {
                "name": "Team",
                "slug": "team",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "ProjectHub", "variant": "dashboard"}},
                    {"id": "team-1", "type": "team", "props": {"title": "Team Members", "columns": 4, "showRole": True}},
                    {"id": "workload-1", "type": "chart", "props": {"title": "Team Workload", "chartType": "bar"}}
                ]
            }
        ]
    },

    # Inventory Management
    "inventory-management": {
        "id": "inventory-management",
        "name": "Inventory Management",
        "description": "Complete inventory system with stock tracking, orders, and suppliers",
        "category": "management",
        "thumbnail": "/templates/inventory-management.png",
        "tags": ["inventory", "stock", "warehouse", "management", "orders"],
        "pages": [
            {
                "name": "Dashboard",
                "slug": "dashboard",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "StockPro", "variant": "dashboard"}},
                    {"id": "alerts-1", "type": "alert", "props": {"variant": "warning", "title": "Low Stock Alert", "message": "15 items need restocking"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "5,678", "label": "Total Items"}, {"value": "234", "label": "Low Stock"}, {"value": "45", "label": "Out of Stock"}, {"value": "$1.2M", "label": "Inventory Value"}]}},
                    {"id": "chart-1", "type": "chart", "props": {"title": "Stock Levels", "chartType": "bar"}},
                    {"id": "recent-1", "type": "data", "props": {"title": "Recent Stock Movements"}}
                ]
            },
            {
                "name": "Products",
                "slug": "products",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "StockPro", "variant": "dashboard"}},
                    {"id": "table-1", "type": "data", "props": {"title": "Product Inventory", "showSearch": True, "showFilters": True, "columns": ["SKU", "Product", "Category", "Quantity", "Location", "Status"]}}
                ]
            },
            {
                "name": "Orders",
                "slug": "orders",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "StockPro", "variant": "dashboard"}},
                    {"id": "tabs-1", "type": "tabs", "props": {"tabs": [{"label": "Purchase Orders"}, {"label": "Sales Orders"}, {"label": "Transfers"}]}},
                    {"id": "orders-1", "type": "data", "props": {"title": "Orders", "showFilters": True}}
                ]
            },
            {
                "name": "Suppliers",
                "slug": "suppliers",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "StockPro", "variant": "dashboard"}},
                    {"id": "suppliers-1", "type": "data", "props": {"title": "Suppliers", "showSearch": True, "columns": ["Name", "Contact", "Products", "Lead Time", "Rating"]}}
                ]
            }
        ]
    },

    # HR Management System
    "hr-management": {
        "id": "hr-management",
        "name": "HR Management System",
        "description": "Human resources management with employees, payroll, and recruitment",
        "category": "hr",
        "thumbnail": "/templates/hr-management.png",
        "tags": ["hr", "employees", "payroll", "recruitment", "management"],
        "pages": [
            {
                "name": "Dashboard",
                "slug": "dashboard",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "HR Portal", "variant": "dashboard"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "156", "label": "Employees"}, {"value": "12", "label": "Departments"}, {"value": "8", "label": "Open Positions"}, {"value": "5", "label": "On Leave"}]}},
                    {"id": "chart-1", "type": "chart", "props": {"title": "Headcount by Department", "chartType": "pie"}},
                    {"id": "birthdays-1", "type": "card", "props": {"title": "Upcoming Birthdays"}},
                    {"id": "announcements-1", "type": "card", "props": {"title": "Company Announcements"}}
                ]
            },
            {
                "name": "Employees",
                "slug": "employees",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "HR Portal", "variant": "dashboard"}},
                    {"id": "table-1", "type": "data", "props": {"title": "Employee Directory", "showSearch": True, "showFilters": True, "columns": ["Name", "Department", "Position", "Email", "Status"]}}
                ]
            },
            {
                "name": "Recruitment",
                "slug": "recruitment",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "HR Portal", "variant": "dashboard"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "8", "label": "Open Positions"}, {"value": "45", "label": "Applications"}, {"value": "12", "label": "Interviews"}]}},
                    {"id": "jobs-1", "type": "card", "props": {"title": "Open Positions", "layout": "grid", "columns": 2}},
                    {"id": "pipeline-1", "type": "chart", "props": {"title": "Recruitment Pipeline", "chartType": "funnel"}}
                ]
            },
            {
                "name": "Leave Management",
                "slug": "leave",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "HR Portal", "variant": "dashboard"}},
                    {"id": "calendar-1", "type": "calendar", "props": {"title": "Leave Calendar"}},
                    {"id": "requests-1", "type": "data", "props": {"title": "Leave Requests", "columns": ["Employee", "Type", "From", "To", "Status"]}}
                ]
            }
        ]
    },

    # Booking/Appointment System
    "booking-system": {
        "id": "booking-system",
        "name": "Booking & Appointments",
        "description": "Online booking system for services, appointments, and reservations",
        "category": "booking",
        "thumbnail": "/templates/booking-system.png",
        "tags": ["booking", "appointments", "scheduling", "reservations", "services"],
        "pages": [
            {
                "name": "Home",
                "slug": "home",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "BookNow", "links": [{"label": "Services", "href": "/services"}, {"label": "About", "href": "/about"}, {"label": "Contact", "href": "/contact"}], "ctaText": "Book Now"}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "Book Your Appointment", "subtitle": "Easy online scheduling for all our services", "primaryCta": "Book Now", "secondaryCta": "View Services"}},
                    {"id": "services-1", "type": "card", "props": {"title": "Our Services", "layout": "grid", "columns": 3}},
                    {"id": "steps-1", "type": "steps", "props": {"title": "How It Works", "steps": [{"title": "Choose Service"}, {"title": "Select Time"}, {"title": "Confirm Booking"}]}},
                    {"id": "team-1", "type": "team", "props": {"title": "Our Team"}},
                    {"id": "testimonials-1", "type": "testimonial", "props": {"title": "What Clients Say"}},
                    {"id": "cta-1", "type": "cta", "props": {"title": "Ready to Book?", "primaryCta": "Schedule Now"}},
                    {"id": "footer-1", "type": "footer", "props": {}}
                ]
            },
            {
                "name": "Book",
                "slug": "book",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "BookNow"}},
                    {"id": "booking-1", "type": "steps", "props": {"title": "Book Appointment", "variant": "wizard"}},
                    {"id": "calendar-1", "type": "calendar", "props": {"title": "Select Date & Time", "showAvailability": True}},
                    {"id": "form-1", "type": "form", "props": {"title": "Your Details"}},
                    {"id": "footer-1", "type": "footer", "props": {}}
                ]
            },
            {
                "name": "Admin Dashboard",
                "slug": "admin",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "BookNow Admin", "variant": "dashboard"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "24", "label": "Today's Bookings"}, {"value": "156", "label": "This Week"}, {"value": "$4,500", "label": "Revenue"}, {"value": "92%", "label": "Show Rate"}]}},
                    {"id": "calendar-1", "type": "calendar", "props": {"title": "Booking Calendar", "variant": "admin"}},
                    {"id": "bookings-1", "type": "data", "props": {"title": "Upcoming Bookings", "columns": ["Time", "Client", "Service", "Staff", "Status"]}}
                ]
            }
        ]
    },

    # Clinic/Healthcare Management
    "clinic-management": {
        "id": "clinic-management",
        "name": "Clinic Management",
        "description": "Healthcare management with patients, appointments, and medical records",
        "category": "healthcare",
        "thumbnail": "/templates/clinic-management.png",
        "tags": ["clinic", "healthcare", "medical", "patients", "appointments"],
        "pages": [
            {
                "name": "Home",
                "slug": "home",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "HealthCare Clinic", "links": [{"label": "Services", "href": "/services"}, {"label": "Doctors", "href": "/doctors"}, {"label": "About", "href": "/about"}, {"label": "Contact", "href": "/contact"}], "ctaText": "Book Appointment"}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "Your Health, Our Priority", "subtitle": "Comprehensive healthcare services for you and your family", "primaryCta": "Book Appointment", "secondaryCta": "Our Services"}},
                    {"id": "services-1", "type": "features", "props": {"title": "Our Services", "columns": 4}},
                    {"id": "doctors-1", "type": "team", "props": {"title": "Our Doctors", "variant": "medical"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "15+", "label": "Years Experience"}, {"value": "50K+", "label": "Patients"}, {"value": "20+", "label": "Specialists"}, {"value": "24/7", "label": "Emergency"}]}},
                    {"id": "testimonials-1", "type": "testimonial", "props": {"title": "Patient Stories"}},
                    {"id": "cta-1", "type": "cta", "props": {"title": "Need Medical Assistance?", "primaryCta": "Book Now", "secondaryCta": "Call Us"}},
                    {"id": "footer-1", "type": "footer", "props": {}}
                ]
            },
            {
                "name": "Patient Portal",
                "slug": "portal",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "Patient Portal", "variant": "dashboard"}},
                    {"id": "welcome-1", "type": "hero", "props": {"title": "Welcome, Patient", "variant": "simple"}},
                    {"id": "appointments-1", "type": "card", "props": {"title": "Upcoming Appointments"}},
                    {"id": "records-1", "type": "accordion", "props": {"title": "Medical Records"}},
                    {"id": "prescriptions-1", "type": "data", "props": {"title": "Prescriptions"}}
                ]
            },
            {
                "name": "Admin Dashboard",
                "slug": "admin",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "Clinic Admin", "variant": "dashboard"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "45", "label": "Today's Appointments"}, {"value": "12", "label": "Doctors Available"}, {"value": "8", "label": "Pending Reports"}]}},
                    {"id": "calendar-1", "type": "calendar", "props": {"title": "Appointment Calendar"}},
                    {"id": "patients-1", "type": "data", "props": {"title": "Recent Patients"}}
                ]
            }
        ]
    },

    # Gym/Fitness Management
    "gym-management": {
        "id": "gym-management",
        "name": "Gym & Fitness Center",
        "description": "Fitness center management with memberships, classes, and trainers",
        "category": "fitness",
        "thumbnail": "/templates/gym-management.png",
        "tags": ["gym", "fitness", "membership", "classes", "trainers"],
        "pages": [
            {
                "name": "Home",
                "slug": "home",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "FitZone", "links": [{"label": "Classes", "href": "/classes"}, {"label": "Trainers", "href": "/trainers"}, {"label": "Membership", "href": "/membership"}, {"label": "Contact", "href": "/contact"}], "ctaText": "Join Now"}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "Transform Your Body", "subtitle": "State-of-the-art facilities and expert trainers", "primaryCta": "Start Free Trial", "secondaryCta": "View Classes", "backgroundType": "video"}},
                    {"id": "features-1", "type": "features", "props": {"title": "Why Choose Us", "columns": 4}},
                    {"id": "classes-1", "type": "card", "props": {"title": "Popular Classes", "layout": "grid", "columns": 4}},
                    {"id": "trainers-1", "type": "team", "props": {"title": "Expert Trainers"}},
                    {"id": "pricing-1", "type": "pricing", "props": {"title": "Membership Plans", "plans": [{"name": "Basic", "price": "$29", "period": "/month"}, {"name": "Premium", "price": "$59", "period": "/month", "highlighted": True}, {"name": "VIP", "price": "$99", "period": "/month"}]}},
                    {"id": "testimonials-1", "type": "testimonial", "props": {"title": "Success Stories"}},
                    {"id": "cta-1", "type": "cta", "props": {"title": "Ready to Get Fit?", "primaryCta": "Join Now"}},
                    {"id": "footer-1", "type": "footer", "props": {}}
                ]
            },
            {
                "name": "Member Portal",
                "slug": "portal",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "FitZone", "variant": "dashboard"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "24", "label": "Workouts This Month"}, {"value": "12,500", "label": "Calories Burned"}, {"value": "8", "label": "Classes Attended"}]}},
                    {"id": "progress-1", "type": "progress", "props": {"title": "Your Progress"}},
                    {"id": "schedule-1", "type": "calendar", "props": {"title": "Class Schedule"}},
                    {"id": "bookings-1", "type": "card", "props": {"title": "Upcoming Classes"}}
                ]
            }
        ]
    },

    # Hotel Management
    "hotel-management": {
        "id": "hotel-management",
        "name": "Hotel & Resort",
        "description": "Hotel management with rooms, bookings, and guest services",
        "category": "hospitality",
        "thumbnail": "/templates/hotel-management.png",
        "tags": ["hotel", "resort", "hospitality", "bookings", "rooms"],
        "pages": [
            {
                "name": "Home",
                "slug": "home",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "Grand Hotel", "links": [{"label": "Rooms", "href": "/rooms"}, {"label": "Dining", "href": "/dining"}, {"label": "Amenities", "href": "/amenities"}, {"label": "Contact", "href": "/contact"}], "ctaText": "Book Now", "variant": "overlay"}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "Luxury Awaits", "subtitle": "Experience world-class hospitality", "primaryCta": "Book Your Stay", "secondaryCta": "Virtual Tour", "backgroundType": "video"}},
                    {"id": "rooms-1", "type": "card", "props": {"title": "Our Rooms", "layout": "grid", "columns": 3}},
                    {"id": "amenities-1", "type": "features", "props": {"title": "Amenities", "columns": 6, "variant": "icons"}},
                    {"id": "gallery-1", "type": "gallery", "props": {"title": "Gallery", "layout": "masonry"}},
                    {"id": "dining-1", "type": "card", "props": {"title": "Dining Options", "layout": "grid", "columns": 3}},
                    {"id": "testimonials-1", "type": "testimonial", "props": {"title": "Guest Reviews"}},
                    {"id": "cta-1", "type": "cta", "props": {"title": "Plan Your Perfect Stay", "primaryCta": "Check Availability"}},
                    {"id": "map-1", "type": "map", "props": {"title": "Location"}},
                    {"id": "footer-1", "type": "footer", "props": {}}
                ]
            },
            {
                "name": "Booking",
                "slug": "booking",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "Grand Hotel"}},
                    {"id": "booking-1", "type": "form", "props": {"title": "Book Your Stay", "fields": [{"name": "checkin", "type": "date", "label": "Check-in"}, {"name": "checkout", "type": "date", "label": "Check-out"}, {"name": "guests", "type": "number", "label": "Guests"}, {"name": "room", "type": "select", "label": "Room Type"}]}},
                    {"id": "rooms-1", "type": "card", "props": {"title": "Available Rooms"}},
                    {"id": "footer-1", "type": "footer", "props": {}}
                ]
            },
            {
                "name": "Admin Dashboard",
                "slug": "admin",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "Hotel Admin", "variant": "dashboard"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "85%", "label": "Occupancy"}, {"value": "45", "label": "Check-ins Today"}, {"value": "32", "label": "Check-outs"}, {"value": "$12,500", "label": "Revenue"}]}},
                    {"id": "calendar-1", "type": "calendar", "props": {"title": "Booking Calendar"}},
                    {"id": "rooms-1", "type": "data", "props": {"title": "Room Status", "columns": ["Room", "Type", "Status", "Guest", "Check-out"]}}
                ]
            }
        ]
    },

    # School Management
    "school-management": {
        "id": "school-management",
        "name": "School Management System",
        "description": "Complete school management with students, teachers, and classes",
        "category": "education",
        "thumbnail": "/templates/school-management.png",
        "tags": ["school", "education", "students", "teachers", "classes"],
        "pages": [
            {
                "name": "Home",
                "slug": "home",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "Bright Academy", "links": [{"label": "About", "href": "/about"}, {"label": "Programs", "href": "/programs"}, {"label": "Admissions", "href": "/admissions"}, {"label": "Contact", "href": "/contact"}], "ctaText": "Apply Now"}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "Shaping Future Leaders", "subtitle": "Excellence in education since 1990", "primaryCta": "Apply Now", "secondaryCta": "Virtual Tour"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "2,500+", "label": "Students"}, {"value": "150+", "label": "Teachers"}, {"value": "98%", "label": "Pass Rate"}, {"value": "50+", "label": "Programs"}]}},
                    {"id": "programs-1", "type": "card", "props": {"title": "Our Programs", "layout": "grid", "columns": 3}},
                    {"id": "features-1", "type": "features", "props": {"title": "Why Choose Us", "columns": 4}},
                    {"id": "testimonials-1", "type": "testimonial", "props": {"title": "Parent Testimonials"}},
                    {"id": "cta-1", "type": "cta", "props": {"title": "Enroll Your Child Today", "primaryCta": "Start Application"}},
                    {"id": "footer-1", "type": "footer", "props": {}}
                ]
            },
            {
                "name": "Student Portal",
                "slug": "student",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "Student Portal", "variant": "dashboard"}},
                    {"id": "welcome-1", "type": "hero", "props": {"title": "Welcome, Student", "variant": "simple"}},
                    {"id": "schedule-1", "type": "calendar", "props": {"title": "Class Schedule"}},
                    {"id": "grades-1", "type": "data", "props": {"title": "Recent Grades"}},
                    {"id": "assignments-1", "type": "card", "props": {"title": "Upcoming Assignments"}}
                ]
            },
            {
                "name": "Teacher Portal",
                "slug": "teacher",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "Teacher Portal", "variant": "dashboard"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "5", "label": "Classes Today"}, {"value": "120", "label": "Students"}, {"value": "8", "label": "Pending Grades"}]}},
                    {"id": "schedule-1", "type": "calendar", "props": {"title": "Today's Schedule"}},
                    {"id": "classes-1", "type": "card", "props": {"title": "My Classes"}}
                ]
            },
            {
                "name": "Admin Dashboard",
                "slug": "admin",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "School Admin", "variant": "dashboard"}},
                    {"id": "stats-1", "type": "stats", "props": {"stats": [{"value": "2,500", "label": "Students"}, {"value": "150", "label": "Teachers"}, {"value": "45", "label": "Classes"}, {"value": "12", "label": "Departments"}]}},
                    {"id": "chart-1", "type": "chart", "props": {"title": "Enrollment Trends", "chartType": "line"}},
                    {"id": "announcements-1", "type": "card", "props": {"title": "Announcements"}},
                    {"id": "calendar-1", "type": "calendar", "props": {"title": "School Calendar"}}
                ]
            }
        ]
    },

    # Salon/Spa Management
    "salon-spa": {
        "id": "salon-spa",
        "name": "Salon & Spa",
        "description": "Beauty salon and spa management with services and bookings",
        "category": "beauty",
        "thumbnail": "/templates/salon-spa.png",
        "tags": ["salon", "spa", "beauty", "wellness", "bookings"],
        "pages": [
            {
                "name": "Home",
                "slug": "home",
                "elements": [
                    {"id": "nav-1", "type": "navbar", "props": {"logo": "Serenity Spa", "links": [{"label": "Services", "href": "/services"}, {"label": "Team", "href": "/team"}, {"label": "Gallery", "href": "/gallery"}, {"label": "Contact", "href": "/contact"}], "ctaText": "Book Now"}},
                    {"id": "hero-1", "type": "hero", "props": {"title": "Relax. Refresh. Renew.", "subtitle": "Luxury spa treatments for mind and body", "primaryCta": "Book Treatment", "secondaryCta": "View Services", "backgroundType": "image"}},
                    {"id": "services-1", "type": "card", "props": {"title": "Our Services", "layout": "grid", "columns": 4}},
                    {"id": "team-1", "type": "team", "props": {"title": "Our Specialists"}},
                    {"id": "gallery-1", "type": "gallery", "props": {"title": "Gallery"}},
                    {"id": "pricing-1", "type": "pricing", "props": {"title": "Packages", "variant": "cards"}},
                    {"id": "testimonials-1", "type": "testimonial", "props": {"title": "Client Reviews"}},
                    {"id": "cta-1", "type": "cta", "props": {"title": "Treat Yourself Today", "primaryCta": "Book Appointment"}},
                    {"id": "footer-1", "type": "footer", "props": {}}
                ]
            }
        ]
    }
}

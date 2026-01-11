// WebCraft Documentation - Main JavaScript

// Search functionality
function performSearch() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
    if (!searchTerm || searchTerm.trim() === '') {
        return;
    }
    
    // Simple search - redirect to development index with search
    window.location.href = `development/index.html?search=${encodeURIComponent(searchTerm)}`;
}

// Initialize search on Enter key
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Copy code block functionality
    document.querySelectorAll('pre code').forEach(block => {
        const button = document.createElement('button');
        button.className = 'copy-code-btn';
        button.innerHTML = '<i class="fas fa-copy"></i>';
        button.title = 'Copy code';
        
        button.addEventListener('click', async () => {
            const text = block.textContent;
            try {
                await navigator.clipboard.writeText(text);
                button.innerHTML = '<i class="fas fa-check"></i>';
                button.title = 'Copied!';
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-copy"></i>';
                    button.title = 'Copy code';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });
        
        const pre = block.parentElement;
        if (pre) {
            pre.style.position = 'relative';
            pre.appendChild(button);
        }
    });
});

// Mobile menu toggle (if needed)
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}


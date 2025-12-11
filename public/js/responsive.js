document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Create and Append Sidebar Overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    const sidebar = document.getElementById('sidebar');
    const mobileToggle = document.getElementById('mobileSidebarToggle');
    const mainContent = document.querySelector('.main-content');

    // Function to Open Sidebar
    function openSidebar() {
        if (!sidebar) return;
        sidebar.classList.add('mobile-open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    // Function to Close Sidebar
    function closeSidebar() {
        if (!sidebar) return;
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Toggle Button Listener (Re-attaching or Enhancing existing logic)
    if (mobileToggle) {
        // Remove old listeners to prevent double toggling if main.js is also doing it
        const newToggle = mobileToggle.cloneNode(true); 
        mobileToggle.parentNode.replaceChild(newToggle, mobileToggle);
        
        newToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sidebar.classList.contains('mobile-open')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    // Close when clicking overlay
    overlay.addEventListener('click', closeSidebar);

    // Close when clicking a link inside sidebar (for SPA feel or anchors)
    const sidebarLinks = sidebar.querySelectorAll('a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                closeSidebar();
            }
        });
    });

    // 2. Adjust Textarea Height automatically
    const chatInput = document.getElementById('topic') || document.getElementById('chatMessage') || document.getElementById('msgInput');
    if (chatInput) {
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            if(this.value === '') this.style.height = '24px';
        });
    }

    // 3. Handle Orientation Changes (Fix Mindmap sizing)
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            // Reset mobile specific styles if moving to desktop
            overlay.classList.remove('active');
            if(sidebar) sidebar.classList.remove('mobile-open');
            document.body.style.overflow = '';
        }
    });

    // 4. Mobile Swipe to Close Sidebar (Simple implementation)
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, {passive: true});

    function handleSwipe() {
        if (!sidebar || !sidebar.classList.contains('mobile-open')) return;

        // Swipe Left to close
        if (touchEndX < touchStartX - 50) { 
            closeSidebar();
        }
    }
});
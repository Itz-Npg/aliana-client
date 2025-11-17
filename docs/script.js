document.addEventListener('DOMContentLoaded', () => {
    if (typeof hljs !== 'undefined') {
        hljs.highlightAll();
    }
    
    initNavigation();
    initTabs();
    initSearch();
    initBackToTop();
    initParticles();
});

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -75% 0px',
        threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        observer.observe(section);
    });
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 20;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            const tabContainer = button.closest('.section');
            
            tabContainer.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            tabContainer.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            button.classList.add('active');
            const activeContent = tabContainer.querySelector(`#${tabName}`);
            if (activeContent) {
                activeContent.classList.add('active');
            }
        });
    });
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const sections = document.querySelectorAll('.section');
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            if (searchTerm === '') {
                sections.forEach(section => {
                    section.style.display = 'block';
                });
                return;
            }
            
            sections.forEach(section => {
                const text = section.textContent.toLowerCase();
                const id = section.getAttribute('id');
                const heading = section.querySelector('h2')?.textContent.toLowerCase() || '';
                
                if (text.includes(searchTerm) || heading.includes(searchTerm) || id?.includes(searchTerm)) {
                    section.style.display = 'block';
                    highlightSearchTerms(section, searchTerm);
                } else {
                    section.style.display = 'none';
                }
            });
        }, 300);
    });
}

function highlightSearchTerms(section, term) {
    const walker = document.createTreeWalker(
        section,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const textNodes = [];
    let node;
    
    while (node = walker.nextNode()) {
        if (node.parentElement.tagName !== 'CODE' && 
            node.parentElement.tagName !== 'PRE' &&
            node.nodeValue.trim() !== '') {
            textNodes.push(node);
        }
    }
    
    textNodes.forEach(textNode => {
        const text = textNode.nodeValue;
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes(term)) {
            const regex = new RegExp(`(${term})`, 'gi');
            const span = document.createElement('span');
            span.innerHTML = text.replace(regex, '<mark style="background-color: rgba(88, 101, 242, 0.3); padding: 2px 4px; border-radius: 3px;">$1</mark>');
            textNode.parentNode.replaceChild(span, textNode);
        }
    });
}

function initBackToTop() {
    const backToTopButton = document.getElementById('backToTop');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });
    
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const navbar = document.querySelector('.sidebar-header');
    
    if (scrolled > 50 && navbar) {
        navbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
    } else if (navbar) {
        navbar.style.boxShadow = 'none';
    }
});

function initParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        createParticle(particlesContainer);
    }
    
    setInterval(() => {
        if (particlesContainer.children.length < particleCount) {
            createParticle(particlesContainer);
        }
    }, 3000);
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const startX = Math.random() * window.innerWidth;
    const duration = 15 + Math.random() * 10;
    const delay = Math.random() * 5;
    const size = 1 + Math.random() * 2;
    
    particle.style.left = startX + 'px';
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.animationDuration = duration + 's';
    particle.style.animationDelay = delay + 's';
    
    container.appendChild(particle);
    
    setTimeout(() => {
        particle.remove();
    }, (duration + delay) * 1000);
}
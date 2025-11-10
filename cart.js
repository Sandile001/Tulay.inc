// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Global state
let currentUser = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];

// DOM Elements
const productsContainer = document.getElementById('products-container');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalElement = document.getElementById('cart-total');
const cartCount = document.querySelector('.cart-count');

// Initialize the application
async function init() {
    await loadProducts();
    await loadWebsiteContent();
    updateCartCount();
    setupEventListeners();
    checkUserStatus();

    // Check if we're on a category page
    const currentPage = window.location.pathname.split('/').pop();
    const categoryPages = {
        'electronics.html': 'electronics',
        'fashion.html': 'fashion',
        'home-garden.html': 'home',
        'health-beauty.html': 'beauty',
        'sports.html': 'sports',
        'gaming.html': 'gaming'
    };

    if (categoryPages[currentPage]) {
        renderCategoryProducts(categoryPages[currentPage]);
        updatePageTitle(categoryPages[currentPage]);
    } else if (currentPage === 'index.html' || currentPage === '') {
        renderFeaturedProducts();
    }
}

// API Functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        showNotification('Error connecting to server. Please try again.');
        throw error;
    }
}

// Load products from API
async function loadProducts() {
    try {
        const data = await apiCall('/products');
        products = data.products;
    } catch (error) {
        // Fallback to local products if API fails
        products = getFallbackProducts();
    }
}

// Load website content
async function loadWebsiteContent() {
    try {
        const data = await apiCall('/website-content');
        if (data.hero_title) {
            document.getElementById('hero-title').textContent = data.hero_title;
        }
        if (data.hero_description) {
            document.getElementById('hero-description').textContent = data.hero_description;
        }
        if (data.hero_background) {
            document.querySelector('.hero').style.backgroundImage =
                `linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%), url('${data.hero_background}')`;
        }
    } catch (error) {
        console.error('Failed to load website content:', error);
    }
}

// Update page title based on category
function updatePageTitle(category) {
    const categoryNames = {
        'electronics': 'Electronics',
        'fashion': 'Fashion',
        'home': 'Home & Garden',
        'beauty': 'Health & Beauty',
        'sports': 'Sports',
        'gaming': 'Gaming'
    };

    document.title = `${categoryNames[category]} - Tulay.inc`;
    if (document.querySelector('.category-hero h1')) {
        document.querySelector('.category-hero h1').textContent = categoryNames[category];
    }
}

// Render featured products on homepage
function renderFeaturedProducts() {
    if (!productsContainer) return;

    productsContainer.innerHTML = '';
    const featuredProducts = products.filter(p => p.featured).slice(0, 8);

    if (featuredProducts.length === 0) {
        productsContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--gray);">No featured products available.</p>';
        return;
    }

    featuredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsContainer.appendChild(productCard);
    });
}

// Render products for specific category
function renderCategoryProducts(category) {
    if (!productsContainer) return;

    productsContainer.innerHTML = '';
    const categoryProducts = products.filter(product => product.category === category && product.stock > 0);

    if (categoryProducts.length === 0) {
        productsContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--gray);">No products found in this category.</p>';
        return;
    }

    categoryProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsContainer.appendChild(productCard);
    });
}

// Create product card HTML
function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.dataset.productId = product.id;

    let badgeHTML = '';
    if (product.badge) {
        badgeHTML = `<div class="product-badge">${product.badge}</div>`;
    }

    let originalPriceHTML = '';
    if (product.original_price) {
        originalPriceHTML = `<span class="original-price">$${parseFloat(product.original_price).toFixed(2)}</span>`;
    }

    const stockStatus = product.stock > 0 ?
        `<button class="add-to-cart" data-id="${product.id}">
            <i class="fas fa-shopping-cart"></i> Add to Cart
        </button>` :
        `<button class="add-to-cart" disabled style="background-color: var(--gray);">
            <i class="fas fa-times"></i> Out of Stock
        </button>`;

    productCard.innerHTML = `
        ${badgeHTML}
        <div class="product-image">
            <img src="${product.image_url}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-info">
            <div class="product-category">${getCategoryName(product.category)}</div>
            <h3 class="product-title">${product.name}</h3>
            <div class="product-rating">
                ${generateStarRating(product.rating)}
                <span>(${product.review_count})</span>
            </div>
            <div class="product-price">
                <span class="current-price">$${parseFloat(product.price).toFixed(2)}</span>
                ${originalPriceHTML}
            </div>
            <div class="product-stock" style="font-size: 0.8rem; color: ${product.stock > 10 ? 'var(--success)' : 'var(--warning)'}; margin-bottom: 10px;">
                ${product.stock > 10 ? 'In Stock' : `Only ${product.stock} left`}
            </div>
            <div class="product-actions">
                ${stockStatus}
                <button class="wishlist"><i class="far fa-heart"></i></button>
            </div>
        </div>
    `;

    return productCard;
}

// Generate star rating HTML
function generateStarRating(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }

    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }

    return stars;
}

// Get category name from category ID
function getCategoryName(categoryId) {
    const categories = {
        'fashion': 'Fashion',
        'electronics': 'Electronics',
        'home': 'Home & Garden',
        'beauty': 'Beauty & Health',
        'sports': 'Sports',
        'gaming': 'Gaming'
    };

    return categories[categoryId] || 'Uncategorized';
}

// Update cart count in header
function updateCartCount() {
    if (!cartCount) return;
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Render cart items
function renderCartItems() {
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Your cart is empty</p>';
        if (cartTotalElement) cartTotalElement.textContent = '$0.00';
        return;
    }

    let total = 0;

    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
            const itemTotal = parseFloat(product.price) * item.quantity;
            total += itemTotal;

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-image">
                    <img src="${product.image_url}" alt="${product.name}">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-title">${product.name}</div>
                    <div class="cart-item-price">$${parseFloat(product.price).toFixed(2)}</div>
                    <div class="cart-item-actions">
                        <div class="quantity-control">
                            <button class="quantity-btn decrease" data-id="${product.id}">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn increase" data-id="${product.id}">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <button class="remove-item" data-id="${product.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;

            cartItemsContainer.appendChild(cartItem);
        }
    });

    if (cartTotalElement) cartTotalElement.textContent = `$${total.toFixed(2)}`;
}

// Add product to cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        showNotification('Product not found!');
        return;
    }

    if (product.stock <= 0) {
        showNotification('Product is out of stock!');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            showNotification(`Only ${product.stock} items available in stock!`);
            return;
        }
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            quantity: 1
        });
    }

    updateCartCount();
    renderCartItems();
    showNotification('Product added to cart!');
}

// Remove product from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartCount();
    renderCartItems();
    showNotification('Product removed from cart!');
}

// Update product quantity in cart
function updateCartQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);

    if (item && product) {
        const newQuantity = item.quantity + change;
        
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else if (newQuantity > product.stock) {
            showNotification(`Only ${product.stock} items available in stock!`);
        } else {
            item.quantity = newQuantity;
            updateCartCount();
            renderCartItems();
        }
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'error' ? 'var(--danger)' : 'var(--highlight)'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 2000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);

    // Animate out and remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// User authentication
async function registerUser(userData) {
    try {
        const data = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        currentUser = data.user;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        showNotification('Registration successful!');
        updateUserUI();
        if (document.getElementById('auth-modal')) {
            document.getElementById('auth-modal').classList.remove('active');
        }
        
        return true;
    } catch (error) {
        showNotification('Registration failed. Please try again.', 'error');
        return false;
    }
}

async function loginUser(credentials) {
    try {
        const data = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        currentUser = data.user;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        showNotification('Login successful!');
        updateUserUI();
        if (document.getElementById('auth-modal')) {
            document.getElementById('auth-modal').classList.remove('active');
        }
        
        return true;
    } catch (error) {
        showNotification('Invalid email or password!', 'error');
        return false;
    }
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    showNotification('Logged out successfully!');
    updateUserUI();
}

// Update UI based on user status
function updateUserUI() {
    const userMenu = document.querySelector('.user-menu');
    const userName = document.getElementById('user-name');
    const adminBtn = document.getElementById('admin-btn');

    if (!userMenu || !userName) return;

    if (currentUser) {
        userMenu.style.display = 'inline';
        if (document.getElementById('login-btn')) document.getElementById('login-btn').style.display = 'none';
        if (document.getElementById('register-btn')) document.getElementById('register-btn').style.display = 'none';
        
        userName.textContent = currentUser.name;
        
        if (adminBtn && currentUser.is_admin) {
            adminBtn.style.display = 'inline';
        } else if (adminBtn) {
            adminBtn.style.display = 'none';
        }
    } else {
        userMenu.style.display = 'none';
        if (document.getElementById('login-btn')) document.getElementById('login-btn').style.display = 'inline';
        if (document.getElementById('register-btn')) document.getElementById('register-btn').style.display = 'inline';
        if (adminBtn) adminBtn.style.display = 'none';
    }
}

// Check user status on page load
function checkUserStatus() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
        try {
            currentUser = JSON.parse(userData);
            updateUserUI();
            
            // Verify token is still valid
            verifyToken();
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    } else {
        updateUserUI();
    }
}

async function verifyToken() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const data = await apiCall('/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        currentUser = data.user;
        localStorage.setItem('user', JSON.stringify(data.user));
        updateUserUI();
    } catch (error) {
        // Token is invalid, logout user
        logoutUser();
    }
}

// Checkout process
async function processCheckout(orderData) {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return false;
    }
    
    if (!currentUser) {
        showNotification('Please log in to complete your order!', 'error');
        if (document.getElementById('auth-modal')) {
            document.getElementById('auth-modal').classList.add('active');
        }
        return false;
    }

    try {
        const token = localStorage.getItem('token');
        const orderPayload = {
            shipping_address: orderData.shipping,
            payment_method: orderData.payment.method,
            items: cart.map(item => ({
                product_id: item.id,
                quantity: item.quantity
            }))
        };

        const data = await apiCall('/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderPayload)
        });

        // Send SMS notification
        await sendSMSNotification(data.order);
        
        // Clear cart
        cart = [];
        updateCartCount();
        renderCartItems();
        
        return data.order;
    } catch (error) {
        showNotification('Checkout failed. Please try again.', 'error');
        return false;
    }
}

// Render checkout summary
function renderCheckoutSummary(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    let total = 0;
    
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
            const itemTotal = parseFloat(product.price) * item.quantity;
            total += itemTotal;
            
            const summaryItem = document.createElement('div');
            summaryItem.className = 'summary-item';
            summaryItem.innerHTML = `
                <span>${product.name} x ${item.quantity}</span>
                <span>$${itemTotal.toFixed(2)}</span>
            `;
            
            container.appendChild(summaryItem);
        }
    });
    
    // Update total
    if (document.getElementById('checkout-total')) document.getElementById('checkout-total').textContent = `$${total.toFixed(2)}`;
    if (document.getElementById('payment-total')) document.getElementById('payment-total').textContent = `$${total.toFixed(2)}`;
    if (document.getElementById('order-total')) document.getElementById('order-total').textContent = `$${total.toFixed(2)}`;
}

// Render order details
function renderOrderDetails(order) {
    const container = document.getElementById('order-details-items');
    if (!container) return;
    
    container.innerHTML = '';
    
    order.items.forEach(item => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.innerHTML = `
            <span>${item.name} x ${item.quantity}</span>
            <span>$${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
        `;
        
        container.appendChild(orderItem);
    });
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    if (searchInput && searchBtn) {
        const performSearch = () => {
            const query = searchInput.value.trim().toLowerCase();
            if (query.length < 2) return;

            const searchResults = products.filter(product => 
                product.name.toLowerCase().includes(query) ||
                product.description.toLowerCase().includes(query) ||
                product.category.toLowerCase().includes(query)
            );

            if (productsContainer) {
                productsContainer.innerHTML = '';
                if (searchResults.length === 0) {
                    productsContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--gray);">No products found matching your search.</p>';
                } else {
                    searchResults.forEach(product => {
                        const productCard = createProductCard(product);
                        productsContainer.appendChild(productCard);
                    });
                }
            }
        };

        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

// Setup event listeners
function setupEventListeners() {
    // Cart toggle
    const cartToggle = document.querySelector('.cart-toggle');
    const closeCart = document.querySelector('.close-cart');
    const overlay = document.querySelector('.overlay');

    if (cartToggle && closeCart && overlay) {
        cartToggle.addEventListener('click', () => {
            document.querySelector('.cart-modal').classList.add('active');
            overlay.classList.add('active');
            renderCartItems();
        });

        closeCart.addEventListener('click', () => {
            document.querySelector('.cart-modal').classList.remove('active');
            overlay.classList.remove('active');
        });

        overlay.addEventListener('click', () => {
            document.querySelector('.cart-modal').classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // Add to cart buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.add-to-cart')) {
            const productId = parseInt(e.target.closest('.add-to-cart').dataset.id);
            addToCart(productId);
        }

        // Remove from cart
        if (e.target.closest('.remove-item')) {
            const productId = parseInt(e.target.closest('.remove-item').dataset.id);
            removeFromCart(productId);
        }

        // Increase quantity
        if (e.target.closest('.increase')) {
            const productId = parseInt(e.target.closest('.increase').dataset.id);
            updateCartQuantity(productId, 1);
        }

        // Decrease quantity
        if (e.target.closest('.decrease')) {
            const productId = parseInt(e.target.closest('.decrease').dataset.id);
            updateCartQuantity(productId, -1);
        }
    });

    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Setup authentication event listeners
    setupAuthEventListeners();
    
    // Setup checkout event listeners
    setupCheckoutEventListeners();
    
    // Setup search
    setupSearch();

    // Newsletter form
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletter-email').value;

            if (email) {
                try {
                    await apiCall('/newsletter/subscribe', {
                        method: 'POST',
                        body: JSON.stringify({ email })
                    });
                    showNotification(`Thank you for subscribing with ${email}! You'll receive our latest updates soon.`);
                    newsletterForm.reset();
                } catch (error) {
                    showNotification('Subscription failed. Please try again.', 'error');
                }
            }
        });
    }
}

// Setup authentication event listeners
function setupAuthEventListeners() {
    // Auth modal
    if (document.getElementById('login-btn')) {
        document.getElementById('login-btn').addEventListener('click', (e) => {
            e.preventDefault();
            if (document.getElementById('auth-modal')) {
                document.getElementById('auth-modal').classList.add('active');
            }
        });
    }

    if (document.getElementById('register-btn')) {
        document.getElementById('register-btn').addEventListener('click', (e) => {
            e.preventDefault();
            if (document.getElementById('auth-modal')) {
                document.getElementById('auth-modal').classList.add('active');
                // Switch to register tab
                const authTabs = document.querySelectorAll('.auth-tab');
                if (authTabs) {
                    authTabs.forEach(tab => {
                        tab.classList.remove('active');
                    });
                    document.querySelector('.auth-tab[data-tab="register"]').classList.add('active');
                    
                    document.querySelectorAll('.auth-form').forEach(form => {
                        form.classList.remove('active');
                    });
                    document.getElementById('register-form').classList.add('active');
                }
            }
        });
    }

    const closeAuth = document.querySelector('.close-auth');
    if (closeAuth) {
        closeAuth.addEventListener('click', () => {
            if (document.getElementById('auth-modal')) {
                document.getElementById('auth-modal').classList.remove('active');
            }
        });
    }

    // Auth tabs
    const authTabs = document.querySelectorAll('.auth-tab');
    if (authTabs) {
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                
                // Update active tab
                authTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show corresponding form
                document.querySelectorAll('.auth-form').forEach(form => {
                    form.classList.remove('active');
                });
                document.getElementById(`${tabName}-form`).classList.add('active');
            });
        });
    }

    // Switch between login and register
    const switchToRegister = document.querySelector('.switch-to-register');
    const switchToLogin = document.querySelector('.switch-to-login');

    if (switchToRegister) {
        switchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            const authTabs = document.querySelectorAll('.auth-tab');
            if (authTabs) {
                authTabs.forEach(tab => tab.classList.remove('active'));
                document.querySelector('.auth-tab[data-tab="register"]').classList.add('active');
                
                document.querySelectorAll('.auth-form').forEach(form => {
                    form.classList.remove('active');
                });
                document.getElementById('register-form').classList.add('active');
            }
        });
    }

    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            const authTabs = document.querySelectorAll('.auth-tab');
            if (authTabs) {
                authTabs.forEach(tab => tab.classList.remove('active'));
                document.querySelector('.auth-tab[data-tab="login"]').classList.add('active');
                
                document.querySelectorAll('.auth-form').forEach(form => {
                    form.classList.remove('active');
                });
                document.getElementById('login-form').classList.add('active');
            }
        });
    }

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-password').value
            };
            
            await loginUser(formData);
        });
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('register-name').value,
                email: document.getElementById('register-email').value,
                password: document.getElementById('register-password').value,
                confirm_password: document.getElementById('register-confirm').value
            };
            
            await registerUser(formData);
        });
    }

    // Logout
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });
    }
}

// Setup checkout event listeners
function setupCheckoutEventListeners() {
    const checkoutBtn = document.querySelector('.checkout-btn');
    const closeCheckout = document.querySelector('.close-checkout');
    const continueToPayment = document.getElementById('continue-to-payment');
    const continueToConfirmation = document.getElementById('continue-to-confirmation');
    const closeCheckoutBtn = document.getElementById('close-checkout');
    const paymentMethods = document.querySelectorAll('.payment-method');

    // Checkout
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showNotification('Your cart is empty!', 'error');
                return;
            }
            
            if (!currentUser) {
                showNotification('Please log in to checkout!', 'error');
                if (document.getElementById('auth-modal')) {
                    document.getElementById('auth-modal').classList.add('active');
                }
                return;
            }
            
            if (document.getElementById('checkout-modal')) {
                document.getElementById('checkout-modal').classList.add('active');
            }
            renderCheckoutSummary('checkout-summary-items');
            renderCheckoutSummary('payment-summary-items');
        });
    }

    if (closeCheckout) {
        closeCheckout.addEventListener('click', () => {
            if (document.getElementById('checkout-modal')) {
                document.getElementById('checkout-modal').classList.remove('active');
            }
        });
    }

    // Checkout steps
    if (continueToPayment) {
        continueToPayment.addEventListener('click', () => {
            // Validate shipping form
            const shippingForm = document.getElementById('shipping-form');
            if (!shippingForm.checkValidity()) {
                shippingForm.reportValidity();
                return;
            }
            
            // Move to payment step
            const checkoutSteps = document.querySelectorAll('.checkout-step');
            if (checkoutSteps) {
                checkoutSteps.forEach(step => step.classList.remove('active'));
                document.querySelector('.checkout-step[data-step="payment"]').classList.add('active');
                
                const checkoutForms = document.querySelectorAll('.checkout-form');
                checkoutForms.forEach(form => form.classList.remove('active'));
                document.getElementById('payment-form').classList.add('active');
            }
        });
    }

    if (continueToConfirmation) {
        continueToConfirmation.addEventListener('click', async () => {
            // Validate payment form
            const paymentForm = document.getElementById('payment-form');
            if (!paymentForm.checkValidity()) {
                paymentForm.reportValidity();
                return;
            }
            
            // Process order
            const shippingData = {
                first_name: document.getElementById('shipping-firstname').value,
                last_name: document.getElementById('shipping-lastname').value,
                address: document.getElementById('shipping-address').value,
                city: document.getElementById('shipping-city').value,
                state: document.getElementById('shipping-state').value,
                zip_code: document.getElementById('shipping-zip').value,
                country: document.getElementById('shipping-country').value
            };
            
            const paymentData = {
                method: document.querySelector('.payment-method.active').getAttribute('data-method'),
                card_number: document.getElementById('card-number').value,
                expiry_date: document.getElementById('card-expiry').value,
                cvc: document.getElementById('card-cvc').value,
                name_on_card: document.getElementById('card-name').value
            };
            
            const order = await processCheckout({
                shipping: shippingData,
                payment: paymentData
            });
            
            if (order) {
                // Move to confirmation step
                const checkoutSteps = document.querySelectorAll('.checkout-step');
                if (checkoutSteps) {
                    checkoutSteps.forEach(step => step.classList.remove('active'));
                    document.querySelector('.checkout-step[data-step="confirmation"]').classList.add('active');
                    
                    const checkoutForms = document.querySelectorAll('.checkout-form');
                    checkoutForms.forEach(form => form.classList.remove('active'));
                    document.getElementById('confirmation-form').classList.add('active');
                    
                    // Render order details
                    renderOrderDetails(order);
                }
            }
        });
    }

    if (closeCheckoutBtn) {
        closeCheckoutBtn.addEventListener('click', () => {
            if (document.getElementById('checkout-modal')) {
                document.getElementById('checkout-modal').classList.remove('active');
            }
            
            // Reset checkout steps
            const checkoutSteps = document.querySelectorAll('.checkout-step');
            if (checkoutSteps) {
                checkoutSteps.forEach(step => step.classList.remove('active'));
                document.querySelector('.checkout-step[data-step="shipping"]').classList.add('active');
                
                const checkoutForms = document.querySelectorAll('.checkout-form');
                checkoutForms.forEach(form => form.classList.remove('active'));
                document.getElementById('shipping-form').classList.add('active');
            }
        });
    }

    // Payment methods
    if (paymentMethods) {
        paymentMethods.forEach(method => {
            method.addEventListener('click', () => {
                paymentMethods.forEach(m => m.classList.remove('active'));
                method.classList.add('active');
            });
        });
    }

    // Continue shopping button
    const viewCartBtn = document.querySelector('.view-cart-btn');
    if (viewCartBtn) {
        viewCartBtn.addEventListener('click', () => {
            document.querySelector('.cart-modal').classList.remove('active');
            const overlay = document.querySelector('.overlay');
            if (overlay) overlay.classList.remove('active');
        });
    }
}

// Fallback products if API is not available
function getFallbackProducts() {
    return [
        {
            id: 1,
            name: "Premium Running Shoes",
            description: "High-performance running shoes with advanced cushioning technology.",
            price: "89.99",
            original_price: "129.99",
            category: "fashion",
            image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            badge: "New",
            rating: 4.5,
            review_count: 128,
            stock: 15,
            featured: true
        },
        {
            id: 2,
            name: "Smart Watch Series 5",
            description: "Feature-rich smartwatch with health monitoring and connectivity.",
            price: "199.99",
            original_price: "249.99",
            category: "electronics",
            image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            badge: "Sale",
            rating: 4.0,
            review_count: 96,
            stock: 8,
            featured: true
        },
        // Add more fallback products as needed
    ];
}
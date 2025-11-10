// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.categories = [];
        this.products = [];
        this.orders = [];
        this.users = [];
        this.init();
    }

    async init() {
        await this.checkAdminAccess();
        await this.loadData();
        this.setupEventListeners();
        this.renderAllData();
    }

    async checkAdminAccess() {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            this.showError('Please log in to access admin panel');
            this.closeAdminPanel();
            return;
        }

        try {
            this.currentUser = JSON.parse(userData);
            if (!this.currentUser.is_admin) {
                this.showError('Access denied. Admin privileges required.');
                this.closeAdminPanel();
                return;
            }
        } catch (error) {
            this.showError('Error verifying admin access');
            this.closeAdminPanel();
        }
    }

    async loadData() {
        try {
            await Promise.all([
                this.loadCategories(),
                this.loadProducts(),
                this.loadOrders(),
                this.loadUsers(),
                this.loadWebsiteContent()
            ]);
        } catch (error) {
            this.showError('Failed to load data');
        }
    }

    async loadCategories() {
        const data = await this.apiCall('/categories');
        this.categories = data.categories;
        this.renderCategories();
    }

    async loadProducts() {
        const data = await this.apiCall('/products');
        this.products = data.products;
        this.renderProducts();
    }

    async loadOrders() {
        const token = localStorage.getItem('token');
        const data = await this.apiCall('/admin/orders', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        this.orders = data.orders;
        this.renderOrders();
    }

    async loadUsers() {
        const token = localStorage.getItem('token');
        const data = await this.apiCall('/admin/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        this.users = data.users;
        this.renderUsers();
    }

    async loadWebsiteContent() {
        const data = await this.apiCall('/website-content');
        this.populateWebsiteForm(data);
    }

    async apiCall(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    }

    setupEventListeners() {
        // Admin tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Add product form
        document.getElementById('add-product-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProduct();
        });

        // Add category form
        document.getElementById('add-category-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCategory();
        });

        // Website content form
        document.getElementById('website-content-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateWebsiteContent();
        });

        // Close admin panel
        document.getElementById('close-admin').addEventListener('click', () => {
            this.closeAdminPanel();
        });
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`.admin-tab[data-tab="${tabName}"]`).classList.add('active');

        // Show corresponding content
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    renderCategories() {
        const container = document.getElementById('admin-categories-container');
        if (!container) return;

        container.innerHTML = '';

        this.categories.forEach(category => {
            const categoryCard = document.createElement('div');
            categoryCard.className = 'admin-product-card';
            categoryCard.innerHTML = `
                <h4>${category.name}</h4>
                <p><i class="${category.icon}"></i> ${category.icon}</p>
                <div class="admin-product-actions">
                    <button class="admin-btn btn-edit" onclick="adminPanel.editCategory(${category.id})">Edit</button>
                    <button class="admin-btn btn-delete" onclick="adminPanel.deleteCategory(${category.id})">Delete</button>
                </div>
            `;
            container.appendChild(categoryCard);
        });

        // Populate category dropdown in product form
        const categorySelect = document.getElementById('product-category');
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name.toLowerCase();
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }

    renderProducts() {
        const container = document.getElementById('admin-products-container');
        if (!container) return;

        container.innerHTML = '';

        this.products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'admin-product-card';
            productCard.innerHTML = `
                <div class="product-image" style="height: 120px; margin-bottom: 15px;">
                    <img src="${product.image_url}" alt="${product.name}" style="max-height: 100%; max-width: 100%; object-fit: cover;">
                </div>
                <h4>${product.name}</h4>
                <p>${product.description}</p>
                <p><strong>Price:</strong> $${parseFloat(product.price).toFixed(2)}</p>
                <p><strong>Stock:</strong> ${product.stock}</p>
                <p><strong>Category:</strong> ${this.getCategoryName(product.category)}</p>
                <div class="admin-product-actions">
                    <button class="admin-btn btn-edit" onclick="adminPanel.editProduct(${product.id})">Edit</button>
                    <button class="admin-btn btn-delete" onclick="adminPanel.deleteProduct(${product.id})">Delete</button>
                </div>
            `;
            container.appendChild(productCard);
        });
    }

    renderOrders() {
        const container = document.getElementById('admin-orders-container');
        if (!container) return;

        container.innerHTML = '';

        this.orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'admin-product-card';
            orderCard.innerHTML = `
                <h4>Order #${order.id}</h4>
                <p><strong>Customer:</strong> ${order.customer_name}</p>
                <p><strong>Total:</strong> $${parseFloat(order.total_amount).toFixed(2)}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
                <div class="admin-product-actions">
                    <button class="admin-btn btn-edit" onclick="adminPanel.viewOrder(${order.id})">View Details</button>
                    <select onchange="adminPanel.updateOrderStatus(${order.id}, this.value)" style="padding: 5px; border-radius: 4px; border: 1px solid #ddd;">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            `;
            container.appendChild(orderCard);
        });
    }

    renderUsers() {
        const container = document.getElementById('admin-users-container');
        if (!container) return;

        container.innerHTML = '';

        this.users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'admin-product-card';
            userCard.innerHTML = `
                <h4>${user.name}</h4>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Role:</strong> ${user.is_admin ? 'Admin' : 'Customer'}</p>
                <p><strong>Joined:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
                <div class="admin-product-actions">
                    <button class="admin-btn btn-edit" onclick="adminPanel.editUser(${user.id})">Edit</button>
                    <button class="admin-btn btn-delete" onclick="adminPanel.deleteUser(${user.id})" ${user.is_admin ? 'disabled' : ''}>Delete</button>
                </div>
            `;
            container.appendChild(userCard);
        });
    }

    populateWebsiteForm(content) {
        document.getElementById('hero-title').value = content.hero_title || '';
        document.getElementById('hero-description').value = content.hero_description || '';
        document.getElementById('hero-background').value = content.hero_background || '';
    }

    getCategoryName(categoryId) {
        const category = this.categories.find(cat => cat.name.toLowerCase() === categoryId);
        return category ? category.name : 'Uncategorized';
    }

    async addProduct() {
        const formData = {
            name: document.getElementById('product-name').value,
            description: document.getElementById('product-description').value,
            price: parseFloat(document.getElementById('product-price').value),
            stock: parseInt(document.getElementById('product-stock').value),
            category: document.getElementById('product-category').value,
            image_url: document.getElementById('product-image').value,
            badge: document.getElementById('product-badge').value || null,
            rating: parseFloat(document.getElementById('product-rating').value) || 4.0
        };

        try {
            const token = localStorage.getItem('token');
            await this.apiCall('/admin/products', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            this.showSuccess('Product added successfully!');
            document.getElementById('add-product-form').reset();
            await this.loadProducts();
        } catch (error) {
            this.showError('Failed to add product');
        }
    }

    async addCategory() {
        const formData = {
            name: document.getElementById('category-name').value,
            icon: document.getElementById('category-icon').value
        };

        try {
            const token = localStorage.getItem('token');
            await this.apiCall('/admin/categories', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            this.showSuccess('Category added successfully!');
            document.getElementById('add-category-form').reset();
            await this.loadCategories();
        } catch (error) {
            this.showError('Failed to add category');
        }
    }

    async updateWebsiteContent() {
        const formData = {
            hero_title: document.getElementById('hero-title').value,
            hero_description: document.getElementById('hero-description').value,
            hero_background: document.getElementById('hero-background').value
        };

        try {
            const token = localStorage.getItem('token');
            await this.apiCall('/admin/website-content', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            this.showSuccess('Website content updated successfully!');
        } catch (error) {
            this.showError('Failed to update website content');
        }
    }

    async editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // Create edit form
        const newName = prompt('Enter new product name:', product.name);
        if (!newName) return;

        const newPrice = prompt('Enter new price:', product.price);
        if (!newPrice) return;

        const newStock = prompt('Enter new stock quantity:', product.stock);
        if (!newStock) return;

        try {
            const token = localStorage.getItem('token');
            await this.apiCall(`/admin/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newName,
                    price: parseFloat(newPrice),
                    stock: parseInt(newStock)
                })
            });

            this.showSuccess('Product updated successfully!');
            await this.loadProducts();
        } catch (error) {
            this.showError('Failed to update product');
        }
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const token = localStorage.getItem('token');
            await this.apiCall(`/admin/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            this.showSuccess('Product deleted successfully!');
            await this.loadProducts();
        } catch (error) {
            this.showError('Failed to delete product');
        }
    }

    async editCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return;

        const newName = prompt('Enter new category name:', category.name);
        if (!newName) return;

        const newIcon = prompt('Enter new icon class:', category.icon);
        if (!newIcon) return;

        try {
            const token = localStorage.getItem('token');
            await this.apiCall(`/admin/categories/${categoryId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newName,
                    icon: newIcon
                })
            });

            this.showSuccess('Category updated successfully!');
            await this.loadCategories();
        } catch (error) {
            this.showError('Failed to update category');
        }
    }

    async deleteCategory(categoryId) {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            const token = localStorage.getItem('token');
            await this.apiCall(`/admin/categories/${categoryId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            this.showSuccess('Category deleted successfully!');
            await this.loadCategories();
        } catch (error) {
            this.showError('Failed to delete category');
        }
    }

    async updateOrderStatus(orderId, status) {
        try {
            const token = localStorage.getItem('token');
            await this.apiCall(`/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            this.showSuccess('Order status updated successfully!');
            await this.loadOrders();
        } catch (error) {
            this.showError('Failed to update order status');
        }
    }

    viewOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        let orderDetails = `Order #${order.id}\n`;
        orderDetails += `Customer: ${order.customer_name}\n`;
        orderDetails += `Total: $${parseFloat(order.total_amount).toFixed(2)}\n`;
        orderDetails += `Status: ${order.status}\n`;
        orderDetails += `Date: ${new Date(order.created_at).toLocaleDateString()}\n\n`;
        orderDetails += 'Items:\n';

        order.items.forEach(item => {
            orderDetails += `- ${item.name} x ${item.quantity} - $${(parseFloat(item.price) * item.quantity).toFixed(2)}\n`;
        });

        alert(orderDetails);
    }

    async editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const makeAdmin = confirm(`Make ${user.name} an admin?`);

        try {
            const token = localStorage.getItem('token');
            await this.apiCall(`/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    is_admin: makeAdmin
                })
            });

            this.showSuccess('User updated successfully!');
            await this.loadUsers();
        } catch (error) {
            this.showError('Failed to update user');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const token = localStorage.getItem('token');
            await this.apiCall(`/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            this.showSuccess('User deleted successfully!');
            await this.loadUsers();
        } catch (error) {
            this.showError('Failed to delete user');
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'error' ? 'var(--danger)' : 'var(--success)'};
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

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    closeAdminPanel() {
        document.getElementById('admin-panel').style.display = 'none';
    }

    renderAllData() {
        this.renderCategories();
        this.renderProducts();
        this.renderOrders();
        this.renderUsers();
    }
}

// Initialize admin panel when DOM is loaded
let adminPanel;
document.addEventListener('DOMContentLoaded', function() {
    // Admin panel toggle
    const adminBtn = document.getElementById('admin-btn');
    if (adminBtn) {
        adminBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('admin-panel').style.display = 'block';
            if (!adminPanel) {
                adminPanel = new AdminPanel();
            }
        });
    }
});
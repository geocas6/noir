// Shopping cart management
class ShoppingCart {
    constructor() {
        this.items = this.loadCart();
        this.updateCartUI();
    }

    loadCart() {
        try {
            const raw = localStorage.getItem('noirCart');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    saveCart() {
        localStorage.setItem('noirCart', JSON.stringify(this.items));
    }

    addProduct(product) {
        const existing = this.items.find(i => i.id === product.id);
        if (existing) existing.quantity += 1;
        else this.items.push({ ...product, quantity: 1 });
        this.saveCart();
        this.updateCartUI();
        this.showNotification(`${product.name} agregado al carrito`);
    }

    getTotalItems() {
        return this.items.reduce((s, i) => s + i.quantity, 0);
    }

    getTotalPrice() {
        return this.items.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2);
    }

    // Update cart UI
    updateCartUI() {
        // Obtener todos los elementos del contador en la página
        const counters = document.querySelectorAll('#cart-count');
        // Calcular el número total de items en el carrito
        const total = this.getTotalItems();
        // Iterar sobre cada elemento contador para actualizarlo
        counters.forEach(el => {
            if (total > 0) {
                // Mostrar el badge con el contador
                el.textContent = total;
                // Aplicar estilos mejorados al badge: más pequeño e integrado
                el.style.position = 'absolute';
                el.style.top = '-8px';
                el.style.right = '-8px';
                el.style.backgroundColor = '#000';
                el.style.color = '#fff';
                el.style.borderRadius = '50%';
                el.style.width = '20px';
                el.style.height = '20px';
                el.style.minWidth = '20px';
                el.style.fontSize = '0.70rem';
                el.style.fontWeight = '700';
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.zIndex = '999';
                el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
                el.style.transform = 'scale(1)';
                el.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
                // Reproducir animación de "pop" cuando se agrega un item
                el.style.animation = 'cartBadgePop 0.5s ease-out';
            } else {
                // Ocultar el badge si el carrito está vacío
                el.style.display = 'none';
            }
        });
    }

    showNotification(message) {
        const n = document.createElement('div');
        n.className = 'noir-notification';
        n.textContent = message;
        n.style.cssText = 'position:fixed;top:140px;right:20px;background:#000;color:#fff;padding:0.9rem 1.2rem;border-radius:6px;z-index:4000;';
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 3000);
    }

    getItems() { return this.items; }

    removeItem(id) {
        this.items = this.items.filter(i => i.id !== id);
        this.saveCart();
        this.updateCartUI();
    }

    updateQuantity(id, qty) {
        const item = this.items.find(i => i.id === id);
        if (!item) return;
        if (qty <= 0) this.removeItem(id);
        else item.quantity = qty;
        this.saveCart();
        this.updateCartUI();
    }

    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateCartUI();
    }
}

// Utility functions
function parsePrice(text) {
    if (typeof text === 'number') return text;
    let s = String(text).replace(/[^0-9.,]/g, '').trim();
    if (!s) return 0;

    const hasDot = s.indexOf('.') !== -1;
    const hasComma = s.indexOf(',') !== -1;

    if (hasDot && hasComma) {
        s = s.replace(/\./g, '').replace(',', '.');
    } else if (hasComma && !hasDot) {
        if (/,\d{1,2}$/.test(s)) s = s.replace(',', '.');
        else s = s.replace(/,/g, '');
    } else if (hasDot && !hasComma) {
        if (/\.\d{1,2}$/.test(s)) {
        } else {
            s = s.replace(/\./g, '');
        }
    }

    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
}

function slugify(text) {
    return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Show cart modal
function showCartModal(cart) {
    const existing = document.getElementById('cart-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'cart-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;justify-content:flex-end;z-index:3000;';

    const panel = document.createElement('div');
    panel.className = 'cart-panel';
    panel.style.cssText = 'background:#fff;width:100%;max-width:420px;height:100vh;display:flex;flex-direction:column;animation:slideIn 0.35s forwards;';

    panel.innerHTML = `
        <div style="padding:1.25rem;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
            <h2 style="margin:0;font-weight:300;">Tu Carrito</h2>
            <button id="close-cart-btn" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#666;">×</button>
        </div>
        <div id="cart-items" style="flex:1;overflow:auto;padding:0.75rem;"></div>
        <div id="cart-footer" style="border-top:1px solid #eee;padding:1rem;"></div>
    `;

    modal.appendChild(panel);
    document.body.appendChild(modal);

    const closeModal = () => {
        panel.style.animation = 'slideOut 0.35s forwards';
        setTimeout(() => modal.remove(), 350);
    };

    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    panel.querySelector('#close-cart-btn').addEventListener('click', closeModal);

    const itemsContainer = panel.querySelector('#cart-items');
    const footer = panel.querySelector('#cart-footer');

    function render() {
        const current = cart.getItems();
        if (!current.length) {
            itemsContainer.innerHTML = '<p style="padding:2rem;color:#666;text-align:center">Tu carrito está vacío</p>';
            footer.innerHTML = '';
            return;
        }

        itemsContainer.innerHTML = current.map(i => `
            <div data-id="${i.id}" style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;border-bottom:1px solid #f0f0f0;">
                <div style="flex:1;">
                    <div style="font-weight:600;margin-bottom:0.25rem">${i.name}</div>
                    <div style="color:#666;font-size:0.95rem">Talle: ${i.size} | $${parseFloat(i.price).toFixed(2)} x ${i.quantity}</div>
                </div>
                <div style="text-align:right;min-width:110px;">
                    <div style="margin-bottom:0.5rem;font-weight:600">$${(i.price * i.quantity).toFixed(2)}</div>
                    <div style="display:flex;gap:0.4rem;justify-content:flex-end;">
                        <button class="decr" style="padding:0.3rem 0.6rem">−</button>
                        <input class="qty" value="${i.quantity}" style="width:44px;text-align:center;padding:0.25rem;border:1px solid #ddd" />
                        <button class="incr" style="padding:0.3rem 0.6rem">+</button>
                    </div>
                    <div><button class="remove" style="margin-top:0.4rem;background:none;border:none;color:#999;text-decoration:underline;cursor:pointer;font-size:0.9rem;">Eliminar</button></div>
                </div>
            </div>
        `).join('');

        itemsContainer.querySelectorAll('[data-id]').forEach(node => {
            const id = node.getAttribute('data-id');
            const btnIncr = node.querySelector('.incr');
            const btnDecr = node.querySelector('.decr');
            const inputQty = node.querySelector('.qty');
            const btnRemove = node.querySelector('.remove');

            btnIncr.addEventListener('click', () => { cart.updateQuantity(id, parseInt(inputQty.value || 0) + 1); render(); });
            btnDecr.addEventListener('click', () => { cart.updateQuantity(id, parseInt(inputQty.value || 0) - 1); render(); });
            inputQty.addEventListener('change', () => { const v = parseInt(inputQty.value || 0); cart.updateQuantity(id, isNaN(v) ? 0 : v); render(); });
            btnRemove.addEventListener('click', () => { cart.removeItem(id); render(); });
        });

        footer.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;font-weight:600"> 
                <span>Total:</span>
                <span>$${cart.getTotalPrice()}</span>
            </div>
            <!-- Botón para proceder al pago -->
            <button id="checkout-btn" style="width:100%;padding:0.9rem;background:#000;color:#fff;border:none;cursor:pointer;font-weight:600;margin-bottom:0.5rem">Proceder al Pago</button>
            <!-- Botón para limpiar el carrito -->
            <button id="clear-cart-btn" style="width:100%;padding:0.9rem;background:#f5f5f5;color:#000;border:none;cursor:pointer;font-weight:600">Limpiar Carrito</button>
        `;

        // Event listener para limpiar carrito
        footer.querySelector('#clear-cart-btn').addEventListener('click', () => { cart.clearCart(); render(); });

        // Event listener para proceder al pago
        footer.querySelector('#checkout-btn').addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true; 
            btn.textContent = 'Procesando...';
            await new Promise(r => setTimeout(r, 900));
            // Determinar la ruta correcta para payment.html
            const basePath = window.location.pathname.includes('/pages/') ? '' : 'pages/';
            window.location.href = basePath + 'payment.html';
        });
    }

    // Renderizar modal por primera vez
    render();
}

// Inject cart styles
if (!document.getElementById('noir-cart-styles')) {
    const style = document.createElement('style');
    style.id = 'noir-cart-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0 }
            to { transform: translateX(0); opacity: 1 }
        }

        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1 }
            to { transform: translateX(400px); opacity: 0 }
        }

        @keyframes cartBadgePop {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
        }

        .cart-panel { will-change: transform, opacity; }
        .noir-notification { transition: opacity .2s; }
        #cart-count { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    `;
    document.head.appendChild(style);
}

// Initialize cart
let cart;
document.addEventListener('DOMContentLoaded', () => {
    cart = new ShoppingCart();

    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const card = btn.closest('.product-card');
            if (!card) return;
            const nameEl = card.querySelector('.product-name');
            const priceEl = card.querySelector('.product-price');
            const name = nameEl ? nameEl.textContent.trim() : 'Producto';
            const price = priceEl ? parsePrice(priceEl.textContent) : 0;
            const id = slugify(name);
            cart.addProduct({ id, name, price });
        });
    });

    // Agregar evento click a todos los iconos del carrito
    document.querySelectorAll('.cart-icon').forEach(icon => {
        icon.addEventListener('click', () => showCartModal(cart));
    });
});




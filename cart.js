// 1. INICJALIZACJA KOSZYKA
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentDiscount = 0;

// 2. DODAWANIE DO KOSZYKA
function addToCart(name, price, img) {
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ name: name, price: price, img: img, qty: 1 });
    }
    updateCart();
    alert("Dodano " + name + " do koszyka!");
}

// 3. AKTUALIZACJA DANYCH I LICZNIKA
function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    
    const countElement = document.getElementById('cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

    if (countElement) {
        if (totalItems > 0) {
            countElement.innerText = totalItems;
            countElement.style.display = 'flex';
        } else {
            countElement.style.display = 'none';
        }
    }
    
    renderCartItems();
    checkShippingMethod(); // Wywołujemy przy każdej zmianie koszyka
}

// 4. RENDEROWANIE PRODUKTÓW
function renderCartItems() {
    const list = document.getElementById('cart-items-list');
    if(!list) return;
    
    if (cart.length === 0) {
        list.innerHTML = "<p style='text-align:center; color:#888; padding: 20px;'>Twój koszyk jest pusty.</p>";
    } else {
        let html = `
            <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
                <button onclick="clearCart()" style="background: none; border: none; color: #999; text-decoration: underline; cursor: pointer; font-size: 0.7rem; text-transform: uppercase;">Wyczyść koszyk</button>
            </div>
        `;

        html += cart.map((item, index) => `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom: 15px; border-bottom: 1px solid #f2f2f2;">
                <img src="${item.img}" width="60" height="60" style="object-fit:cover;">
                <div style="flex-grow:1; margin-left:20px; text-align: left;">
                    <p style="margin:0; font-weight:bold; font-size:0.85rem; text-transform:uppercase;">${item.name}</p>
                    <div style="display: flex; align-items: center; margin-top: 8px; gap: 10px;">
                        <button onclick="changeQty(${index}, -1)" style="width: 25px; height: 25px; border: 1px solid #ddd; background: white;">-</button>
                        <span style="font-weight: bold;">${item.qty}</span>
                        <button onclick="changeQty(${index}, 1)" style="width: 25px; height: 25px; border: 1px solid #ddd; background: white;">+</button>
                        <span style="margin-left: 10px; font-size: 0.85rem; color: #666;">x ${item.price.toFixed(2)} zł</span>
                    </div>
                </div>
                <button onclick="removeItem(${index})" style="background:none; border:none; cursor:pointer; font-size: 1.2rem; color: #ccc;">&times;</button>
            </div>
        `).join('');
        
        list.innerHTML = html;
    }
    calculateTotals();
}

function changeQty(index, delta) {
    if (cart[index]) {
        cart[index].qty += delta;
        if (cart[index].qty < 1) cart[index].qty = 1;
        updateCart();
    }
}

function removeItem(index) {
    cart.splice(index, 1);
    updateCart();
}

function clearCart() {
    if(confirm("Wyczyścić koszyk?")) {
        cart = [];
        updateCart();
        checkShippingMethod(); // <--- Dodaj to tutaj, żeby przycisk zszarzał po wyczyszczeniu
    }
}

// 6. OBLICZENIA
function calculateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const shippingSelect = document.getElementById('shipping-method');
    const shippingCost = shippingSelect ? parseFloat(shippingSelect.value) || 0 : 0;
    
    const discountAmount = subtotal * currentDiscount;
    const finalTotal = (subtotal - discountAmount) + shippingCost;
    
    const totalDisplay = document.getElementById('cart-total');
    if(totalDisplay) totalDisplay.innerText = finalTotal.toFixed(2) + " zł";

    if(document.getElementById('form-products')) {
        document.getElementById('form-products').value = cart.map(i => i.name + " (x" + i.qty + ")").join(', ');
        document.getElementById('form-total').value = finalTotal.toFixed(2) + " zł";
        document.getElementById('form-discount').value = (currentDiscount * 100) + "%";
    }
}

// 7. OBSŁUGA DOSTAWY (NAPRAWIONA)
function checkShippingMethod() {
    // Pobieramy elementy
    const select = document.getElementById('shipping-method');
    const orderBtn = document.querySelector('.checkout-btn');
    const paczkomatBox = document.getElementById('paczkomat-box');
    const addressBox = document.getElementById('address-box');
    
    // Jeśli nie ma selecta lub przycisku, przerywamy natychmiast bez błędu
    if (!select || !orderBtn) return;

    const method = select.value;

    // 1. Obsługa przycisku "Złóż zamówienie"
    if (method === "") {
        orderBtn.disabled = true;
        orderBtn.style.opacity = "0.5";
        orderBtn.style.cursor = "not-allowed";
        if (paczkomatBox) paczkomatBox.style.display = 'none';
        if (addressBox) addressBox.style.display = 'none';
        return; 
    } else {
        orderBtn.disabled = false;
        orderBtn.style.opacity = "1";
        orderBtn.style.cursor = "pointer";
    }

    // 2. Pobieramy pola dodatkowe (bezpiecznie)
    const pSearch = document.getElementById('paczkomat-search');
    const pPhone = document.getElementById('paczkomat-phone');

    // 3. Przełączanie widoczności
    if (method === "12") { // PACZKOMAT
        if (paczkomatBox) paczkomatBox.style.display = 'block';
        if (addressBox) addressBox.style.display = 'none';
        
        // Ustawiamy wymagalność tylko jeśli pola istnieją
        if (pSearch) pSearch.required = true;
        if (pPhone) pPhone.required = true;
        
        if (typeof setRequiredFields === "function") setRequiredFields(false);
    } 
    else if (method === "20") { // KURIER
        if (paczkomatBox) paczkomatBox.style.display = 'none';
        if (addressBox) addressBox.style.display = 'block';
        
        if (pSearch) pSearch.required = false;
        if (pPhone) pPhone.required = false;
        
        if (typeof setRequiredFields === "function") setRequiredFields(true);
    }
}

function setRequiredFields(isRequired) {
    const fields = ['street', 'house_no', 'zip', 'city', 'customer-phone'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.required = isRequired;
    });
}

// 8. OTWIERANIE KOSZYKA
function toggleCart() {
    const popup = document.getElementById('cart-popup');
    if (!popup) return;
    if (popup.style.display === 'none' || popup.style.display === '') {
        popup.style.display = 'flex';
        renderCartItems();
        checkShippingMethod(); // <--- DODAJ TĘ LINIĘ TUTAJ
    } else {
        popup.style.display = 'none';
    }
}
// Start skryptu - wywoływany przy każdym odświeżeniu strony
document.addEventListener('DOMContentLoaded', function() {
    // 1. Aktualizacja licznika na start
    updateCart(); 

    // 2. Obsługa menu mobilnego
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });

        // Zamknij menu po kliknięciu w link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });
    }
});
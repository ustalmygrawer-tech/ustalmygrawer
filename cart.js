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

// 3. AKTUALIZACJA DANYCH I LICZNIKÓW (PC + MOBILE)
function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Szukamy wszystkich liczników (id dla PC i klasa dla Mobile)
    const counts = document.querySelectorAll('#cart-count, .cart-badge');
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

    counts.forEach(el => {
        if (totalItems > 0) {
            el.innerText = totalItems;
            el.style.display = 'flex';
        } else {
            el.style.display = 'none';
        }
    });
    
    renderCartItems();
    calculateTotals();
    // Sprawdzamy metodę dostawy, aby przycisk zamówienia wiedział czy się odblokować
    if (document.getElementById('shipping-method')) {
        checkShippingMethod();
    }
}

// 4. RENDEROWANIE PRODUKTÓW (Z WPISYWANIEM RĘCZNYM)
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
                        <button onclick="changeQty(${index}, -1)" style="width: 25px; height: 25px; border: 1px solid #ddd; background: white; cursor: pointer;">-</button>
                        
                        <input type="number" 
                               value="${item.qty}" 
                               min="1" 
                               onchange="manualQty(${index}, this.value)"
                               style="width: 45px; text-align: center; border: 1px solid #ddd; font-weight: bold; padding: 2px;">
                        
                        <button onclick="changeQty(${index}, 1)" style="width: 25px; height: 25px; border: 1px solid #ddd; background: white; cursor: pointer;">+</button>
                        <span style="margin-left: 10px; font-size: 0.85rem; color: #666;">x ${item.price.toFixed(2)} zł</span>
                    </div>
                </div>
                <button onclick="removeItem(${index})" style="background:none; border:none; cursor:pointer; font-size: 1.2rem; color: #ccc;">&times;</button>
            </div>
        `).join('');
        
        list.innerHTML = html;
    }
}

// 5. FUNKCJE ZMIANY ILOŚCI
function changeQty(index, delta) {
    if (cart[index]) {
        cart[index].qty += delta;
        if (cart[index].qty < 1) cart[index].qty = 1;
        updateCart();
    }
}

function manualQty(index, value) {
    let newQty = parseInt(value);
    if (isNaN(newQty) || newQty < 1) newQty = 1;
    if (cart[index]) {
        cart[index].qty = newQty;
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
    }
}

// 6. OBLICZENIA TOTALI
function calculateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const shippingSelect = document.getElementById('shipping-method');
    const shippingCost = shippingSelect ? parseFloat(shippingSelect.value) || 0 : 0;
    
    const discountAmount = subtotal * currentDiscount;
    const finalTotal = (subtotal - discountAmount) + shippingCost;
    
    const totalDisplay = document.getElementById('cart-total');
    if(totalDisplay) totalDisplay.innerText = finalTotal.toFixed(2) + " zł";

    const formProducts = document.getElementById('form-products');
    if(formProducts) {
        formProducts.value = cart.map(i => i.name + " (x" + i.qty + ")").join(', ');
        document.getElementById('form-total').value = finalTotal.toFixed(2) + " zł";
        document.getElementById('form-discount').value = (currentDiscount * 100) + "%";
    }
}

// 7. OBSŁUGA DOSTAWY (Z ZABEZPIECZENIEM PUSTEGO KOSZYKA)
function checkShippingMethod() {
    const select = document.getElementById('shipping-method');
    const orderBtn = document.querySelector('.checkout-btn');
    const paczkomatBox = document.getElementById('paczkomat-box');
    const addressBox = document.getElementById('address-box');

    if (!select || !orderBtn) return;

    const method = select.value;
    const isCartEmpty = cart.length === 0; // Sprawdzamy, czy tablica cart jest pusta

    // 1. Warunek blokady: jeśli nie wybrano metody LUB koszyk jest pusty
    if (method === "" || isCartEmpty) {
        orderBtn.disabled = true;
        orderBtn.style.opacity = "0.5";
        orderBtn.style.cursor = "not-allowed";
        
        // Jeśli koszyk jest pusty, możemy dodać podpowiedź (dymek)
        if (isCartEmpty) {
            orderBtn.title = "Dodaj produkty do koszyka, aby złożyć zamówienie";
        }

        if (paczkomatBox) paczkomatBox.style.display = 'none';
        if (addressBox) addressBox.style.display = 'none';
        return; 
    } else {
        // Jeśli wybrano metodę i są produkty – aktywujemy
        orderBtn.disabled = false;
        orderBtn.style.opacity = "1";
        orderBtn.style.cursor = "pointer";
        orderBtn.title = "";
    }

    // 2. Wybór sekcji formularza
    if (method === "12") { // PACZKOMAT
        if (paczkomatBox) paczkomatBox.style.display = 'block';
        if (addressBox) addressBox.style.display = 'none';
        setRequiredFields(false);
    } 
    else if (method === "20") { // KURIER
        if (paczkomatBox) paczkomatBox.style.display = 'none';
        if (addressBox) addressBox.style.display = 'block';
        setRequiredFields(true);
    }
    
    calculateTotals(); 
}

function setRequiredFields(isKurier) {
    const fields = ['street', 'house_no', 'zip', 'city', 'customer-phone'];
    const pFields = ['paczkomat-search', 'paczkomat-phone'];

    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.required = isKurier;
    });

    pFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.required = !isKurier;
    });
}

// 8. OTWIERANIE/ZAMYKANIE KOSZYKA
function toggleCart() {
    const cartPopup = document.getElementById('cart-popup');
    const body = document.body;

    if (cartPopup.style.display === 'none' || cartPopup.style.display === '') {
        cartPopup.style.display = 'flex';
        body.style.overflow = 'hidden'; // Blokujemy przewijanie tła
    } else {
        cartPopup.style.display = 'none';
        body.style.overflow = 'visible'; // Zmieniamy z auto/hidden na visible
        body.style.overflowX = 'hidden'; // Upewniamy się, że poziom zostaje zablokowany
    }
}
// POWIĘKSZANIE ZDJĘĆ
function openImage(src) {
    const overlay = document.getElementById('image-overlay');
    const overlayImg = document.getElementById('overlay-img');
    if (overlay && overlayImg) {
        overlayImg.src = src;
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Blokujemy przewijanie strony pod spodem
    }
}

function closeImage() {
    const overlay = document.getElementById('image-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto'; // Przywracamy przewijanie
    }
}
// --- OBSŁUGA STRZAŁEK W SLIDERZE MOBILNYM ---
// 1. ZMIENNA TRZYMAJĄCA AKTUALNY NUMER ZDJĘCIA
let currentSlideIndex = 0;

// 2. FUNKCJA OBSŁUGUJĄCA KLIKNIĘCIE W STRZAŁKI
function moveSlider(direction) {
    const sliderGrid = document.getElementById('productSlider');
    if (!sliderGrid) return;
    
    const slides = sliderGrid.querySelectorAll('.main-photo, .side-photo-item');
    
    currentSlideIndex += direction;
    
    // Zabezpieczenie, żeby nie wyjść poza zakres zdjęć
    if (currentSlideIndex < 0) currentSlideIndex = 0;
    if (currentSlideIndex >= slides.length) currentSlideIndex = slides.length - 1;

    // Płynne przewijanie do wybranego zdjęcia
    sliderGrid.scrollTo({
        left: sliderGrid.offsetWidth * currentSlideIndex,
        behavior: 'smooth'
    });

    // Odświeżenie widoczności strzałek
    updateArrowVisibility(slides.length);
}

// 3. FUNKCJA ODŚWIEŻAJĄCA WIDOCZNOŚĆ (Smart Arrows)
function updateArrowVisibility(totalSlides) {
    const prevBtn = document.getElementById('prevArrow');
    const nextBtn = document.getElementById('nextArrow');
    
    if (!prevBtn || !nextBtn) return;

    // Ukryj lewą na pierwszym zdjęciu, pokaż na pozostałych
    prevBtn.style.display = (currentSlideIndex === 0) ? 'none' : 'flex';

    // Ukryj prawą na ostatnim zdjęciu, pokaż na pozostałych
    nextBtn.style.display = (currentSlideIndex === totalSlides - 1) ? 'none' : 'flex';
}

// 4. NASŁUCHIWANIE NA PRZESUWANIE PALCEM (SWIPE)
const sliderGrid = document.getElementById('productSlider');
if (sliderGrid) {
    sliderGrid.addEventListener('scroll', function() {
        const slideWidth = this.offsetWidth;
        // Obliczamy nowy indeks na podstawie tego, jak daleko użytkownik przesunął palcem
        const newIndex = Math.round(this.scrollLeft / slideWidth);
        
        if (newIndex !== currentSlideIndex) {
            currentSlideIndex = newIndex;
            const slides = this.querySelectorAll('.main-photo, .side-photo-item');
            updateArrowVisibility(slides.length);
        }
    }, { passive: true });
}
// Odświeżanie roku w stopce © 2026 Ustalmy Grawer. Wszelkie prawa zastrzeżone
// Ten kod czeka, aż cała struktura strony (HTML) będzie gotowa
document.addEventListener("DOMContentLoaded", function() {
    const yearElement = document.getElementById("current-year");
    
    // Sprawdzamy, czy element na pewno istnieje, żeby nie było błędu
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});

// 9. START SKRYPTU
document.addEventListener('DOMContentLoaded', function() {
    updateCart(); 

    // Menu mobilne
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
        menuToggle.style.zIndex = "10002"; 
    });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });
    }
});
document.addEventListener('DOMContentLoaded', function() {
    // Wybieramy wszystkie linki, które zaczynają się od #
    const scrollLinks = document.querySelectorAll('a[href^="#"]');

    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            // Ignorujemy same '#' (często używane w menu)
            if (targetId === "#") return;

            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault(); // Zatrzymujemy szybki skok
                
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                const startPosition = window.pageYOffset;
                const distance = targetPosition - startPosition;
                const duration = 1800; // Czas zjazdu (1.8 sekundy)
                let start = null;

                window.requestAnimationFrame(step);

                function step(timestamp) {
                    if (!start) start = timestamp;
                    const progress = timestamp - start;
                    window.scrollTo(0, easeInOutCubic(progress, startPosition, distance, duration));
                    if (progress < duration) window.requestAnimationFrame(step);
                }

                function easeInOutCubic(t, b, c, d) {
                    t /= d/2;
                    if (t < 1) return c/2*t*t*t + b;
                    t -= 2;
                    return c/2*(t*t*t + 2) + b;
                }
            }
        });
    });
});
function fixMobileNav() {
    if (window.innerWidth <= 768) {
        const nav = document.querySelector('.navbar');
        if (nav && nav.style.position !== 'fixed') {
            nav.style.setProperty('position', 'fixed', 'important');
            nav.style.setProperty('top', '0', 'important');
            nav.style.setProperty('transform', 'none', 'important');
        }
    }
}

window.addEventListener('scroll', fixMobileNav, { passive: true });
window.addEventListener('resize', fixMobileNav);
document.querySelectorAll('.footer-column h3').forEach(header => {
    header.addEventListener('click', () => {
        if (window.innerWidth <= 768) { // Działa tylko na telefonach
            const parent = header.parentElement;
            parent.classList.toggle('active');
        }
    });
});
document.addEventListener('DOMContentLoaded', function() {
    const footerHeaders = document.querySelectorAll('.footer-column h3');
    
    footerHeaders.forEach(header => {
        header.addEventListener('click', function() {
            // Sprawdzamy czy jesteśmy na mobile (szerokość ekranu)
            if (window.innerWidth <= 768) {
                const parent = this.parentElement;
                
                // Opcjonalnie: zamyka inne sekcje gdy otwierasz nową (efekt akordeonu)
                document.querySelectorAll('.footer-column').forEach(col => {
                    if (col !== parent) col.classList.remove('active');
                });

                // Przełącza klasę active na klikniętym elemencie
                parent.classList.toggle('active');
            }
        });
    });
});
// 1. INICJALIZACJA KOSZYKA
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentDiscount = 0;

// Funkcja zbiorcza - wywołuj ją zawsze po zmianie zawartości koszyka
function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart)); // Zapisuje zmiany
    renderCartItems();      // Odświeża listę produktów
    calculateTotals();      // Liczy sumę końcową
    checkShippingMethod();  // Sprawdza blokady przycisku i pola
    updateCartBadge();      // <--- TEJ LINII BRAKOWAŁO NA DOLE PLIKU!
}

// 2. DODAWANIE DO KOSZYKA
function addToCart(name, price, img) {
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.qty += 1; // Upewnij się, że tu jest .qty a nie .quantity
    } else {
        cart.push({ name: name, price: price, img: img, qty: 1 });
    }
    updateCart();
    alert("Dodano " + name + " do koszyka!");
}

// 3. LICZNIK PRZY IKONIE KOSZYKA
function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    
    if (totalQty > 0) {
        badge.innerText = totalQty;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
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
                        <button onclick="changeQty(${index}, -1)" style="width: 25px; height: 25px; border: 1px solid #ddd; background: white; cursor: pointer;">-</button>
                        <input type="number" value="${item.qty}" min="1" onchange="manualQty(${index}, this.value)" style="width: 45px; text-align: center; border: 1px solid #ddd; font-weight: bold; padding: 2px;">
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
    const shippingCost = (shippingSelect && shippingSelect.value !== "") ? parseFloat(shippingSelect.value) : 0;
    
    const finalTotal = subtotal + shippingCost;
    
    const totalDisplay = document.getElementById('cart-total');
    if(totalDisplay) totalDisplay.innerText = finalTotal.toFixed(2) + " zł";

    const formProducts = document.getElementById('form-products');
    if(formProducts) {
        formProducts.value = cart.map(i => i.name + " (x" + i.qty + ")").join(', ');
        const formTotalEl = document.getElementById('form-total');
        if(formTotalEl) formTotalEl.value = finalTotal.toFixed(2) + " zł";
    }
}

// 7. OBSŁUGA DOSTAWY
function checkShippingMethod() {
    const select = document.getElementById('shipping-method');
    const orderBtn = document.querySelector('.checkout-btn');
    const paczkomatBox = document.getElementById('paczkomat-box');
    const addressBox = document.getElementById('address-box');

    if (!select || !orderBtn) return;

    const method = select.value;
    const isCartEmpty = cart.length === 0;

    // Pobieramy wszystkie pola input z obu sekcji, aby nimi zarządzać
    const paczkomatInputs = paczkomatBox ? paczkomatBox.querySelectorAll('input') : [];
    const addressInputs = addressBox ? addressBox.querySelectorAll('input') : [];

    if (method === "" || isCartEmpty) {
        orderBtn.disabled = true;
        orderBtn.style.opacity = "0.5";
        orderBtn.style.cursor = "not-allowed";
        if (paczkomatBox) paczkomatBox.style.display = 'none';
        if (addressBox) addressBox.style.display = 'none';
    } else {
        orderBtn.disabled = false;
        orderBtn.style.opacity = "1";
        orderBtn.style.cursor = "pointer";

        if (method === "12") { // PACZKOMAT
            if (paczkomatBox) paczkomatBox.style.display = 'block';
            if (addressBox) addressBox.style.display = 'none';
            
            // Aktywujemy required tylko dla paczkomatu
            paczkomatInputs.forEach(input => input.required = true);
            addressInputs.forEach(input => input.required = false);

        } else if (method === "20") { // KURIER
            if (paczkomatBox) paczkomatBox.style.display = 'none';
            if (addressBox) addressBox.style.display = 'block';
            
            // Aktywujemy required tylko dla kuriera (oprócz numeru mieszkania)
            paczkomatInputs.forEach(input => input.required = false);
            addressInputs.forEach(input => {
                if (input.name !== 'apt_no') input.required = true;
            });
        }
    }
    calculateTotals(); 
}

// 8. OTWIERANIE/ZAMYKANIE
function toggleCart() {
    const modal = document.getElementById("cart-popup");
    if (modal.style.display === "none" || modal.style.display === "") {
        modal.style.display = "flex";
        document.body.style.overflow = "hidden"; // Blokada przewijania tła
    } else {
        modal.style.display = "none";
        document.body.style.overflow = ""; // Przywrócenie domyślnego zachowania
        document.body.style.width = "100%"; // Wymuszenie poprawnej szerokości
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

// 9. START SKRYPTU
document.addEventListener('DOMContentLoaded', function() {
    updateCart(); // To wywoła renderowanie, liczenie i badge za jednym razem
    
    // Obsługa Menu mobilnego
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // Inicjalizacja roku w stopce
    const yearElement = document.getElementById("current-year");
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
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

// Link do Twojego skryptu Google (WKLEJ TU SWÓJ ADRES)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyDFCFewwwFV1-eaMse4wIK8duVdVqGGeeVpfpLVLbWu0NxD4sGeposvsFBGshqJGb2/exec';      
document.getElementById('checkout-form').addEventListener('submit', function(e) {
    const termsAccepted = document.getElementById('terms-accept').checked;

    if (!termsAccepted) {
        e.preventDefault(); // Zatrzymujemy wysyłkę
        alert("Prosimy o zaakceptowanie regulaminu i polityki prywatności.");
        return;
    }
    
    e.preventDefault(); // Zatrzymujemy wysyłkę do Formspree

    // Pobieramy przycisk, aby go zablokować (zapobiega podwójnemu kliknięciu)
    const submitBtn = document.querySelector('.checkout-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Wysyłanie...";
    }

    // 2. GENEROWANIE NUMERU ZAMÓWIENIA
    const d = new Date();
    const dateStr = d.getFullYear() + (d.getMonth() + 1).toString().padStart(2, '0') + d.getDate().toString().padStart(2, '0');
    const randomStr = Math.floor(1000 + Math.random() * 9000);
    const orderID = `UG-${dateStr}-${randomStr}`;

    // 3. ZBIERANIE DANYCH Z FORMULARZA
    const formData = new FormData(this);
    const formEntries = Object.fromEntries(formData.entries());
    
    // Sprawdzamy metodę dostawy
    const shippingMethodVal = document.getElementById('shipping-method').value;
    const isPaczkomat = (shippingMethodVal === "12");

    // Przygotowanie obiektu z danymi do Arkusza Google
    const dataToSheet = {
        Numer_Zamowienia: orderID,
        name: formEntries.name,
        email: formEntries.email,
        Produkty: document.getElementById('form-products').value || "Brak danych o produktach",
        Suma_Calkowita: document.getElementById('cart-total').innerText,
        Metoda_Dostawy: isPaczkomat ? "Paczkomat InPost" : "Kurier InPost",
        
        // Pola zależne od wyboru dostawy
        Nr_Paczkomatu: isPaczkomat ? (document.getElementById('paczkomat-search').value || "Nie podano") : "---",
        street_full: isPaczkomat ? "---" : `${formEntries.street || ''} ${formEntries.house_no || ''}${formEntries.apt_no ? '/' + formEntries.apt_no : ''}`,
        zip: isPaczkomat ? "---" : (formEntries.zip || ''),
        city: isPaczkomat ? "---" : (formEntries.city || ''),
        
        // Telefon (wybieramy ten, który został wypełniony)
        Telefon: isPaczkomat ? (document.getElementById('paczkomat-phone').value || formEntries.phone) : (formEntries.phone || document.getElementById('paczkomat-phone').value)
    };

    // 4. WYSYŁKA DO GOOGLE SHEETS
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Wymagane przez Google Apps Script
        cache: 'no-cache',
        body: JSON.stringify(dataToSheet)
    })
    .then(() => {
        // Czyścimy koszyk z pamięci przeglądarki
        localStorage.removeItem('cart');
        
        // 5. PRZEKIEROWANIE NA STRONĘ PODZIĘKOWANIA
        // Przekazujemy numer i imię w linku, aby strona podziękowania mogła je wyświetlić
        const nextUrl = `dziekujemy.html?order=${orderID}&name=${encodeURIComponent(formEntries.name)}`;
        window.location.href = nextUrl;
    })
    .catch(error => {
        console.error('Błąd wysyłki:', error);
        alert("Wystąpił problem z wysłaniem zamówienia. Prosimy o kontakt mailowy.");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Złóż zamówienie";
        }
    });
});

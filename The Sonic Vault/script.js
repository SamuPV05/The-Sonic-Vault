// ==========================================
// SCROLL HORIZONTAL (Código anterior)
// ==========================================
function scrollGrid(id, direction) {
    const grid = document.getElementById(id);
    if(grid) {
        const scrollAmount = 300; 
        grid.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
}

// ==========================================
// LÓGICA DEL CARRITO DE COMPRAS
// ==========================================
let cart = []; // Nuestro estado principal

// 1. Abrir/Cerrar el panel lateral
function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('open');
}

// 2. Escuchar clics en todos los botones "Añadir +"
// Usamos event delegation por si cargamos productos dinámicamente luego
document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('add-btn')) {
        // Encontrar la tarjeta (card) más cercana al botón que se hizo clic
        const card = e.target.closest('.card');
        
        // Extraer la información del DOM
        const name = card.querySelector('h3').innerText;
        const priceText = card.querySelector('.price').innerText;
        const price = parseFloat(priceText.replace('$', '')); // Convertir "$50.00" a 50.00
        const img = card.querySelector('img').src;

        addToCart(name, price, img);
        
        // Efecto visual rápido en el botón
        const originalText = e.target.innerText;
        e.target.innerText = "¡Añadido!";
        e.target.style.background = "var(--accent-color)";
        e.target.style.color = "black";
        
        setTimeout(() => {
            e.target.innerText = originalText;
            e.target.style.background = "transparent";
            e.target.style.color = "white";
        }, 1000);
    }
});

// 3. Añadir el objeto al arreglo del carrito
function addToCart(name, price, img) {
    // Revisar si el producto ya está en el carrito
    const existingItem = cart.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.qty++; // Si existe, sumamos 1 a la cantidad
    } else {
        // Si no existe, lo creamos como un nuevo objeto
        cart.push({ name: name, price: price, img: img, qty: 1 });
    }
    
    updateCartUI(); // Actualizar la vista
    document.getElementById('cart-sidebar').classList.add('open'); // Abrir el carrito
}

// 4. Renderizar el carrito en el HTML
function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const cartCount = document.getElementById('cart-count');
    
    // Limpiar el contenedor antes de volver a dibujar
    cartItemsContainer.innerHTML = '';
    
    let total = 0;
    let count = 0;

    // Dibujar cada item del arreglo
    cart.forEach((item, index) => {
        total += item.price * item.qty;
        count += item.qty;
        
        cartItemsContainer.innerHTML += `
            <div class="cart-item">
                <img src="${item.img}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>$${item.price.toFixed(2)} <span style="color:#888; font-size:0.8rem;">x ${item.qty}</span></p>
                    <button class="remove-btn" onclick="removeFromCart(${index})">Eliminar</button>
                </div>
            </div>
        `;
    });

    // Actualizar los números en la interfaz
    cartTotalPrice.innerText = total.toFixed(2);
    cartCount.innerText = count;
}

// 5. Eliminar un producto por su índice en el arreglo
function removeFromCart(index) {
    cart.splice(index, 1); // Quitar 1 elemento en la posición 'index'
    updateCartUI();
}

// ==========================================
// BEAT IT (Borrador Visual)
// ==========================================
document.querySelectorAll('.pad').forEach(pad => {
    pad.addEventListener('click', function() {
        this.style.backgroundColor = '#00f2ff';
        this.style.color = '#000';
        setTimeout(() => {
            this.style.backgroundColor = '#111';
            this.style.color = '#00f2ff';
        }, 150);
    });
});
const foodGrid = document.getElementById("food-grid");
const categoriesBox = document.getElementById("categories");
const searchInput = document.getElementById("search");
const cartCount = document.getElementById("cart-count");
const cartSection = document.getElementById("cart-section");
const cartItems = document.getElementById("cart-items");
const cartSummary = document.getElementById("cart-summary");

let menuData;
let activeCategory = "All";
let cart = [];

const money = amount =>
  `${menuData.restaurant.currency}${amount.toFixed(2)}`;

async function loadMenu() {
  try {
    const response = await fetch("./foods.json");

    if (!response.ok) {
      throw new Error("Could not load foods.json");
    }

    menuData = await response.json();

    document.title = `${menuData.restaurant.name} | Food Ordering`;
    document.querySelector(".logo").innerHTML =
      `🍽️ ${menuData.restaurant.name}`;

    renderCategories();
    renderFoods();
  } catch (error) {
    foodGrid.innerHTML = `
      <p>Unable to load the menu. Please run the app
      through a local web server and check foods.json.</p>
    `;
    console.error(error);
  }
}

function renderCategories() {
  categoriesBox.innerHTML = menuData.categories
    .map(category => `
      <button
        class="category-button ${category === activeCategory ? "active" : ""}"
        data-category="${category}">
        ${category}
      </button>
    `).join("");
}

function renderFoods() {
  const term = searchInput.value.trim().toLowerCase();

  const filtered = menuData.foods.filter(food => {
    const matchesCategory =
      activeCategory === "All" ||
      food.category === activeCategory;

    const matchesSearch =
      food.name.toLowerCase().includes(term) ||
      food.description.toLowerCase().includes(term) ||
      food.category.toLowerCase().includes(term);

    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    foodGrid.innerHTML = "<p>No food found. Try another search.</p>";
    return;
  }

  foodGrid.innerHTML = filtered.map(food => `
    <article class="food-card">
      <div class="food-art"
           style="background:${food.color}">
        ${food.emoji}
      </div>
      <div class="food-details">
        <div class="food-meta">
          <h3>${food.name}</h3>
          <span class="rating">★ ${food.rating}</span>
        </div>
        <p class="description">${food.description}</p>
        <div class="food-bottom">
          <span class="price">${money(food.price)}</span>
          <button class="add-button" data-add="${food.id}">
            + Add
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

function addToCart(id) {
  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ id, quantity: 1 });
  }

  renderCart();
}

function changeQuantity(id, amount) {
  const item = cart.find(item => item.id === id);
  if (!item) return;

  item.quantity += amount;
  cart = cart.filter(item => item.quantity > 0);

  renderCart();
}

function renderCart() {
  const quantity = cart.reduce(
    (total, item) => total + item.quantity, 0
  );

  cartCount.textContent = quantity;

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Your basket is empty. Add something tasty!</p>";
    cartSummary.innerHTML = "";
    return;
  }

  cartItems.innerHTML = cart.map(item => {
    const food = menuData.foods.find(f => f.id === item.id);

    return `
      <div class="cart-row">
        <div>
          <strong>${food.emoji} ${food.name}</strong>
          <div>${money(food.price)} each</div>
        </div>
        <div class="quantity-controls">
          <button data-change="${food.id}" data-amount="-1"
                  aria-label="Decrease ${food.name}">−</button>
          <span>${item.quantity}</span>
          <button data-change="${food.id}" data-amount="1"
                  aria-label="Increase ${food.name}">+</button>
        </div>
        <strong>${money(food.price * item.quantity)}</strong>
      </div>
    `;
  }).join("");

  const subtotal = cart.reduce((total, item) => {
    const food = menuData.foods.find(f => f.id === item.id);
    return total + food.price * item.quantity;
  }, 0);

  const delivery = menuData.restaurant.deliveryFee;
  const total = subtotal + delivery;

  cartSummary.innerHTML = `
    <div class="cart-total">
      <div class="total-line">
        <span>Subtotal</span><span>${money(subtotal)}</span>
      </div>
      <div class="total-line">
        <span>Delivery fee</span><span>${money(delivery)}</span>
      </div>
      <div class="total-line grand-total">
        <span>Total</span><span>${money(total)}</span>
      </div>
    </div>
  `;
}

categoriesBox.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;

  activeCategory = button.dataset.category;
  renderCategories();
  renderFoods();
});

searchInput.addEventListener("input", renderFoods);

foodGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(Number(button.dataset.add));
});

cartItems.addEventListener("click", event => {
  const button = event.target.closest("[data-change]");
  if (!button) return;

  changeQuantity(
    Number(button.dataset.change),
    Number(button.dataset.amount)
  );
});

document.getElementById("cart-toggle").addEventListener("click", () => {
  cartSection.hidden = false;
  cartSection.scrollIntoView({ behavior: "smooth" });
});

document.getElementById("close-cart").addEventListener("click", () => {
  cartSection.hidden = true;
});

document.getElementById("checkout").addEventListener("click", () => {
  const message = document.getElementById("checkout-message");

  if (cart.length === 0) {
    message.textContent = "Your basket is empty.";
    return;
  }

  const itemCount = cart.reduce(
    (sum, item) => sum + item.quantity, 0
  );

  message.textContent =
    `Order summary ready: ${itemCount} item(s). ` +
    "Connect a backend or payment provider to place a real order.";
});

loadMenu();
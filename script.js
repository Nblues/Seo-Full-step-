// --- CONFIG (ตั้งค่า Shopify) ---
const SHOPIFY_DOMAIN = "kn-goodcar.com";
const STOREFRONT_ACCESS_TOKEN = "bb70cb008199a94b83c98df0e45ada67";
const PRODUCTS_PER_PAGE = 6;

// --- ดึงข้อมูลรถจาก Shopify ---
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;

async function fetchProducts() {
  const query = `
    {
      products(first: 100) {
        edges {
          node {
            id
            title
            description
            handle
            images(first: 1) { edges { node { url } } }
            variants(first: 1) { edges { node { price { amount } } } }
          }
        }
      }
    }
  `;
  const res = await fetch(`https://${SHOPIFY_DOMAIN}/api/2023-10/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  allProducts = json.data.products.edges.map(edge => ({
    title: edge.node.title,
    description: edge.node.description,
    handle: edge.node.handle,
    image: edge.node.images.edges[0]?.node.url || "",
    price: edge.node.variants.edges[0]?.node.price.amount || "",
  }));
  filteredProducts = allProducts;
  renderProducts();
  renderPagination();
}

// --- ฟังก์ชันแสดงรถ ---
function renderProducts() {
  const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const end = start + PRODUCTS_PER_PAGE;
  const items = filteredProducts.slice(start, end);
  const html = items.map(car => `
    <div class="car-card">
      <img src="${car.image}" alt="${car.title}" loading="lazy" width="300">
      <div class="car-info">
        <h2>${car.title}</h2>
        <div class="car-price">฿${parseInt(car.price).toLocaleString()}</div>
        <p class="car-desc">${car.description}</p>
        <a class="car-link" href="https://${SHOPIFY_DOMAIN}/products/${car.handle}" target="_blank" rel="nofollow">ดูรายละเอียด</a>
      </div>
    </div>
  `).join("");
  document.getElementById("product-list").innerHTML = html || "<p style='text-align:center'>ไม่พบรถที่ค้นหา</p>";
}

// --- Pagination ---
function renderPagination() {
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  let html = "";
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn${i === currentPage ? " active" : ""}" onclick="goToPage(${i})">${i}</button>`;
  }
  document.getElementById("pagination").innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  renderProducts();
  renderPagination();
}

// --- Filter & Search ---
function applyFilters() {
  const brand = document.getElementById("filter-brand").value.toLowerCase();
  const keyword = document.getElementById("filter-keyword").value.toLowerCase();
  filteredProducts = allProducts.filter(car => {
    const matchesBrand = !brand || car.title.toLowerCase().includes(brand);
    const matchesKeyword = !keyword || car.title.toLowerCase().includes(keyword) || car.description.toLowerCase().includes(keyword);
    return matchesBrand && matchesKeyword;
  });
  currentPage = 1;
  renderProducts();
  renderPagination();
}

// --- เริ่มโหลดหน้าเว็บ ---
window.onload = fetchProducts;

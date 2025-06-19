// --- CONFIG ---
const SHOPIFY_DOMAIN = "kn-goodcar.com";
const STOREFRONT_ACCESS_TOKEN = "bb70cb008199a94b83c98df0e45ada67";
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBButqHaJHOrEg2Zi0uddwb6XI6_iCmnBs",
  authDomain: "couddaw.firebaseapp.com",
  databaseURL: "https://couddaw-default-rtdb.firebaseio.com",
  projectId: "couddaw",
  storageBucket: "couddaw.appspot.com",
  messagingSenderId: "648914779023",
  appId: "1:648914779023:web:f192ccd782caa50a6c69fa"
};
firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.database();

let allCars = [];
let filteredCars = [];
let currentPage = 1;
const carsPerPage = 8;
const lineURL = "https://lin.ee/ng5yM32";
const facebookURL = "https://www.facebook.com/KN2car";

const query = `
{
  products(first: 100, sortKey: CREATED_AT, reverse: true) {
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
}`;

async function fetchCars() {
  try {
    const res = await fetch(`https://${SHOPIFY_DOMAIN}/api/2023-07/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_ACCESS_TOKEN
      },
      body: JSON.stringify({ query })
    });
    const result = await res.json();
    allCars = (result?.data?.products?.edges || []).map(({ node }) => ({
      id: node.handle,
      brand: node.title.split(" ")[0],
      model: node.title,
      year: (node.title.match(/\d{4}/g) || [""]).pop(),
      price: node.variants.edges[0]?.node.price?.amount || "ไม่ระบุ",
      image: node.images.edges[0]?.node.url || "",
      detail: node.description,
      handle: node.handle
    }));
    filteredCars = [...allCars];
    renderCars();
    renderPagination();
  } catch (err) {
    document.getElementById('product-list').innerHTML = `<div style="color:#c00;text-align:center;">โหลดข้อมูลจาก Shopify ไม่สำเร็จ</div>`;
  }
}

function applyFilters() {
  const brand = document.getElementById('filter-brand').value.trim().toLowerCase();
  const keyword = document.getElementById('filter-keyword').value.trim().toLowerCase();
  filteredCars = allCars.filter(car => {
    const matchBrand = !brand || (car.brand && car.brand.toLowerCase() === brand);
    const matchKeyword = !keyword || (
      (car.model && car.model.toLowerCase().includes(keyword)) ||
      (car.year && car.year.toString().includes(keyword)) ||
      (car.price && car.price.toString().includes(keyword)) ||
      (car.detail && car.detail.toLowerCase().includes(keyword))
    );
    return matchBrand && matchKeyword;
  });
  currentPage = 1;
  renderCars();
  renderPagination();
}

function renderCars() {
  const start = (currentPage - 1) * carsPerPage;
  const end = start + carsPerPage;
  const cars = filteredCars.slice(start, end);
  const html = cars.map(car => `
    <div class="car-card">
      <img src="${car.image}" alt="${car.model}" loading="lazy">
      <div class="car-title">${car.model} ${car.year ? "ปี " + car.year : ""}</div>
      <div class="car-detail">${car.detail || ''}</div>
      <div class="car-bottom-bar">
        <span class="car-price">฿${Number(car.price).toLocaleString()}</span>
        <span class="car-views"><span>👁</span> <span id="view-${car.id}">0</span> ครั้ง</span>
      </div>
      <div class="car-actions">
        <a class="detail-btn" href="car-detail.html?handle=${car.id}" target="_blank" onclick="increaseView('${car.id}')">ดูรายละเอียด</a>
        <a class="line-btn" href="${lineURL}" target="_blank">LINE</a>
        <a class="facebook-btn" href="${facebookURL}" target="_blank">Facebook</a>
      </div>
      <script type="application/ld+json">
      ${JSON.stringify({
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": car.model,
        "image": car.image,
        "description": car.detail,
        "brand": { "@type": "Brand", "name": car.brand },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "THB",
          "price": car.price,
          "availability": "https://schema.org/InStock"
        }
      })}
      </script>
    </div>
  `).join('');
  document.getElementById('product-list').innerHTML = html || '<div style="text-align:center;color:#d44;font-size:1.3em;">ไม่พบข้อมูลรถที่ค้นหา</div>';
  cars.forEach(car => updateViewCounter(car.id));
}

function renderPagination() {
  const total = Math.ceil(filteredCars.length / carsPerPage);
  let html = `<button class="page-btn" onclick="gotoPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&larr;</button>`;
  for (let i = 1; i <= total; i++) {
    html += `<button class="page-btn${i === currentPage ? ' active' : ''}" onclick="gotoPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="gotoPage(${currentPage + 1})" ${currentPage === total ? 'disabled' : ''}>&rarr;</button>`;
  document.getElementById('pagination').innerHTML = `<div class="pagination">${html}</div>`;
}

function gotoPage(page) {
  const total = Math.ceil(filteredCars.length / carsPerPage);
  if (page < 1 || page > total) return;
  currentPage = page;
  renderCars();
  renderPagination();
}

// ==== Firebase view counter ====
function increaseView(carId) {
  const ref = db.ref('views/' + carId); // ✅ แก้ตรงนี้ให้ตรงกับ Firebase Rules
  ref.transaction(current => (current || 0) + 1);
}
function updateViewCounter(carId) {
  const viewRef = db.ref('views/' + carId);
  viewRef.once('value').then(snap => {
    const views = snap.val() || 0;
    const el = document.getElementById('view-' + carId);
    if (el) el.textContent = views;
  });
}

window.onload = fetchCars;
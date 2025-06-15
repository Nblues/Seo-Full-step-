// ----- SHOPIFY + FIREBASE API CONFIG -----
const SHOPIFY_DOMAIN = "kn-goodcar.com"; // แก้เป็นโดเมน Shopify จริง
const STOREFRONT_ACCESS_TOKEN = "bb70cb008199a94b83c98df0e45ada67";
const FIREBASE_CONFIG = {
  apiKey: "xxxx",
  authDomain: "xxxx",
  databaseURL: "https://couddaw-default-rtdb.firebaseio.com",
  projectId: "xxxx",
  storageBucket: "xxxx",
  messagingSenderId: "xxxx",
  appId: "xxxx"
};
firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.database();

let allCars = [];
let filteredCars = [];
let currentPage = 1;
const carsPerPage = 8;

const lineURL = "https://lin.ee/ng5yM32";
const facebookURL = "https://www.facebook.com/KN2car.";

// ----- SHOPIFY GRAPHQL -----
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

// ----- FETCH CAR DATA -----
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
    // Map car data
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

// ----- FILTER -----
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

// ----- RENDER CAR -----
function renderCars() {
  const start = (currentPage - 1) * carsPerPage;
  const end = start + carsPerPage;
  const cars = filteredCars.slice(start, end);
  const html = cars.map(car => `
    <div class="car-card">
      <img src="${car.image || 'no-image.jpg'}" alt="${car.model}" loading="lazy">
      <div class="car-title">${car.model} ${car.year ? "ปี " + car.year : ""}</div>
      <div class="car-detail">${car.detail || ''}</div>
      <div class="car-price">฿${Number(car.price).toLocaleString()}</div>
      <div class="car-views"><span>👁</span> เข้าชม <span id="view-${car.id}">0</span> ครั้ง</div>
      <div class="car-actions">
        <a class="detail-btn" href="car-detail.html?id=${car.id}" target="_blank">ดูรายละเอียด</a>
        <a class="line-btn" href="${lineURL}" target="_blank">LINE</a>
        <a class="facebook-btn" href="${facebookURL}" target="_blank">Facebook</a>
      </div>
    </div>
  `).join('');
  document.getElementById('product-list').innerHTML = html || '<div style="text-align:center;color:#d44;font-size:1.3em;">ไม่พบข้อมูลรถที่ค้นหา</div>';
  cars.forEach(car => updateViewCounter(car.id));
}

// ----- PAGINATION -----
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

// ----- VIEW COUNTER (Firebase) -----
function updateViewCounter(carId) {
  const viewRef = db.ref('carViews/' + carId);
  viewRef.once('value').then(snap => {
    const views = snap.val() || 0;
    const el = document.getElementById('view-' + carId);
    if (el) el.textContent = views;
  });
}

window.onload = fetchCars;

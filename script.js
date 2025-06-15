// Shopify & Firebase Config
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

// --- สำหรับ all-cars.html ---
if (document.getElementById("product-list")) {
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
      injectBreadcrumbLD();
      injectProductListLD();
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
    injectProductListLD();
  }

  function renderCars() {
    const start = (currentPage - 1) * carsPerPage;
    const end = start + carsPerPage;
    const cars = filteredCars.slice(start, end);
    const html = cars.map(car => `
      <div class="car-card">
        <img src="${car.image || 'no-image.jpg'}" alt="${car.model}" loading="lazy">
        <div class="car-title">${car.model} ${car.year ? "ปี " + car.year : ""}</div>
        <div class="car-detail">${car.detail || ''}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="car-price">฿${Number(car.price).toLocaleString()}</div>
          <div class="car-views"><span>👁</span> <span id="view-${car.id}">0</span> ครั้ง</div>
        </div>
        <div class="car-actions">
          <a class="detail-btn" href="car-detail.html?handle=${car.id}" target="_blank" onclick="increaseView('${car.id}')">ดูรายละเอียด</a>
          <a class="line-btn" href="${lineURL}" target="_blank">LINE</a>
          <a class="facebook-btn" href="${facebookURL}" target="_blank">Facebook</a>
        </div>
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
  async function increaseView(carId) {
    const ref = db.ref('carViews/' + carId);
    ref.transaction(current => (current || 0) + 1);
  }
  function updateViewCounter(carId) {
    const viewRef = db.ref('carViews/' + carId);
    viewRef.once('value').then(snap => {
      const views = snap.val() || 0;
      const el = document.getElementById('view-' + carId);
      if (el) el.textContent = views;
    });
  }

  // === Schema: BreadcrumbList JSON-LD ===
  function injectBreadcrumbLD() {
    const ld = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "หน้าแรก",
          "item": "https://chiangraiusedcar.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "รถมือสองเชียงใหม่",
          "item": "https://chiangraiusedcar.com/all-cars"
        }
      ]
    };
    let script = document.getElementById("breadcrumb-jsonld");
    if (script) script.remove();
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "breadcrumb-jsonld";
    script.textContent = JSON.stringify(ld);
    document.head.appendChild(script);
  }
  // === Schema: Product List JSON-LD (Product/Offer) ===
  function injectProductListLD() {
    // ใส่ max 8 ชิ้น (ตามหน้าปัจจุบัน)
    const start = (currentPage - 1) * carsPerPage;
    const end = start + carsPerPage;
    const cars = filteredCars.slice(start, end);
    let products = cars.map(car => ({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": car.model,
      "image": car.image,
      "description": car.detail,
      "brand": car.brand,
      "releaseDate": car.year,
      "offers": {
        "@type": "Offer",
        "price": car.price,
        "priceCurrency": "THB",
        "availability": "https://schema.org/InStock",
        "url": `https://chiangraiusedcar.com/car-detail.html?handle=${car.id}`
      }
    }));
    let script = document.getElementById("products-jsonld");
    if (script) script.remove();
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "products-jsonld";
    script.textContent = JSON.stringify(products, null, 2);
    document.head.appendChild(script);
  }

  window.onload = fetchCars;
  window.applyFilters = applyFilters;
  window.gotoPage = gotoPage;
  window.increaseView = increaseView;
}

// --- สำหรับ car-detail.html ---
if (window.location.pathname.endsWith('car-detail.html')) {
  const SHOPIFY_DOMAIN = "kn-goodcar.com";
  const STOREFRONT_ACCESS_TOKEN = "bb70cb008199a94b83c98df0e45ada67";
  const lineURL = "https://lin.ee/ng5yM32";

  function getParam(name) {
    let p = new URLSearchParams(window.location.search);
    return p.get(name) || '';
  }
  async function fetchCarDetail(handle) {
    const query = `
      { productByHandle(handle: "${handle}") {
          title
          description
          images(first:3){ edges{ node{ url } } }
          variants(first:1){ edges{ node{ price{ amount } } } }
          updatedAt
        }
      }
    `;
    const res = await fetch(`https://${SHOPIFY_DOMAIN}/api/2023-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_ACCESS_TOKEN
      },
      body: JSON.stringify({ query })
    });
    const json = await res.json();
    return json.data.productByHandle;
  }
  async function renderCarDetail() {
    const handle = getParam("handle");
    if(!handle) { document.getElementById('car-title').textContent = "ไม่พบข้อมูลรถ"; return;}
    const car = await fetchCarDetail(handle);
    if(!car) { document.getElementById('car-title').textContent = "ไม่พบข้อมูลรถ"; return;}
    document.getElementById('car-title').textContent = car.title;
    document.getElementById('car-price').textContent = "฿" + Number(car.variants.edges[0]?.node.price.amount || "0").toLocaleString();
    document.getElementById('car-detail').textContent = car.description;
    document.getElementById('car-img').src = car.images.edges[0]?.node.url || "https://chiangraiusedcar.com/cover.jpg";
    document.getElementById('car-img').alt = car.title;
    document.getElementById('line-btn').href = lineURL;

    // Firebase view counter
    const db = firebase.database();
    const ref = db.ref('carViews/' + handle);
    ref.transaction(current => (current || 0) + 1);
    ref.once('value').then(snap => {
      document.getElementById('car-views').textContent = snap.val() || 1;
    });

    // ===== Dynamic SEO/Schema =====
    // Title/meta
    document.title = car.title + " | ครูหนึ่งรถสวย รถมือสองเชียงใหม่";
    document.getElementById('seo-title').textContent = car.title + " | ครูหนึ่งรถสวย รถมือสองเชียงใหม่";
    document.getElementById('seo-desc').setAttribute('content', (car.description || "") + " ฟรีดาวน์ เชียงใหม่ รถมือสองราคาถูก รถบ้านคุณภาพดี เชียงใหม่");
    document.getElementById('seo-canonical').setAttribute('href', `https://chiangraiusedcar.com/car-detail.html?handle=${handle}`);
    document.getElementById('og-title').setAttribute('content', car.title + " | ครูหนึ่งรถสวย");
    document.getElementById('og-desc').setAttribute('content', car.description);
    document.getElementById('og-image').setAttribute('content', car.images.edges[0]?.node.url || "https://chiangraiusedcar.com/cover.jpg");
    document.getElementById('og-url').setAttribute('content', `https://chiangraiusedcar.com/car-detail.html?handle=${handle}`);
    document.getElementById('tw-title').setAttribute('content', car.title + " | ครูหนึ่งรถสวย");
    document.getElementById('tw-desc').setAttribute('content', car.description);
    document.getElementById('tw-image').setAttribute('content', car.images.edges[0]?.node.url || "https://chiangraiusedcar.com/cover.jpg");

    // Breadcrumb JSON-LD
    let breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "หน้าแรก",
          "item": "https://chiangraiusedcar.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "รถมือสองเชียงใหม่",
          "item": "https://chiangraiusedcar.com/all-cars"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": car.title,
          "item": `https://chiangraiusedcar.com/car-detail.html?handle=${handle}`
        }
      ]
    };
    let bcs = document.getElementById("breadcrumb-jsonld");
    if (bcs) bcs.remove();
    bcs = document.createElement("script");
    bcs.type = "application/ld+json";
    bcs.id = "breadcrumb-jsonld";
    bcs.textContent = JSON.stringify(breadcrumb);
    document.head.appendChild(bcs);

    // Product JSON-LD
    let productLD = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": car.title,
      "image": car.images.edges[0]?.node.url || "",
      "description": car.description,
      "brand": car.title.split(" ")[0],
      "releaseDate": car.updatedAt?.slice(0,10),
      "offers": {
        "@type": "Offer",
        "price": car.variants.edges[0]?.node.price.amount,
        "priceCurrency": "THB",
        "availability": "https://schema.org/InStock",
        "url": `https://chiangraiusedcar.com/car-detail.html?handle=${handle}`
      }
    };
    let prod = document.getElementById("product-jsonld");
    if (prod) prod.remove();
    prod = document.createElement("script");
    prod.type = "application/ld+json";
    prod.id = "product-jsonld";
    prod.textContent = JSON.stringify(productLD, null, 2);
    document.head.appendChild(prod);
  }
  renderCarDetail();
}

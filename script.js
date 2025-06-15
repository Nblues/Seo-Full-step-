const SHOPIFY_DOMAIN = "kn-goodcar.com";
const STOREFRONT_ACCESS_TOKEN = "bb70cb008199a94b83c98df0e45ada67";
const carsPerPage = 8;
let currentPage = 1, cars = [], carsFiltered = [];

async function fetchCarsFromShopify() {
  const query = `
    {
      products(first: 100) {
        edges {
          node {
            id
            title
            description
            handle
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  price {
                    amount
                  }
                }
              }
            }
          }
        }
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
  cars = json.data.products.edges.map(({node}) => ({
    name: node.title,
    desc: node.description,
    handle: node.handle,
    image: node.images.edges[0]?.node.url || "",
    price: node.variants.edges[0]?.node.price.amount || "-",
    views: 0
  }));
  carsFiltered = cars;
  goToPage(1);
}
function renderCars(carsToShow) {
  const list = document.getElementById('product-list');
  list.innerHTML = '';
  carsToShow.forEach(car => {
    list.innerHTML += `
      <div class="card">
        <img src="${car.image}" alt="${car.name}">
        <div class="card-content">
          <h2>${car.name}</h2>
          <div class="price">฿${Number(car.price).toLocaleString()}</div>
          <div class="view-count">👁️ เข้าชม ${car.views ?? 0} ครั้ง</div>
          <button class="btn-detail" onclick="window.location='car-detail.html?handle=${car.handle}'">ดูรายละเอียด</button>
        </div>
      </div>
    `;
  });
}
function renderPagination(totalCars) {
  const pageCount = Math.ceil(totalCars / carsPerPage);
  let html = '';
  for (let i = 1; i <= pageCount; i++) {
    html += `<button onclick="goToPage(${i})"${i === currentPage ? ' class="active"' : ''}>${i}</button>`;
  }
  document.getElementById('pagination').innerHTML = html;
}
function goToPage(page) {
  currentPage = page;
  const start = (page - 1) * carsPerPage;
  const end = start + carsPerPage;
  renderCars(carsFiltered.slice(start, end));
  renderPagination(carsFiltered.length);
}
function applyFilters() {
  const brand = document.getElementById('filter-brand').value.trim().toLowerCase();
  const keyword = document.getElementById('filter-keyword').value.trim().toLowerCase();
  carsFiltered = cars.filter(car =>
    (brand === "" || car.name.toLowerCase().includes(brand)) &&
    (keyword === "" ||
      car.name.toLowerCase().includes(keyword) ||
      car.desc.toLowerCase().includes(keyword) ||
      car.price.toString().includes(keyword)
    )
  );
  goToPage(1);
}
window.onload = fetchCarsFromShopify;

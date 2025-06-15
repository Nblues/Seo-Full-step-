// script.js
// ตัวอย่างระบบโชว์รถ/ค้นหา/เลื่อนหน้า สำหรับเว็บรถมือสอง

// ตัวอย่างข้อมูลรถ (สามารถเปลี่ยนเป็นดึงจาก Firebase หรือ API ได้)
const cars = [
  {
    brand: "Toyota",
    model: "Yaris ATIV",
    year: 2020,
    price: 429000,
    img: "https://chiangraiusedcar.com/images/yaris.jpg",
    detail: "ฟรีดาวน์ ผ่อนถูก"
  },
  {
    brand: "Honda",
    model: "City",
    year: 2019,
    price: 399000,
    img: "https://chiangraiusedcar.com/images/city.jpg",
    detail: "รถบ้านแท้"
  },
  {
    brand: "Isuzu",
    model: "D-Max",
    year: 2018,
    price: 539000,
    img: "https://chiangraiusedcar.com/images/dmax.jpg",
    detail: "กระบะแต่งซิ่ง"
  }
  // เพิ่มรถตามต้องการ
];

// ฟังก์ชันแสดงรถ
function renderCars(carList) {
  const el = document.getElementById("product-list");
  if (!el) return;
  el.innerHTML = carList.map(car => `
    <div class="car-card">
      <img src="${car.img}" alt="${car.brand} ${car.model} ปี ${car.year}" loading="lazy">
      <div class="car-info">
        <div class="car-title">${car.brand} ${car.model} ${car.year}</div>
        <div class="car-price">฿${car.price.toLocaleString()}</div>
        <div class="car-detail">${car.detail}</div>
      </div>
    </div>
  `).join("");
}

// ฟังก์ชันค้นหา/กรอง
function applyFilters() {
  const brand = document.getElementById("filter-brand").value;
  const keyword = document.getElementById("filter-keyword").value.toLowerCase();
  let filtered = cars.filter(car =>
    (!brand || car.brand === brand) &&
    (!keyword ||
      car.brand.toLowerCase().includes(keyword) ||
      car.model.toLowerCase().includes(keyword) ||
      String(car.year).includes(keyword) ||
      String(car.price).includes(keyword)
    )
  );
  renderCars(filtered);
}

// Event สำหรับค้นหา
document.addEventListener("DOMContentLoaded", () => {
  renderCars(cars);
  document.getElementById("filter-brand").addEventListener("change", applyFilters);
  document.getElementById("filter-keyword").addEventListener("input", applyFilters);
});

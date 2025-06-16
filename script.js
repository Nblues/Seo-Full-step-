// ===== Firebase =====
firebase.initializeApp({
  apiKey: "AIzaSyBButqHaJHOrEg2Zi0uddwb6XI6_iCmnBs",
  authDomain: "couddaw.firebaseapp.com",
  databaseURL: "https://couddaw-default-rtdb.firebaseio.com",
  projectId: "couddaw",
  storageBucket: "couddaw.appspot.com",
  messagingSenderId: "648914779023",
  appId: "1:648914779023:web:f192ccd782caa50a6c69fa"
});
const db = firebase.database();

// ===== Shopify =====
const DOMAIN = "www.kn-goodcar.com",
      TOKEN = "bb70cb008199a94b83c98df0e45ada67",
      PER = 9; // แสดง 9 คันต่อหน้า
let allCars = [], filtered = [], page = 1;

function getParam(k){return new URLSearchParams(location.search).get(k)||"";}

if(document.getElementById("product-list")){
  async function init(){
    const q = `{products(first:100,sortKey:CREATED_AT,reverse:true){
      edges{node{handle,title,description,images(first:1){edges{node{url}}},
      variants(first:1){edges{node{price{amount}}}}}}}}`;
    const r = await fetch(`https://${DOMAIN}/api/2023-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        "X-Shopify-Storefront-Access-Token":TOKEN
      },
      body: JSON.stringify({query:q})
    });
    const {data:{products:{edges}}} = await r.json();
    allCars = edges.map(e => ({
      id: e.node.handle,
      title: e.node.title,
      desc: e.node.description,
      img: e.node.images.edges[0]?.node.url || "",
      price: e.node.variants.edges[0]?.node.price.amount || 0
    }));
    filtered = [...allCars];
    render();paginate();
  }
  window.applyFilters = () => {
    const b = document.getElementById("filter-brand").value.toLowerCase(),
          k = document.getElementById("filter-keyword").value.toLowerCase();
    filtered = allCars.filter(c =>
      (!b || c.title.toLowerCase().includes(b)) &&
      (!k || c.title.toLowerCase().includes(k) || c.desc.toLowerCase().includes(k))
    );
    page = 1; render(); paginate();
  };
  function render(){
    const start = (page-1)*PER, s = filtered.slice(start, start+PER);
    document.getElementById("product-list").innerHTML = s.map(c => {
      // ----- Product JSON-LD -----
      const ld = {
        "@context":"https://schema.org",
        "@type":"Product",
        "name": c.title,
        "image": c.img,
        "description": c.desc,
        "brand": { "@type":"Brand", "name":c.title.split(" ")[0] },
        "offers": {
          "@type":"Offer",
          "priceCurrency":"THB",
          "price": c.price,
          "availability": "https://schema.org/InStock"
        }
      };
      return `<div class="car-card">
        <img src="${c.img}" loading="lazy" alt="${c.title}">
        <div class="car-content">
          <div class="car-title">${c.title}</div>
          <div class="car-detail">${c.desc.substr(0,90)}…</div>
          <div class="car-row">
            <div class="car-price">฿${Number(c.price).toLocaleString()}</div>
            <div class="car-views" id="v-${c.id}">👁 0</div>
          </div>
          <div class="car-actions">
            <a class="detail-btn" href="car-detail.html?handle=${c.id}" onclick="inc('${c.id}')">ดูรายละเอียด</a>
            <a class="line-btn" href="https://lin.ee/ng5yM32" target="_blank">LINE</a>
            <a class="facebook-btn" href="https://www.facebook.com/KN2car" target="_blank">Facebook</a>
          </div>
        </div>
        <script type="application/ld+json">${JSON.stringify(ld)}</script>
      </div>`;
    }).join("") || `<p style="text-align:center;color:#c00">ไม่พบรถที่ค้นหา</p>`;
    // views
    s.forEach(c=>{
      const ref = db.ref("views/"+c.id);
      ref.once("value").then(snap => {
        document.getElementById("v-"+c.id).textContent = "👁 " + (snap.val()||0);
      });
    });
  }
  function paginate(){
    const tot = Math.ceil(filtered.length/PER);
    let html = `<button class="page-btn" onclick="go(${page-1})" ${page===1?'disabled':''}>&larr;</button>`;
    for(let i=1;i<=tot;i++) html += `<button class="page-btn${i===page?' active':''}" onclick="go(${i})">${i}</button>`;
    html += `<button class="page-btn" onclick="go(${page+1})" ${page===tot?'disabled':''}>&rarr;</button>`;
    document.getElementById("pagination").innerHTML = `<div class="pagination">${html}</div>`;
  }
  window.go = n => {page = n; render(); paginate();};
  window.inc = id => { db.ref("views/"+id).transaction(v=>(v||0)+1); };
  init();
}

// ===== Car Detail (ดึงข้อมูลรถทีละคัน, Breadcrumb, Schema, View) =====
if(location.pathname.endsWith("car-detail.html")){
  (async()=>{
    const h = getParam("handle"),
      q = `{productByHandle(handle:"${h}"){title,description,updatedAt,images(first:3){edges{node{url}}},variants(first:1){edges{node{price{amount}}}}}}`;
    const r = await fetch(`https://${DOMAIN}/api/2023-10/graphql.json`,{
      method:"POST",
      headers:{"Content-Type":"application/json","X-Shopify-Storefront-Access-Token":TOKEN},
      body:JSON.stringify({query:q})
    });
    const car = (await r.json()).data.productByHandle;
    document.getElementById("car-title").textContent = car.title;
    document.getElementById("car-desc").textContent = car.description;
    document.getElementById("car-price").textContent = "฿"+Number(car.variants.edges[0].node.price.amount).toLocaleString();
    document.getElementById("car-image").src = car.images.edges[0]?.node.url||"";
    document.getElementById("car-image").alt = car.title;
    document.getElementById("car-updated").textContent = "อัปเดตล่าสุด: " + new Date(car.updatedAt).toLocaleDateString("th-TH");
    // views
    const ref = db.ref("views/"+h); ref.transaction(v=>(v||0)+1);
    ref.on("value",snap=>{ document.getElementById("car-views").textContent = "👁 " + (snap.val()||0); });

    // Breadcrumb JSON-LD
    const bc={"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"หน้าแรก","item":"https://kn-goodcar.com/index.html"},
      {"@type":"ListItem","position":2,"name":"รวมรถทั้งหมด","item":"https://kn-goodcar.com/all-cars.html"},
      {"@type":"ListItem","position":3,"name":car.title,"item":location.href}
    ]};
    let s = document.createElement("script");
    s.type = "application/ld+json"; s.textContent = JSON.stringify(bc);
    document.head.appendChild(s);

    // Product JSON-LD
    const ld = {
      "@context":"https://schema.org",
      "@type":"Product",
      "name":car.title,"image":car.images.edges[0]?.node.url||"",
      "description":car.description,
      "brand":{"@type":"Brand","name":car.title.split(" ")[0]},
      "offers":{
        "@type":"Offer",
        "priceCurrency":"THB",
        "price":car.variants.edges[0]?.node.price.amount||"",
        "availability":"https://schema.org/InStock"
      }
    };
    let pd = document.createElement("script");
    pd.type = "application/ld+json"; pd.textContent = JSON.stringify(ld);
    document.head.appendChild(pd);
  })();
}

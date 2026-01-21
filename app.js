// Firebase setup
const firebaseConfig = {
  apiKey: "AIzaSyDny-4u4KzM0t-8kP7Xj1pS1h8m9W1F1j0", // Thay bằng apiKey thật của bạn
  authDomain: "baoquandoi-aa603.firebaseapp.com",
  databaseURL: "https://baoquandoi-aa603-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "baoquandoi-aa603",
  storageBucket: "baoquandoi-aa603.appspot.com",
  messagingSenderId: "1234567890", // Thay bằng messagingSenderId thật
  appId: "1:1234567890:web:abc123" // Thay bằng appId thật
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Get articles (realtime)
async function getArticles() {
  try {
    const snapshot = await db.ref('articles').once('value');
    const data = snapshot.val() || {};
    return Object.values(data).sort((a, b) => b.id - a.id); // Mới nhất đầu
  } catch (e) {
    console.error(e);
    return [];
  }
}

// Show grid
function showArticlesGrid(containerId) {
  const container = document.getElementById(containerId);
  getArticles().then(articles => {
    container.innerHTML = "";
    if (articles.length === 0) {
      container.innerHTML = "<p>Chưa có bài viết nào.</p>";
      return;
    }
    articles.forEach(a => {
      const card = document.createElement("div");
      card.className = "news-card";
      card.innerHTML = `
        <img src="${a.image || 'https://via.placeholder.com/600x360?text=No+Image'}" alt="">
        <div class="meta">
          <h3>${escapeHtml(a.title)}</h3>
          <p>${escapeHtml(a.category || '')}</p>
        </div>`;
      card.onclick = () => goDetail(a.id);
      container.appendChild(card);
    });
  });
}

// Go detail
function goDetail(id) {
  window.location.href = `detail.html?id=${id}`;
}

// Show detail
async function showDetailPage(id, containerId) {
  const container = document.getElementById(containerId);
  const articles = await getArticles();
  const a = articles.find(x => String(x.id) === String(id));
  if (!a) {
    container.innerHTML = "<p>Bài viết không tìm thấy.</p>";
    return;
  }
  container.innerHTML = `
    <div class="article-full">
      <h2>${escapeHtml(a.title)}</h2>
      <img src="${a.image || 'https://via.placeholder.com/900x400?text=No+Image'}" alt="">
      <p><em>Chuyên mục: ${escapeHtml(a.category || '')}</em></p>
      <p>${nl2brEscape(a.body)}</p>
    </div>`;
}

let editId = null;

// Save bài
async function saveArticle() {
  const title = document.getElementById("newTitle").value.trim();
  const image = document.getElementById("newImage").value.trim();
  const body = document.getElementById("newBody").value.trim();
  const category = document.getElementById("newCategory").value;

  if (!title || !body) {
    alert("Vui lòng nhập đầy đủ tiêu đề và nội dung");
    return;
  }

  const id = editId || Date.now();
  const article = { id, title, image, body, category };

  try {
    await db.ref('articles/' + id).set(article);
    alert(editId ? "Cập nhật thành công!" : "Đã đăng bài!");
    resetForm();
    editId = null;
    showAdminArticles("adminList");
  } catch (err) {
    alert("Lỗi lưu: " + err.message);
  }
}

// Reset form
function resetForm() {
  document.getElementById("newTitle").value = "";
  document.getElementById("newImage").value = "";
  document.getElementById("newBody").value = "";
  document.getElementById("newCategory").value = "Tin Thế Giới";
  editId = null;
}

// Show admin list
async function showAdminArticles(containerId) {
  const container = document.getElementById(containerId);
  const articles = await getArticles();
  container.innerHTML = "";
  if (articles.length === 0) {
    container.innerHTML = "<p>Chưa có bài viết.</p>";
    return;
  }
  articles.forEach(a => {
    const row = document.createElement("div");
    const left = document.createElement("div");
    left.style.flex = "1";
    left.innerHTML = `<h3>${escapeHtml(a.title)}</h3><small>${escapeHtml(a.category || '')}</small>`;
    const right = document.createElement("div");
    right.innerHTML = `
      <button class="btn" onclick="editArticle('${a.id}')">Sửa</button>
      <button class="btn" onclick="deleteArticle('${a.id}')">Xóa</button>`;
    row.appendChild(left);
    row.appendChild(right);
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.justifyContent = "space-between";
    row.style.borderBottom = "1px solid #eee";
    row.style.padding = "10px 0";
    container.appendChild(row);
  });
}

// Edit bài
async function editArticle(id) {
  const articles = await getArticles();
  const a = articles.find(x => String(x.id) === String(id));
  if (!a) return;
  document.getElementById("newTitle").value = a.title;
  document.getElementById("newImage").value = a.image || "";
  document.getElementById("newBody").value = a.body || "";
  document.getElementById("newCategory").value = a.category || "Tin Thế Giới";
  editId = id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Xóa bài
async function deleteArticle(id) {
  if (!confirm("Xác nhận xóa?")) return;
  try {
    await db.ref('articles/' + id).remove();
    alert("Xóa thành công!");
    showAdminArticles("adminList");
  } catch (err) {
    alert("Lỗi xóa: " + err.message);
  }
}

async function searchArticles() {
  const q = document.getElementById("searchBox")?.value?.trim().toLowerCase() || "";
  const articles = await getArticles();
  const filtered = articles.filter(a => a.title.toLowerCase().includes(q));
  renderFiltered(filtered);
}

async function filterArticles() {
  const select = document.getElementById("categoryFilter");
  let cat = select ? select.value.trim() : "all";

  const articles = await getArticles();
  const filtered = (cat === "all")
    ? articles
    : articles.filter(a => (a.category || "").trim() === cat);

  renderFiltered(filtered);
}


function renderFiltered(list) {
  const container = document.getElementById("news-grid");
  if (!container) return;
  container.innerHTML = "";
  if (list.length === 0) {
    container.innerHTML = "<p>Không có bài viết nào.</p>";
    return;
  }
  list.forEach(a => {
    const card = document.createElement("div");
    card.className = "news-card";
    card.innerHTML = `
      <img src="${a.image || 'https://via.placeholder.com/600x360?text=No+Image'}" alt="">
      <div class="meta">
        <h3>${escapeHtml(a.title)}</h3>
        <p>${escapeHtml(a.category || '')}</p>
      </div>`;
    card.onclick = () => goDetail(a.id);
    container.appendChild(card);
  });
}

function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function nl2brEscape(text) {
  return escapeHtml(text).replace(/\n/g, "<br>");
}
function filterByCategory(category) {
  document.getElementById("categoryFilter").value = category;
  filterArticles();
  document.getElementById("news-grid").scrollIntoView({behavior: "smooth"});
}
  document.getElementById("categoryFilter").value = category;
  filterArticles();
  
  // Cuộn mượt đến phần lưới tin tức
  document.getElementById("news-grid").scrollIntoView({ behavior: "smooth" });


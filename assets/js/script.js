/**
 * script.js - Inteligência da Landing Page Mar de Carol
 * Gerencia o carregamento via Google Sheets, filtros, favoritos e redirecionamentos.
 */

// --- CONFIGURAÇÃO ---
// Substitua URL_DA_PLANILHA pelo link do seu CSV (Publicar na Web -> Valores separados por vírgula .csv)
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQZ1xVGIGNd7LrPMDWa3uFM_i9MVgzj1LmqKCqZrVUM3F203ZPJ4hWugKGUNaNMsmRhn__bVHfeGk_w/pub?output=csv';

// Produtos de Backup (Exibidos se a planilha falhar ou estiver carregando)
const FALLBACK_PRODUCTS = [
    {
        LinkImagem: 'https://m.media-amazon.com/images/I/61RV6khFSQL._AC_SL1000_.jpg',
        Loja: 'Amazon',
        Categoria: 'tecnologia',
        Badge: 'Mais Vendido',
        BadgeTipo: 'venda',
        Titulo: 'Smart TV Multi 50" 4K Google TV',
        PrecoAtual: '2.849',
        PrecoAntigo: '3.299',
        Expiry: '2026-12-31T23:59:59',
        LinkReal: 'https://www.amazon.com.br/Smart-Multi-Compat%C3%ADvel-Alexa-Google/dp/B0FLRC6T9L'
    }
];

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadProducts(); // Inicia o carregamento dinâmico
    initBackToTop();
    initSearch();
});

// --- CARREGAMENTO DE PRODUTOS ---
async function loadProducts() {
    const wrapper = document.getElementById('ofertas-wrapper');

    try {
        // 1. Tentar buscar dados da planilha
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error('Sheet not accessible');

        const csvData = await response.text();
        const products = parseCSV(csvData);

        if (products.length > 0) {
            renderProducts(products);
        } else {
            renderProducts(FALLBACK_PRODUCTS);
        }
    } catch (error) {
        console.warn('Erro ao carregar planilha, usando backup:', error);
        renderProducts(FALLBACK_PRODUCTS);
    }
}

function parseCSV(csv) {
    const lines = csv.split('\n');
    const result = [];
    const headers = lines[0].split(',');

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const obj = {};
        const currentline = lines[i].split(',');

        headers.forEach((header, index) => {
            obj[header.trim()] = currentline[index]?.trim();
        });
        result.push(obj);
    }
    return result;
}

function renderProducts(products) {
    const wrapper = document.getElementById('ofertas-wrapper');
    wrapper.innerHTML = ''; // Limpa loader

    products.forEach(p => {
        const card = createProductCard(p);
        wrapper.appendChild(card);
    });

    // Re-inicializa sistemas que dependem dos cards
    initFavorites();
    initLinkCloaking();
    initLazyLoading();
    updateTimers();
}

function createProductCard(p) {
    const div = document.createElement('div');
    div.className = 'card';
    div.setAttribute('data-store', p.Loja.toLowerCase().replace(' ', ''));
    div.setAttribute('data-category', p.Categoria.toLowerCase());

    const storeIcon = getStoreIcon(p.Loja);
    const badgeHtml = p.Badge ? `<div class="promo-badge badge-${p.BadgeTipo}"><i class="fas fa-bolt"></i> ${p.Badge}</div>` : '';
    const expiryHtml = p.Expiry ? `
        <div class="countdown-container pulse-timer" data-expiry="${p.Expiry}">
            <span class="countdown-label"><i class="fas fa-clock"></i> Expira em:</span>
            <span class="countdown-values">--:--:--</span>
        </div>` : '';

    div.innerHTML = `
        <div class="card-img skeleton" style="background-image: url('${p.LinkImagem}')">
            <button class="btn-favorite" aria-label="Adicionar aos favoritos">
                <i class="fas fa-heart"></i>
            </button>
            ${badgeHtml}
            <span class="card-tag">${storeIcon} ${p.Loja}</span>
        </div>
        <div class="card-content">
            <h3>${p.Titulo}</h3>
            <div class="price">R$ ${p.PrecoAtual} ${p.PrecoAntigo ? `<small>R$ ${p.PrecoAntigo}</small>` : ''}</div>
            ${expiryHtml}
            <a href="#" class="btn-afiliado ${p.Loja.toLowerCase().replace(' ', '')} btn-cloak" 
               data-url="${p.LinkReal}" data-store-name="${p.Loja}">
               ${storeIcon} VER OFERTA NA ${p.Loja.toUpperCase()}
            </a>
            <div class="share-actions">
                <a href="javascript:void(0)" class="share-btn whatsapp" onclick="shareProduct(this, 'whatsapp')">
                    <i class="fab fa-whatsapp"></i>
                </a>
                <a href="javascript:void(0)" class="share-btn telegram" onclick="shareProduct(this, 'telegram')">
                    <i class="fab fa-telegram-plane"></i>
                </a>
            </div>
        </div>
    `;
    return div;
}

function getStoreIcon(store) {
    const s = store.toLowerCase();
    if (s.includes('amazon')) return '<i class="fab fa-amazon"></i>';
    if (s.includes('mercado')) return '<i class="fas fa-handshake"></i>';
    if (s.includes('shopee')) return '<i class="fas fa-bag-shopping"></i>';
    return '<i class="fas fa-store"></i>';
}

// --- TEMA E UX ---
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-mode');
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });
}

function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) btn.classList.add('show');
        else btn.classList.remove('show');
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// --- BUSCA E FILTROS ---
function initSearch() {
    const input = document.getElementById('search-input');
    input.addEventListener('input', filterProducts);

    document.querySelectorAll('.chip, .chip-cat').forEach(chip => {
        chip.addEventListener('click', () => {
            if (chip.classList.contains('chip')) {
                const isActive = chip.classList.contains('active');
                document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                if (!isActive) chip.classList.add('active');
            } else {
                document.querySelectorAll('.chip-cat').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
            }
            filterProducts();
        });
    });
}

function filterProducts() {
    const searchText = document.getElementById('search-input').value.toLowerCase();
    const storeFilter = document.querySelector('.chip.active')?.getAttribute('data-filter') || 'all';
    const catFilter = document.querySelector('.chip-cat.active')?.getAttribute('data-cat') || 'all';
    const favorites = JSON.parse(localStorage.getItem('mdecarol_favorites') || '[]');

    document.querySelectorAll('.card').forEach(card => {
        const title = card.querySelector('h3').innerText.toLowerCase();
        const store = card.getAttribute('data-store');
        const cat = card.getAttribute('data-category');

        const matchesSearch = title.includes(searchText);
        let matchesStore = storeFilter === 'all' || store === storeFilter;
        if (storeFilter === 'favorites') matchesStore = favorites.includes(card.querySelector('h3').innerText);

        const matchesCat = catFilter === 'all' || cat.includes(catFilter);

        if (matchesSearch && matchesStore && matchesCat) card.classList.remove('hidden');
        else card.classList.add('hidden');
    });
}

// --- FAVORITOS ---
function initFavorites() {
    const favorites = JSON.parse(localStorage.getItem('mdecarol_favorites') || '[]');
    document.getElementById('fav-count').innerText = favorites.length;

    document.querySelectorAll('.card').forEach(card => {
        const title = card.querySelector('h3').innerText;
        const btn = card.querySelector('.btn-favorite');

        if (favorites.includes(title)) btn.classList.add('is-favorite');

        btn.onclick = (e) => {
            e.stopPropagation();
            let favs = JSON.parse(localStorage.getItem('mdecarol_favorites') || '[]');
            if (favs.includes(title)) {
                favs = favs.filter(f => f !== title);
                btn.classList.remove('is-favorite');
            } else {
                favs.push(title);
                btn.classList.add('is-favorite');
            }
            localStorage.setItem('mdecarol_favorites', JSON.stringify(favs));
            document.getElementById('fav-count').innerText = favs.length;
            if (document.querySelector('.chip.active')?.getAttribute('data-filter') === 'favorites') filterProducts();
        };
    });
}

// --- LINK CLOAKING ---
function initLinkCloaking() {
    const overlay = document.getElementById('redirect-overlay');
    document.querySelectorAll('.btn-cloak').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            const url = btn.getAttribute('data-url');
            const store = btn.getAttribute('data-store-name');

            document.getElementById('redirect-store-logo').innerHTML = getStoreIcon(store);
            document.getElementById('redirect-message').innerText = `Levando você para a ${store}...`;
            overlay.classList.add('active');

            setTimeout(() => {
                window.open(url, '_blank');
                setTimeout(() => overlay.classList.remove('active'), 500);
            }, 1200);
        };
    });
}

// --- UTILITÁRIOS ---
function initLazyLoading() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.classList.remove('skeleton');
                observer.unobserve(img);
            }
        });
    }, { rootMargin: '100px' });
    document.querySelectorAll('.card-img').forEach(img => observer.observe(img));
}

function updateTimers() {
    setInterval(() => {
        const now = new Date().getTime();
        document.querySelectorAll('.countdown-container').forEach(container => {
            const expiry = new Date(container.getAttribute('data-expiry')).getTime();
            const diff = expiry - now;
            if (diff <= 0) {
                container.innerHTML = 'OFERTA ENCERRADA';
                return;
            }
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            container.querySelector('.countdown-values').innerText = `${d > 0 ? d + 'd ' : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        });
    }, 1000);
}

// Share Logic
function shareProduct(element, platform) {
    const card = element.closest('.card');
    const title = card.querySelector('h3').innerText;
    const price = card.querySelector('.price').innerText;
    const link = card.querySelector('.btn-afiliado').getAttribute('data-url');
    const msg = encodeURIComponent(`🔥 *Achadinho na Mar de Carol!* \n\n✨ ${title}\n💰 *${price}*\n\n👉 Confira aqui: ${link}`);
    window.open(platform === 'whatsapp' ? `https://wa.me/?text=${msg}` : `https://t.me/share/url?url=${link}&text=${msg}`, '_blank');
}

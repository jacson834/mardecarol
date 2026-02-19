// Lógica de Troca de Tema
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Verificar preferência salva ou do sistema
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    body.classList.add('dark-mode');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Feedback tátil visual
    themeToggle.style.transform = 'scale(0.9) rotate(-15deg)';
    setTimeout(() => {
        themeToggle.style.transform = '';
    }, 200);
});

// Pequeno script para feedback de clique e SEO (no-follow tracking)
document.querySelectorAll('.btn-afiliado').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const toast = document.getElementById('copy-toast');
        if (toast) {
            toast.style.opacity = '1';
            setTimeout(() => { toast.style.opacity = '0'; }, 2000);
        }
    });
});

// Lógica de Lazy Loading com Intersection Observer
const lazyObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const cardImg = entry.target;
            const bgImage = getComputedStyle(cardImg).backgroundImage;

            if (bgImage && bgImage !== 'none' && !bgImage.includes('linear-gradient')) {
                const url = bgImage.match(/url\(["']?([^"']+)["']?\)/)?.[1];
                if (url) {
                    const img = new Image();
                    img.onload = () => {
                        cardImg.classList.remove('skeleton');
                        observer.unobserve(cardImg);
                    };
                    img.src = url;
                } else {
                    cardImg.classList.remove('skeleton');
                    observer.unobserve(cardImg);
                }
            } else {
                cardImg.classList.remove('skeleton');
                observer.unobserve(cardImg);
            }
        }
    });
}, {
    rootMargin: '100px'
});

document.querySelectorAll('.card-img').forEach(img => {
    lazyObserver.observe(img);
});

// Lógica de Filtros e Busca Combinados
const searchInput = document.getElementById('search-input');
const chips = document.querySelectorAll('.chip');
const cards = document.querySelectorAll('.card');

function filterProducts() {
    const searchText = searchInput.value.toLowerCase().trim();
    const activeStoreChip = document.querySelector('.chip.active');
    const storeFilter = activeStoreChip ? activeStoreChip.getAttribute('data-filter') : null;

    const activeCatChip = document.querySelector('.chip-cat.active');
    const catFilter = activeCatChip ? activeCatChip.getAttribute('data-cat') : 'all';

    const favorites = JSON.parse(localStorage.getItem('mdecarol_favorites') || '[]');

    cards.forEach(card => {
        const titleElement = card.querySelector('h3');
        const title = titleElement.innerText.toLowerCase();
        const store = card.getAttribute('data-store');
        const cat = card.getAttribute('data-category') || '';

        const matchesSearch = title.includes(searchText);
        let matchesStore = !storeFilter || store === storeFilter;
        let matchesCat = catFilter === 'all' || cat.includes(catFilter);

        if (storeFilter === 'favorites') {
            matchesStore = favorites.includes(titleElement.innerText);
        }

        if (matchesSearch && matchesStore && matchesCat) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

if (searchInput) {
    searchInput.addEventListener('input', filterProducts);
}

chips.forEach(chip => {
    chip.addEventListener('click', () => {
        const isAlreadyActive = chip.classList.contains('active');
        chips.forEach(c => c.classList.remove('active'));
        if (!isAlreadyActive) {
            chip.classList.add('active');
        }
        filterProducts();
    });
});

document.querySelectorAll('.chip-cat').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.chip-cat').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        filterProducts();
    });
});

// Lógica do Botão Voltar ao Topo
const backToTopBtn = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
    if (backToTopBtn) {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    }
});

if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Lógica de Compartilhamento
function shareProduct(element, platform) {
    const card = element.closest('.card');
    const title = card.querySelector('h3').innerText;
    const price = card.querySelector('.price').innerText.split('\n')[0];
    const link = card.querySelector('.btn-afiliado').href;

    const message = `🔥 *Achadinho na Mar de Carol!* \n\n✨ ${title}\n💰 *${price}*\n\n👉 Confira aqui: ${link}`;
    const encodedMessage = encodeURIComponent(message);
    const encodedLink = encodeURIComponent(link);

    let url = '';
    if (platform === 'whatsapp') {
        url = `https://wa.me/?text=${encodedMessage}`;
    } else if (platform === 'telegram') {
        url = `https://t.me/share/url?url=${encodedLink}&text=${encodedMessage}`;
    }

    if (url) {
        window.open(url, '_blank');
    }
}

// Lógica de Captura de Leads
const leadForm = document.getElementById('lead-form');
if (leadForm) {
    leadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = leadForm.querySelector('.lead-input');
        const toast = document.getElementById('copy-toast');

        console.log('Lead capturado:', input.value);

        if (toast) {
            const originalContent = toast.innerHTML;
            toast.innerHTML = '<i class="fas fa-check-circle" style="color: #4ade80;"></i> Inscrição realizada com sucesso!';
            toast.style.opacity = '1';
            input.value = '';

            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => {
                    toast.innerHTML = originalContent;
                }, 300);
            }, 3000);
        }
    });
}

// Lógica de Contadores Regressivos
function updateTimers() {
    const now = new Date().getTime();
    document.querySelectorAll('.countdown-container').forEach(container => {
        const expiryDate = new Date(container.getAttribute('data-expiry')).getTime();
        const timeLeft = expiryDate - now;

        if (timeLeft <= 0) {
            container.innerHTML = '<span class="countdown-values" style="color: var(--text-muted)">OFERTA ENCERRADA</span>';
            container.classList.remove('pulse-timer');
            return;
        }

        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        const display = `${days > 0 ? days + 'd ' : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        const valSpan = container.querySelector('.countdown-values');
        if (valSpan) valSpan.innerText = display;
    });
}

setInterval(updateTimers, 1000);
updateTimers();

// Lógica de Prova Social (Social Proof)
const spData = [
    { title: "Maria de Curitiba", text: "Acabou de aproveitar a oferta da Smart TV!", icon: "fa-tv" },
    { title: "João de Salvador", text: "Comprou o Fone Bluetooth com desconto!", icon: "fa-headphones" },
    { title: "Ana de Brasília", text: "Garantiu a Geladeira Frost Free 340L!", icon: "fa-snowflake" },
    { title: "Ricardo de Porto Alegre", text: "Acaba de ver as ofertas da Shopee.", icon: "fa-eye" },
    { title: "42 pessoas vendo agora", text: "As ofertas da Amazon estão bombando!", icon: "fa-fire" },
    { title: "Alguém de Manaus", text: "Pegou o Tablet com frete grátis!", icon: "fa-tablet-alt" },
    { title: "Carla de Belo Horizonte", text: "Assinou o alerta de ofertas agora há pouco.", icon: "fa-bell" },
    { title: "Desconto Exclusivo", text: "Um cupom Shopee acaba de ser liberado!", icon: "fa-tag" }
];

const spToast = document.getElementById('social-proof');
const spTitle = document.getElementById('sp-title');
const spText = document.getElementById('sp-text');

function showSocialProof() {
    if (!spToast || !spTitle || !spText) return;
    
    const event = spData[Math.floor(Math.random() * spData.length)];
    const spIconGroup = spToast.querySelector('.sp-icon i');

    spTitle.innerText = event.title;
    spText.innerText = event.text;
    if (spIconGroup) spIconGroup.className = `fas ${event.icon}`;

    spToast.classList.add('show');

    setTimeout(() => {
        spToast.classList.remove('show');
    }, 6000);
}

function startSocialProofLoop() {
    setTimeout(() => {
        showSocialProof();
        const nextInterval = Math.floor(Math.random() * 10000) + 15000;
        setInterval(() => {
            showSocialProof();
        }, nextInterval);
    }, 5000);
}

startSocialProofLoop();

// Lógica de Favoritos (LocalStorage)
function initFavorites() {
    const favorites = JSON.parse(localStorage.getItem('mdecarol_favorites') || '[]');
    const countElement = document.getElementById('fav-count');
    if (countElement) countElement.innerText = favorites.length;

    document.querySelectorAll('.card').forEach(card => {
        const title = card.querySelector('h3').innerText;
        const heartBtn = card.querySelector('.btn-favorite');

        if (favorites.includes(title)) {
            heartBtn.classList.add('is-favorite');
        }

        heartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            let currentFavs = JSON.parse(localStorage.getItem('mdecarol_favorites') || '[]');

            if (currentFavs.includes(title)) {
                currentFavs = currentFavs.filter(f => f !== title);
                heartBtn.classList.remove('is-favorite');
            } else {
                currentFavs.push(title);
                heartBtn.classList.add('is-favorite');
            }

            localStorage.setItem('mdecarol_favorites', JSON.stringify(currentFavs));
            if (countElement) countElement.innerText = currentFavs.length;

            const activeChip = document.querySelector('.chip.active');
            if (activeChip && activeChip.getAttribute('data-filter') === 'favorites') {
                filterProducts();
            }
        });
    });
}

// Lógica de Link Cloaking
function initLinkCloaking() {
    const overlay = document.getElementById('redirect-overlay');
    const storeLogo = document.getElementById('redirect-store-logo');
    const message = document.getElementById('redirect-message');

    document.querySelectorAll('.btn-cloak').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const realUrl = btn.getAttribute('data-url');
            const storeName = btn.getAttribute('data-store-name');

            let iconHtml = '<i class="fab fa-amazon"></i>';
            if (storeName === 'Mercado Livre') iconHtml = '<i class="fas fa-handshake"></i>';
            if (storeName === 'Shopee') iconHtml = '<i class="fas fa-bag-shopping"></i>';

            if (storeLogo) storeLogo.innerHTML = iconHtml;
            if (message) message.innerText = `Estamos te levando para a ${storeName}...`;

            if (overlay) overlay.classList.add('active');

            setTimeout(() => {
                window.open(realUrl, '_blank');
                setTimeout(() => {
                    if (overlay) overlay.classList.remove('active');
                }, 500);
            }, 1200);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initFavorites();
    initLinkCloaking();
});

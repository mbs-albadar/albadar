document.addEventListener('DOMContentLoaded', function() {
    // Analytics Tracking (kunjungan halaman & klik penting)
    if (typeof supabaseClient !== 'undefined') {
        supabaseClient
            .from('analytics_events')
            .insert([{ event_type: 'page_view', page_path: window.location.pathname }])
            .then(function() {})
            .catch(function() {});

        document.addEventListener('click', function(e) {
            const waLink = e.target.closest('.wa-float-btn, a[href*="wa.me"]');
            if (waLink) {
                supabaseClient.from('analytics_events').insert([{ event_type: 'click_wa', page_path: window.location.pathname }]).then(function() {}).catch(function() {});
                return;
            }

            const ppdbLink = e.target.closest('a[href*="ppdb.html"]');
            if (ppdbLink) {
                supabaseClient.from('analytics_events').insert([{ event_type: 'click_ppdb', page_path: window.location.pathname }]).then(function() {}).catch(function() {});
                return;
            }

            const brosurLink = e.target.closest('.ppdb-doc-card');
            if (brosurLink) {
                const labelEl = brosurLink.querySelector('.ppdb-doc-label');
                const detailText = labelEl ? labelEl.textContent : null;
                supabaseClient.from('analytics_events').insert([{ event_type: 'click_brosur', page_path: window.location.pathname, detail: detailText }]).then(function() {}).catch(function() {});
            }
        });
    }

    // Header Scroll
    const header = document.getElementById('siteHeader');
    if (header) {
        const handleHeaderScroll = () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        };

        // Run on page load and on scroll
        handleHeaderScroll();
        window.addEventListener('scroll', handleHeaderScroll);
    }

    // Mobile Menu & Dropdowns
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-list');
    const body = document.body;
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    body.appendChild(overlay);

    const dropdownItems = document.querySelectorAll('.nav-item.dropdown');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            const expanded = menuToggle.getAttribute('aria-expanded') === 'true' || false;
            menuToggle.setAttribute('aria-expanded', !expanded);
            if (navList) navList.classList.toggle('active');
            overlay.classList.toggle('active');
            body.classList.toggle('menu-open');
        });
    }

    const closeMenu = () => {
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
        if (navList) navList.classList.remove('active');
        overlay.classList.remove('active');
        body.classList.remove('menu-open');
        dropdownItems.forEach(d => d.classList.remove('open'));
    };

    if (overlay) overlay.addEventListener('click', closeMenu);

    // Dropdown handling:
    // - Desktop: Pure instant hover (CSS driven). Click on main trigger link calls preventDefault() with no toggle.
    // - Mobile: Tap on main trigger link toggles accordion (.open class) within drawer menu.
    dropdownItems.forEach(item => {
        const toggleLink = item.querySelector(':scope > a');
        if (toggleLink) {
            toggleLink.addEventListener('click', function(e) {
                e.preventDefault(); // Prevent navigating to href (about.html, student-life.html, news.html)
                
                // Only perform accordion toggle on mobile / drawer navigation
                if (navList && navList.classList.contains('active')) {
                    const isOpen = item.classList.contains('open');
                    dropdownItems.forEach(d => {
                        if (d !== item) d.classList.remove('open');
                    });
                    item.classList.toggle('open', !isOpen);
                }
            });
        }
    });

    // Close mobile dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-item.dropdown') && navList && navList.classList.contains('active')) {
            dropdownItems.forEach(d => d.classList.remove('open'));
        }
    });

    // Close menu when clicking normal links or dropdown sub-links
    document.querySelectorAll('.nav-list a').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.parentElement && link.parentElement.classList.contains('dropdown')) {
                return;
            }
            closeMenu();
        });
    });

    // Comprehensive Site Search Index Array
    const siteSearchIndex = [
        { keywords: 'mbs tentang, profil, sejarah, visi, misi, tentang mbs', title: 'Tentang MBS Al Badar', url: 'about.html' },
        { keywords: 'mbs program, kurikulum, akademik, mata pelajaran, program mbs', title: 'Program & Kurikulum MBS', url: 'programs.html' },
        { keywords: 'mbs boarding, asrama, santri, boarding mbs', title: 'Program Boarding MBS', url: 'programs.html#boarding' },
        { keywords: 'mbs fullday, harian, non boarding, fullday mbs', title: 'Program Full Day MBS', url: 'programs.html#fullday' },
        { keywords: 'mbs ppdb, pendaftaran, psb, daftar mbs, ppdb mbs', title: 'Panduan PPDB MBS', url: 'ppdb.html' },
        { keywords: 'mbs kegiatan, siswa, ekstrakurikuler, fasilitas, kehidupan mbs, agenda periodik, muhadhoroh, muhadatsah, kajian tematik', title: 'Kehidupan Siswa & Agenda Periodik MBS', url: 'student-life.html' },
        { keywords: 'mbs berita, kabar, pengumuman, info mbs', title: 'Berita & Info MBS', url: 'news.html' },
        { keywords: 'mbs kontak, alamat, telepon, wa, email, kontak mbs', title: 'Kontak MBS', url: 'contact.html' },
        { keywords: 'mbs faq, tanya, jawab, bantuan', title: 'FAQ MBS', url: 'faq.html' }
    ];

    // Search Bar & Autocomplete Logic
    const searchToggle = document.getElementById('searchToggle');
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const searchClose = document.getElementById('searchClose');

    if (searchForm && searchInput) {
        // Create or find searchResultsContainer
        let searchResultsContainer = document.getElementById('searchResultsContainer');
        if (!searchResultsContainer) {
            searchResultsContainer = document.createElement('div');
            searchResultsContainer.id = 'searchResultsContainer';
            const searchItemParent = searchForm.closest('.nav-search-item') || searchForm.parentElement;
            if (searchItemParent) {
                searchItemParent.appendChild(searchResultsContainer);
            } else {
                searchForm.appendChild(searchResultsContainer);
            }
        }

        const hideSearchResults = () => {
            if (searchResultsContainer) {
                searchResultsContainer.classList.remove('active');
                searchResultsContainer.innerHTML = '';
            }
        };

        // Toggle Search Bar Open/Close
        if (searchToggle) {
            searchToggle.addEventListener('click', function() {
                searchForm.classList.toggle('active');
                if (searchForm.classList.contains('active')) {
                    searchInput.focus();
                } else {
                    hideSearchResults();
                }
            });
        }

        // Close Search Bar
        if (searchClose) {
            searchClose.addEventListener('click', function() {
                searchForm.classList.remove('active');
                hideSearchResults();
            });
        }

        // Autocomplete on Input
        searchInput.addEventListener('input', function() {
            const query = searchInput.value.trim().toLowerCase();
            if (!query) {
                hideSearchResults();
                return;
            }

            const matches = siteSearchIndex.filter(item => 
                item.keywords.toLowerCase().includes(query) || 
                item.title.toLowerCase().includes(query)
            );

            searchResultsContainer.innerHTML = '';
            if (matches.length > 0) {
                matches.forEach(match => {
                    const a = document.createElement('a');
                    a.href = match.url;
                    a.className = 'search-suggestion-item';
                    a.textContent = match.title;
                    searchResultsContainer.appendChild(a);
                });
            } else {
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'search-suggestion-empty';
                emptyMsg.textContent = 'Maaf, topik tidak ditemukan. Coba kata kunci lain.';
                searchResultsContainer.appendChild(emptyMsg);
            }

            searchResultsContainer.classList.add('active');
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchForm.contains(e.target) && !searchResultsContainer.contains(e.target) && (!searchToggle || !searchToggle.contains(e.target))) {
                hideSearchResults();
            }
        });

        // Handle Search Submit (Redirect to Google)
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchQuery = searchInput.value.trim();
            if (searchQuery) {
                const googleSearchUrl = 'https://www.google.com/search?q=site:albadar-psi.vercel.app/+' + encodeURIComponent(searchQuery);
                window.location.href = googleSearchUrl;
            }
        });
    }

    // Dynamic News Loader (Sequential Staggered Fade) - preview berita di beranda
    let allNews = [];

    // Foto stok (Unsplash) dan gambar kosong ditampilkan sebagai panel merek,
    // bukan foto yang menyesatkan. Foto asli yang diunggah admin tetap dipakai.
    function newsImage(url) {
        return (!url || /images\.unsplash\.com/i.test(url)) ? 'assets/img/placeholder.svg' : url;
    }

    function updateNewsCard(cardId, newsItem) {
        const card = document.getElementById(cardId);
        if (!card || !newsItem) return;

        card.style.opacity = '0';

        setTimeout(() => {
            card.href = "berita-detail.html?id=" + encodeURIComponent(newsItem.id);
            const imgEl = card.querySelector('.news-img-wrap img');
            if (imgEl) {
                imgEl.src = newsImage(newsItem.image);
                imgEl.alt = newsItem.title;
            }
            const tagEl = card.querySelector('.news-tag-lux');
            if (tagEl) tagEl.textContent = newsItem.category;
            const titleEl = card.querySelector('.news-title-lux');
            if (titleEl) titleEl.textContent = newsItem.title;
            const excerptEl = card.querySelector('.news-excerpt-lux');
            if (excerptEl) excerptEl.textContent = newsItem.excerpt;

            card.style.opacity = '1';
        }, 500);
    }

    function initHomeNewsPreview() {
        if (!document.getElementById('newsCard1') || !allNews.length) return;

        updateNewsCard('newsCard1', allNews[0]);
        updateNewsCard('newsCard2', allNews[1]);
        updateNewsCard('newsCard3', allNews[2]);

        if (allNews.length <= 3) return;

        let currentCard = 1;
        let newsOffset = 3;

        setInterval(() => {
            const cardId = 'newsCard' + currentCard;
            updateNewsCard(cardId, allNews[newsOffset % allNews.length]);
            newsOffset++;
            currentCard = (currentCard % 3) + 1;
        }, 5000);
    }

    if (document.getElementById('newsCard1')) {
        if (typeof supabaseClient !== 'undefined') {
            supabaseClient
                .from('news')
                .select('*')
                .order('created_at', { ascending: false })
                .then(function(res) {
                    if (res.error) throw res.error;
                    if (Array.isArray(res.data) && res.data.length > 0) {
                        allNews = res.data;
                        initHomeNewsPreview();
                        return;
                    }
                    throw new Error('No news returned from Supabase');
                })
                .catch(function() {
                    fetch('assets/data/news.json')
                        .then(r => r.json())
                        .then(data => { allNews = data; initHomeNewsPreview(); })
                        .catch(() => {});
                });
        } else {
            fetch('assets/data/news.json')
                .then(r => r.json())
                .then(data => { allNews = data; initHomeNewsPreview(); })
                .catch(() => {});
        }
    }

    // ==========================================================================
    // Scalable News Portal Logic (news.html)
    // ==========================================================================
    const newsGridContainer = document.getElementById('news-grid-container');
    const newsFilterButtons = document.querySelectorAll('.news-filter-btn');

    if (newsGridContainer) {
        let cachedNewsData = [];

        // Comprehensive Fallback dataset for offline / local file:// protocol
        const fallbackNewsData = [
            {
                id: "penyerahan-santri-baru",
                title: "Penyerahan Resmi Santri Baru Angkatan Pertama",
                date: "13 Juli 2026",
                category: "Kegiatan",
                excerpt: "Kegiatan penyerahan dan penerimaan santri baru angkatan pertama dilaksanakan secara khidmat di lingkungan kampus SMP MBS Al Badar Prambanan.",
                image: ""
            },
            {
                id: "fortasi-taaruf-santri",
                title: "FORTASI: Forum Orientasi dan Taaruf Santri",
                date: "16 Juli 2026",
                category: "Kegiatan",
                excerpt: "Forum Orientasi dan Taaruf Santri (FORTASI) berlangsung selama 3 hari mengenalkan budaya pesantren, kurikulum ISMUBA, Koding & AI, serta pembiasaan adab digital.",
                image: ""
            },
            {
                id: "hari-anak-nasional-prambanan",
                title: "Partisipasi Santri dalam Peringatan Hari Anak Nasional di Candi Prambanan",
                date: "22 Juli 2026",
                category: "Prestasi",
                excerpt: "Siswa kelas 7 SMP MBS Al Badar ikut serta dalam peringatan Hari Anak Nasional (HAN) 2026 di Kompleks Candi Prambanan dan meraih sejumlah penghargaan apresiasi.",
                image: ""
            },
            {
                id: "bimtek-ksp-guru",
                title: "Bimbingan Teknis Kurikulum Satuan Pendidikan (KSP)",
                date: "29 Juli 2026",
                category: "Pengumuman",
                excerpt: "Guru dan tenaga kependidikan mengikuti bimbingan teknis penyusunan KSP untuk memastikan kualitas pembelajaran yang terstandarisasi dan optimal.",
                image: ""
            },
            {
                id: "albadar-camp-perdana",
                title: "Albadar Camp (ABC) Perdana: MABIT & Penguatan Karakter Mandiri",
                date: "16 Agustus 2026",
                category: "Kegiatan",
                excerpt: "Kegiatan malam bina iman dan taqwa (MABIT) bulanan dari Sabtu siang hingga Ahad pagi untuk memperkuat ibadah, qiyamul lail, dan kebersamaan santri.",
                image: ""
            },
            {
                id: "muhadhoroh-tiga-bahasa",
                title: "Pekan Muhadhoroh Akbar: Santri Tampilkan Kemampuan Dakwah Tiga Bahasa",
                date: "28 Agustus 2026",
                category: "Kegiatan",
                excerpt: "Santriwan dan santriwati menampilkan orasi dakwah dalam bahasa Arab, Inggris, dan Indonesia sebagai unjuk kemampuan public speaking internasional.",
                image: ""
            },
            {
                id: "prestasi-tahfidz-musabaqah",
                title: "Santri SMP MBS Al Badar Raih Juara MHQ Tingkat Kabupaten",
                date: "05 September 2026",
                category: "Prestasi",
                excerpt: "Prestasi gemilang diraih santri dalam ajang Musabaqah Hifdzil Qur'an (MHQ) berkat ketekunan murojaah dan bimbingan musyrif bersanad.",
                image: ""
            },
            {
                id: "ppdb-gelombang-pertama",
                title: "Pembukaan Pendaftaran PPDB TA 2027/2028 Sistem 2 Week Service",
                date: "15 September 2026",
                category: "Pengumuman",
                excerpt: "SMP MBS Al Badar resmi membuka pendaftaran santri baru untuk program Boarding dan Full Day School dengan sistem layanan verifikasi cepat 2 Week Service.",
                image: ""
            },
            {
                id: "prestasi-koding-robotik",
                title: "Tim Koding & Robotik Santri Raih Medali Kompetisi STEM Nasional",
                date: "02 Oktober 2026",
                category: "Prestasi",
                excerpt: "Integrasi kurikulum Koding & Kecerdasan Artifisial (KKA) berhasil mengantarkan santri meraih medali pada kejuaraan inovasi teknologi tingkat SMP.",
                image: ""
            }
        ];

        function renderNewsCards(data, category) {
            const filterCat = category || 'all';
            const filtered = (filterCat === 'all')
                ? data
                : data.filter(function(item) {
                    return item.category && item.category.toLowerCase() === filterCat.toLowerCase();
                });

            if (!filtered || filtered.length === 0) {
                newsGridContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;"><p style="font-size: 1.1rem; color: var(--color-text-muted);">Belum ada berita untuk kategori ini.</p></div>';
                return;
            }

            newsGridContainer.innerHTML = filtered.map(function(item) {
                return '<a href="berita-detail.html?id=' + encodeURIComponent(item.id) + '" class="news-card-lux lux-img-zoom">' +
                    '<div class="news-img-wrap">' +
                        '<img src="' + newsImage(item.image) + '" alt="' + item.title + '" loading="lazy" onerror="this.onerror=null;this.src=\'assets/img/placeholder.svg\';">' +
                    '</div>' +
                    '<div class="news-content-lux">' +
                        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">' +
                            '<span class="news-tag-lux">' + item.category + '</span>' +
                            '<span class="news-date" style="color: var(--color-text-muted); font-size: 0.75rem; font-weight: 500;">' + item.date + '</span>' +
                        '</div>' +
                        '<h3 class="news-title-lux">' + item.title + '</h3>' +
                        '<p class="news-excerpt-lux">' + item.excerpt + '</p>' +
                        '<span class="news-read-lux">Baca Selengkapnya</span>' +
                    '</div>' +
                '</a>';
            }).join('');
        }

        // Fetch news data: Priority Supabase -> Fallback assets/data/news.json -> Fallback hardcoded
        function loadNewsData() {
            if (typeof supabaseClient !== 'undefined') {
                supabaseClient
                    .from('news')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .then(function(res) {
                        if (res.error) throw res.error;
                        if (Array.isArray(res.data) && res.data.length > 0) {
                            cachedNewsData = res.data;
                            renderNewsCards(cachedNewsData, 'all');
                            return;
                        }
                        throw new Error('No news returned from Supabase');
                    })
                    .catch(function(err) {
                        console.warn('Supabase news query failed, falling back to news.json:', err);
                        fallbackToNewsJson();
                    });
            } else {
                fallbackToNewsJson();
            }
        }

        function fallbackToNewsJson() {
            fetch('assets/data/news.json')
                .then(function(response) {
                    if (!response.ok) throw new Error('HTTP status ' + response.status);
                    return response.json();
                })
                .then(function(data) {
                    cachedNewsData = data;
                    renderNewsCards(cachedNewsData, 'all');
                })
                .catch(function(err) {
                    console.warn('News JSON fetch error (using fallback data):', err);
                    cachedNewsData = fallbackNewsData;
                    renderNewsCards(cachedNewsData, 'all');
                });
        }

        loadNewsData();

        // Filter button click listener
        newsFilterButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                newsFilterButtons.forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                const selectedCategory = this.getAttribute('data-category') || 'all';
                renderNewsCards(cachedNewsData, selectedCategory);
            });
        });
    }

    // Berita Detail Page Logic (berita-detail.html)
    const articleContainer = document.getElementById('berita-detail-container');
    if (articleContainer) {
        function escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str == null ? '' : String(str);
            return div.innerHTML;
        }

        function renderArticle(item) {
            document.title = item.title + ' | SMP MBS Al Badar Prambanan';
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', item.excerpt || item.title);
            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle) ogTitle.setAttribute('content', item.title);
            const ogDesc = document.querySelector('meta[property="og:description"]');
            if (ogDesc) ogDesc.setAttribute('content', item.excerpt || item.title);
            const ogImage = document.querySelector('meta[property="og:image"]');
            if (ogImage && item.image && newsImage(item.image) === item.image) ogImage.setAttribute('content', item.image);

            const rawContent = String(item.content || item.excerpt || '');
            const isRichHtml = /<[a-z][\s\S]*>/i.test(rawContent);
            let bodyHtml;
            if (isRichHtml) {
                bodyHtml = (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(rawContent) : rawContent;
            } else {
                bodyHtml = rawContent
                    .split(/\n+/)
                    .map(function(p) { return p.trim(); })
                    .filter(Boolean)
                    .map(function(p) { return '<p>' + escapeHtml(p) + '</p>'; })
                    .join('');
            }

            articleContainer.innerHTML =
                '<div class="article-meta">' +
                    '<span class="news-tag-lux">' + escapeHtml(item.category) + '</span>' +
                    '<span class="news-date" style="color: var(--color-text-muted); font-size: 0.8rem; font-weight: 500;">' + escapeHtml(item.date) + '</span>' +
                '</div>' +
                '<h1 class="article-title">' + escapeHtml(item.title) + '</h1>' +
                '<div class="article-cover">' +
                    '<img src="' + newsImage(item.image) + '" alt="' + escapeHtml(item.title) + '" onerror="this.onerror=null;this.src=\'assets/img/placeholder.svg\';">' +
                '</div>' +
                '<div class="article-body">' + bodyHtml + '</div>';
        }

        function renderNotFound() {
            articleContainer.innerHTML =
                '<div class="article-not-found">' +
                    '<p>Berita yang kamu cari tidak ditemukan atau sudah dihapus.</p>' +
                    '<a href="news.html" class="btn btn-outline btn-sm" style="margin-top: 1rem; display: inline-block;">Kembali ke Semua Berita</a>' +
                '</div>';
        }

        const params = new URLSearchParams(window.location.search);
        const newsId = params.get('id');

        if (!newsId) {
            renderNotFound();
        } else if (typeof supabaseClient !== 'undefined') {
            supabaseClient
                .from('news')
                .select('*')
                .eq('id', newsId)
                .maybeSingle()
                .then(function(res) {
                    if (res.error || !res.data) throw new Error('not found in Supabase');
                    renderArticle(res.data);
                })
                .catch(function() {
                    fetch('assets/data/news.json')
                        .then(r => r.json())
                        .then(function(data) {
                            const found = data.find(function(n) { return n.id === newsId; });
                            if (found) renderArticle(found); else renderNotFound();
                        })
                        .catch(renderNotFound);
                });
        } else {
            fetch('assets/data/news.json')
                .then(r => r.json())
                .then(function(data) {
                    const found = data.find(function(n) { return n.id === newsId; });
                    if (found) renderArticle(found); else renderNotFound();
                })
                .catch(renderNotFound);
        }
    }

    // PPDB Brosur & Flyer Download Section
    const ppdbDocsContainer = document.getElementById('ppdbDocsContainer');
    if (ppdbDocsContainer) {
        const ppdbDocsSection = document.getElementById('ppdbDocsSection');

        function escapePpdbLabel(str) {
            const div = document.createElement('div');
            div.textContent = str == null ? '' : String(str);
            return div.innerHTML;
        }

        function renderPpdbDocsPublic(docs) {
            if (!docs || docs.length === 0) {
                if (ppdbDocsSection) ppdbDocsSection.style.display = 'none';
                return;
            }
            if (ppdbDocsSection) ppdbDocsSection.style.display = '';

            const fileIcon = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';

            ppdbDocsContainer.innerHTML = docs.map(function(doc) {
                return '<a href="' + doc.file_url + '" target="_blank" rel="noopener" class="ppdb-doc-card">' +
                    '<div class="ppdb-doc-icon">' + fileIcon + '</div>' +
                    '<div>' +
                        '<div class="ppdb-doc-label">' + escapePpdbLabel(doc.label) + '</div>' +
                        '<div class="ppdb-doc-action">Unduh Berkas</div>' +
                    '</div>' +
                '</a>';
            }).join('');
        }

        if (typeof supabaseClient !== 'undefined') {
            supabaseClient
                .from('ppdb_documents')
                .select('*')
                .order('display_order', { ascending: true })
                .then(function(res) {
                    if (res.error) throw res.error;
                    renderPpdbDocsPublic(res.data || []);
                })
                .catch(function() {
                    if (ppdbDocsSection) ppdbDocsSection.style.display = 'none';
                });
        } else {
            if (ppdbDocsSection) ppdbDocsSection.style.display = 'none';
        }
    }

    // Reveal on Scroll (Must be initialized AFTER news items are injected)
    const revealElements = document.querySelectorAll('.reveal, .reveal-stagger');
    if (revealElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    if (entry.target.classList.contains('reveal-stagger')) {
                        const children = Array.from(entry.target.parentNode.children).filter(c => c.classList.contains('reveal-stagger'));
                        const delay = children.indexOf(entry.target) * 100;
                        entry.target.style.transitionDelay = `${delay}ms`;
                    }
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        revealElements.forEach(el => observer.observe(el));
    }

    // Text Reveal Observer (Luxury Masked Line Animation)
    const textRevealElements = document.querySelectorAll('.text-reveal-wrap, .text-reveal');
    if (textRevealElements.length > 0) {
        const textRevealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        textRevealElements.forEach(el => textRevealObserver.observe(el));
    }

    // ==========================================================================
    // Smooth Scroll Animations (Level A: fade-in, Level B: fade-stagger)
    // ==========================================================================
    const fadeInElements = document.querySelectorAll('.fade-in');
    if (fadeInElements.length > 0) {
        const fadeInObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
        fadeInElements.forEach(el => fadeInObserver.observe(el));
    }

    const fadeStaggerElements = document.querySelectorAll('.fade-stagger');
    if (fadeStaggerElements.length > 0) {
        const fadeStaggerObserver = new IntersectionObserver((entries, observer) => {
            const intersecting = entries.filter(e => e.isIntersecting);
            intersecting.forEach((entry, idx) => {
                entry.target.style.transitionDelay = `${idx * 70}ms`;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
        fadeStaggerElements.forEach(el => fadeStaggerObserver.observe(el));
    }

    // Parallax Geometric Pattern (Islamic Rub el Hizb)
    const parallaxPatterns = document.querySelectorAll('.parallax-pattern');
    if (parallaxPatterns.length > 0) {
        let isTicking = false;

        const updateParallax = () => {
            const windowHeight = window.innerHeight;
            parallaxPatterns.forEach((pattern) => {
                const parent = pattern.closest('.has-parallax-pattern') || pattern.parentElement;
                if (parent) {
                    const rect = parent.getBoundingClientRect();
                    // Process only when section is visible in or near viewport
                    if (rect.top < windowHeight && rect.bottom > 0) {
                        const speed = parseFloat(pattern.getAttribute('data-parallax-speed')) || 0.15;
                        // Smooth, subtle translation relative to section position
                        const offset = (windowHeight - rect.top) * speed;
                        pattern.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
                    }
                } else {
                    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
                    const offset = scrollY * 0.15;
                    pattern.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
                }
            });
            isTicking = false;
        };

        window.addEventListener('scroll', () => {
            if (!isTicking) {
                window.requestAnimationFrame(updateParallax);
                isTicking = true;
            }
        }, { passive: true });

        // Initial positioning on load
        updateParallax();
    }

    // FAQ Accordion
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const expanded = this.getAttribute('aria-expanded') === 'true' || false;
            const answer = this.nextElementSibling;
            faqQuestions.forEach(q => {
                q.setAttribute('aria-expanded', 'false');
                if (q.nextElementSibling) q.nextElementSibling.style.maxHeight = null;
            });
            if (!expanded) {
                this.setAttribute('aria-expanded', 'true');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    // Set Year
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const zoomableImages = document.querySelectorAll('.zoomable');
    if (lightbox && lightboxImg) {
        zoomableImages.forEach(img => {
            img.addEventListener('click', function() {
                lightboxImg.src = this.src;
                lightbox.classList.add('active');
            });
        });
        lightbox.addEventListener('click', function() {
            lightbox.classList.remove('active');
        });
    }

    // Luxury Form Submit Handlers (Direct WhatsApp Bridge)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('contactName') ? document.getElementById('contactName').value.trim() : '';
            const email = document.getElementById('contactEmail') ? document.getElementById('contactEmail').value.trim() : '';
            const phone = document.getElementById('contactPhone') ? document.getElementById('contactPhone').value.trim() : '';
            const topic = document.getElementById('contactTopic') ? document.getElementById('contactTopic').value : 'Informasi Umum';
            const message = document.getElementById('contactMessage') ? document.getElementById('contactMessage').value.trim() : '';

            const waText = `*Formulir Kontak SMP MBS Al Badar*\n\n` +
                `*Nama:* ${name}\n` +
                `*Email:* ${email}\n` +
                `*No. HP/WA:* ${phone}\n` +
                `*Topik:* ${topic}\n` +
                `*Pesan:* ${message}`;

            window.open('https://wa.me/6285729348915?text=' + encodeURIComponent(waText), '_blank');
        });
    }

    const ppdbInquiryForm = document.getElementById('ppdbInquiryForm');
    if (ppdbInquiryForm) {
        ppdbInquiryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const parentName = document.getElementById('ppdbParentName') ? document.getElementById('ppdbParentName').value.trim() : '';
            const studentName = document.getElementById('ppdbStudentName') ? document.getElementById('ppdbStudentName').value.trim() : '';
            const phone = document.getElementById('ppdbPhone') ? document.getElementById('ppdbPhone').value.trim() : '';
            const program = document.getElementById('ppdbProgramChoice') ? document.getElementById('ppdbProgramChoice').value : '';
            const question = document.getElementById('ppdbQuestion') ? document.getElementById('ppdbQuestion').value.trim() : '-';

            const programLabel = program === 'boarding' ? 'SMP Boarding School (Asrama 24 Jam)' : 'SMP Full Day School (Harian)';

            const waText = `*Konsultasi PPDB SMP MBS Al Badar*\n\n` +
                `*Orang Tua/Wali:* ${parentName}\n` +
                `*Calon Santri:* ${studentName}\n` +
                `*No. WA:* ${phone}\n` +
                `*Pilihan Jalur:* ${programLabel}\n` +
                `*Pertanyaan/Catatan:* ${question}`;

            window.open('https://wa.me/6285729348915?text=' + encodeURIComponent(waText), '_blank');
        });
    }

    // ==========================================================================
    // Mobile Sticky CTA Bar (Vanilla JS Injection & Scroll Logic)
    // ==========================================================================
    const initMobileStickyCTA = () => {
        // Prevent duplicate creation
        if (document.querySelector('.mobile-sticky-cta')) return;

        const stickyCta = document.createElement('div');
        stickyCta.className = 'mobile-sticky-cta';
        stickyCta.id = 'mobileStickyCta';
        stickyCta.setAttribute('aria-label', 'Informasi PPDB Mobile');
        stickyCta.innerHTML = `
            <div class="mobile-sticky-cta-content">
                <span class="mobile-sticky-cta-badge">PPDB 2027/2028</span>
                <span class="mobile-sticky-cta-title">Pendaftaran Dibuka</span>
            </div>
            <a href="https://psb.mbs.sch.id" target="_blank" rel="noopener noreferrer" class="btn-lux btn-gold-lux mobile-sticky-cta-btn">
                <span>Daftar Sekarang</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
        `;
        document.body.appendChild(stickyCta);

        const heroSection = document.querySelector('.hero-lux, .page-hero, .ppdb-hero, .hero, header + section, header + main');
        const footer = document.querySelector('.site-footer, .site-footer-lux, footer');

        let isFooterIntersecting = false;
        let isScrolledPastHero = false;

        const updateStickyVisibility = () => {
            if (window.innerWidth > 768) {
                stickyCta.classList.remove('is-visible');
                document.body.classList.remove('sticky-cta-active');
                return;
            }

            if (isScrolledPastHero && !isFooterIntersecting) {
                stickyCta.classList.add('is-visible');
                document.body.classList.add('sticky-cta-active');
            } else {
                stickyCta.classList.remove('is-visible');
                document.body.classList.remove('sticky-cta-active');
            }
        };

        const handleScroll = () => {
            const heroHeight = heroSection ? heroSection.offsetHeight : 300;
            const threshold = Math.max(heroHeight * 0.5, 200);

            isScrolledPastHero = window.scrollY > threshold;
            updateStickyVisibility();
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll, { passive: true });

        // Use IntersectionObserver on footer to hide Sticky CTA when near footer
        if (footer && 'IntersectionObserver' in window) {
            const footerObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    isFooterIntersecting = entry.isIntersecting;
                    updateStickyVisibility();
                });
            }, {
                root: null,
                threshold: 0.05,
                rootMargin: '0px 0px 50px 0px'
            });

            footerObserver.observe(footer);
        }

        // Initial check
        handleScroll();
    };

    initMobileStickyCTA();
});


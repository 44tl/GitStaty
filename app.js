const API_BASE = 'https://api.github.com';
const PER_PAGE = 100;

const elements = {
    input: document.getElementById('usernameInput'),
    searchBtn: document.getElementById('searchBtn'),
    error: document.getElementById('errorMsg'),
    loading: document.getElementById('loading'),
    results: document.getElementById('results'),
    avatar: document.getElementById('avatar'),
    name: document.getElementById('name'),
    login: document.getElementById('login'),
    bio: document.getElementById('bio'),
    profileInfo: document.getElementById('profileInfo'),
    location: document.getElementById('location'),
    company: document.getElementById('company'),
    joined: document.getElementById('joined'),
    blog: document.getElementById('blog'),
    twitter: document.getElementById('twitter'),
    repos: document.getElementById('repos'),
    followers: document.getElementById('followers'),
    following: document.getElementById('following'),
    stars: document.getElementById('stars'),
    forks: document.getElementById('forks'),
    languages: document.getElementById('languages'),
    langSection: document.getElementById('langSection'),
    langBars: document.getElementById('langBars'),
    reposSection: document.getElementById('reposSection'),
    repoList: document.getElementById('repoList'),
    funFacts: document.getElementById('funFacts'),
    factsGrid: document.getElementById('factsGrid'),
    accountAge: document.getElementById('accountAge'),
    avgStars: document.getElementById('avgStars'),
    totalSize: document.getElementById('totalSize'),
};

let isSearching = false;

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) {
        if (res.status === 404) {
            throw new Error('User not found. Please check the username and try again.');
        }
        if (res.status === 403) {
            throw new Error('API rate limit reached. Please wait a moment and try again.');
        }
        throw new Error(`Request failed with status ${res.status}`);
    }
    return res.json();
}

async function fetchAllRepos(username) {
    const repos = [];
    let page = 1;
    while (true) {
        const url = `${API_BASE}/users/${encodeURIComponent(username)}/repos?per_page=${PER_PAGE}&page=${page}&sort=updated`;
        const data = await fetchJSON(url);
        if (!data.length) break;
        repos.push(...data);
        if (data.length < PER_PAGE) break;
        page++;
    }
    return repos;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
}

function setMeta(parent, text) {
    const span = document.createElement('span');
    span.className = 'meta-item';
    span.textContent = text || '';
    parent.appendChild(span);
}

function hide(elem) {
    elem.hidden = true;
}

function show(elem) {
    elem.hidden = false;
}

function clearError() {
    elements.error.hidden = true;
    elements.error.textContent = '';
}

function showError(message) {
    elements.error.textContent = message;
    elements.error.hidden = false;
}

function hideResults() {
    hide(elements.results);
    hide(elements.langSection);
    hide(elements.reposSection);
    hide(elements.funFacts);
}

function showLoading() {
    hideResults();
    show(elements.loading);
    hide(elements.error);
    elements.searchBtn.disabled = true;
}

function showResults() {
    hide(elements.loading);
    show(elements.results);
    elements.searchBtn.disabled = false;
}

function animateCounter(elem, target, duration = 800) {
    const start = 0;
    const startTime = performance.now();
    const isFloat = String(target).includes('.');
    const decimals = isFloat ? String(target).split('.')[1].length : 0;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (target - start) * eased;
        elem.textContent = current.toFixed(decimals);
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            elem.textContent = target;
        }
    }

    requestAnimationFrame(update);
}

function renderProfile(user) {
    elements.avatar.src = user.avatar_url;
    elements.avatar.alt = `${user.login} avatar`;
    elements.name.textContent = user.name || user.login;
    elements.login.textContent = `@${user.login}`;
    elements.login.href = user.html_url;

    if (user.bio) {
        elements.bio.textContent = user.bio;
        elements.bio.hidden = false;
    } else {
        elements.bio.hidden = true;
    }

    const metaContainer = document.createElement('div');
    metaContainer.className = 'meta';

    if (user.location) {
        setMeta(metaContainer, `Location: ${user.location}`);
    }
    if (user.company) {
        setMeta(metaContainer, `Company: ${user.company}`);
    }
    setMeta(metaContainer, `Joined ${formatDate(user.created_at)}`);

    const existingMeta = elements.profileInfo.querySelector('.meta');
    if (existingMeta) existingMeta.remove();
    elements.profileInfo.insertBefore(metaContainer, elements.profileInfo.querySelector('.socials'));

    const socials = document.querySelector('.socials');

    if (user.blog) {
        const href = user.blog.startsWith('http') ? user.blog : `https://${user.blog}`;
        elements.blog.href = href;
        elements.blog.textContent = href.replace(/^https?:\/\//, '');
        elements.blog.hidden = false;
    } else {
        elements.blog.hidden = true;
    }

    if (user.twitter_username) {
        elements.twitter.href = `https://twitter.com/${user.twitter_username}`;
        elements.twitter.textContent = `@${user.twitter_username}`;
        elements.twitter.hidden = false;
    } else {
        elements.twitter.hidden = true;
    }
}

function renderStats(user, repos) {
    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
    const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);
    const totalSize = repos.reduce((sum, r) => sum + (r.size || 0), 0);
    const avgStars = repos.length ? (totalStars / repos.length).toFixed(1) : 0;
    const accountAge = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24));

    animateCounter(elements.repos, user.public_repos);
    animateCounter(elements.followers, user.followers);
    animateCounter(elements.following, user.following);
    animateCounter(elements.stars, totalStars);
    animateCounter(elements.forks, totalForks);
    animateCounter(elements.avgStars, avgStars);
    animateCounter(elements.accountAge, accountAge);
    animateCounter(elements.totalSize, (totalSize / 1024).toFixed(1));
}

function renderLanguages(repos) {
    const langMap = new Map();
    repos.forEach(repo => {
        if (repo.language) {
            langMap.set(repo.language, (langMap.get(repo.language) || 0) + 1);
        }
    });

    const total = [...langMap.values()].reduce((a, b) => a + b, 0);
    if (!total) {
        hide(elements.langSection);
        return;
    }

    const sorted = [...langMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const colors = [
        '#f1e05a', '#3572A5', '#e34c26', '#563d7c', '#4F5D95',
        '#00ADD8', '#4F5D95', '#b07219', '#3178c6', '#dea584'
    ];

    elements.langBars.innerHTML = '';
    sorted.forEach(([name, count], index) => {
        const percent = ((count / total) * 100).toFixed(1);
        const color = colors[index % colors.length];

        const item = document.createElement('div');
        item.className = 'lang-item';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'lang-name';
        nameSpan.textContent = name;

        const barWrap = document.createElement('div');
        barWrap.className = 'lang-bar-wrap';

        const bar = document.createElement('div');
        bar.className = 'lang-bar';
        bar.style.width = '0%';
        bar.style.backgroundColor = color;
        barWrap.appendChild(bar);

        const percentSpan = document.createElement('span');
        percentSpan.className = 'lang-percent';
        percentSpan.textContent = `${percent}%`;

        item.appendChild(nameSpan);
        item.appendChild(barWrap);
        item.appendChild(percentSpan);
        elements.langBars.appendChild(item);

        requestAnimationFrame(() => {
            bar.style.width = `${percent}%`;
        });
    });

    elements.languages.textContent = langMap.size;
    show(elements.langSection);
}

function renderTopRepos(repos) {
    const top = [...repos]
        .sort((a, b) => b.stargazers_count - a.stargazers_count || b.forks_count - a.forks_count)
        .slice(0, 6);

    if (!top.length) {
        hide(elements.reposSection);
        return;
    }

    elements.repoList.innerHTML = '';
    top.forEach(repo => {
        const div = document.createElement('div');
        div.className = 'repo-item';

        const name = document.createElement('a');
        name.className = 'repo-name';
        name.href = repo.html_url;
        name.target = '_blank';
        name.rel = 'noopener';
        name.textContent = repo.name;

        const desc = document.createElement('p');
        desc.className = 'repo-desc truncated';
        desc.textContent = repo.description || 'No description';

        const stats = document.createElement('div');
        stats.className = 'repo-stats';

        const stars = document.createElement('span');
        stars.className = 'repo-stat';
        stars.textContent = `Stars: ${repo.stargazers_count}`;

        const forks = document.createElement('span');
        forks.className = 'repo-stat';
        forks.textContent = `Forks: ${repo.forks_count}`;

        const lang = document.createElement('span');
        lang.className = 'repo-stat';
        lang.textContent = repo.language ? `Language: ${repo.language}` : '';

        const size = document.createElement('span');
        size.className = 'repo-stat';
        size.textContent = `Size: ${repo.size} KB`;

        const updated = document.createElement('span');
        updated.className = 'repo-stat';
        updated.textContent = `Updated: ${formatDate(repo.updated_at)}`;

        stats.appendChild(stars);
        stats.appendChild(forks);
        if (lang.textContent) stats.appendChild(lang);
        stats.appendChild(size);
        stats.appendChild(updated);

        const extra = document.createElement('div');
        extra.className = 'repo-extra';
        extra.textContent = repo.description || 'No additional details available for this repository.';

        div.appendChild(name);
        div.appendChild(desc);
        div.appendChild(stats);
        div.appendChild(extra);

        div.addEventListener('click', () => {
            div.classList.toggle('expanded');
        });

        elements.repoList.appendChild(div);
    });

    show(elements.reposSection);
}

function renderFunFacts(user, repos) {
    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
    const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);
    const avgStars = repos.length ? (totalStars / repos.length).toFixed(1) : 0;
    const accountAgeYears = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    const facts = [];

    if (user.bio) {
        const bioWords = user.bio.split(/\s+/).length;
        facts.push({ label: 'Bio word count', value: bioWords });
    }

    if (user.avatar_url) {
        facts.push({ label: 'Has custom avatar', value: 'Yes' });
    }

    const completionFields = [
        user.name, user.bio, user.company, user.location, user.blog, user.twitter_username
    ].filter(Boolean).length;
    const completionPercent = Math.round((completionFields / 6) * 100);
    facts.push({ label: 'Profile completeness', value: `${completionPercent}%` });

    facts.push({ label: 'GitHub age', value: `${accountAgeYears.toFixed(1)} years` });

    if (repos.length > 0) {
        facts.push({ label: 'Most stars in one repo', value: Math.max(...repos.map(r => r.stargazers_count)) });
        facts.push({ label: 'Most forks in one repo', value: Math.max(...repos.map(r => r.forks_count)) });
    }

    if (totalStars >= 100) {
        facts.push({ label: 'Star milestone', value: 'Star collector' });
    }
    if (totalForks >= 50) {
        facts.push({ label: 'Fork milestone', value: 'Fork master' });
    }
    if (repos.length >= 50) {
        facts.push({ label: 'Repo milestone', value: 'Code explorer' });
    }

    if (!facts.length) {
        hide(elements.funFacts);
        return;
    }

    elements.factsGrid.innerHTML = '';
    facts.forEach(fact => {
        const card = document.createElement('div');
        card.className = 'fact-card';
        card.innerHTML = `<div class="fact-label">${fact.label}</div><div class="fact-value">${fact.value}</div>`;
        elements.factsGrid.appendChild(card);
    });

    show(elements.funFacts);
}

function initParticles() {
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.radius = Math.random() * 1.5 + 0.5;
            this.opacity = Math.random() * 0.3 + 0.1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(88, 166, 255, ${this.opacity})`;
            ctx.fill();
        }
    }

    function createParticles() {
        const count = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 80);
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(88, 166, 255, ${0.06 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        drawConnections();
        animationId = requestAnimationFrame(animate);
    }

    resize();
    createParticles();
    animate();

    window.addEventListener('resize', () => {
        resize();
        createParticles();
    });
}

async function search(username) {
    if (!username.trim() || isSearching) return;

    clearError();
    hideResults();
    showLoading();
    isSearching = true;

    try {
        const [user, repos] = await Promise.all([
            fetchJSON(`${API_BASE}/users/${encodeURIComponent(username.trim())}`),
            fetchAllRepos(username.trim()),
        ]);

        renderProfile(user);
        renderStats(user, repos);
        renderLanguages(repos);
        renderTopRepos(repos);
        renderFunFacts(user, repos);
        showResults();
    } catch (err) {
        hide(elements.loading);
        showError(err.message);
        elements.searchBtn.disabled = false;
    } finally {
        isSearching = false;
    }
}

elements.searchBtn.addEventListener('click', () => {
    search(elements.input.value);
});

elements.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        search(elements.input.value);
    }
});

initParticles();

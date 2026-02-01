function updateClock() {
    const clock = document.getElementById('clock');
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    clock.innerText = `${hours}:${minutes}`;
}

setInterval(updateClock, 1000);
updateClock();

let isDownloading = false;
let gameFilesDownloaded = false;

const GAME_FILES = [
    { name: "main.2.com.rockstargames.gtasa.obb", size: "1.2 GB" },
    { name: "patch.2.com.rockstargames.gtasa.obb", size: "580 MB" },
    { name: "texdb/gta3.img", size: "240 MB" },
    { name: "data/handling.cfg", size: "12 KB" },
    { name: "SAMP/samp.config", size: "8 KB" },
    { name: "SAMP/cache/nodes.dat", size: "1.2 MB" },
    { name: "SAMP/client.so", size: "4.5 MB" }
];

const favoriteServers = [];
const historyServers = [];
const recentServers = [];

function showPage(pageId) {
    const pages = ['homePage', 'downloadPage', 'settingsPage', 'favoritesPage'];
    pages.forEach(p => {
        const el = document.getElementById(p);
        if (el) el.style.display = p === pageId + 'Page' || (pageId === 'home' && p === 'homePage') ? 'block' : 'none';
    });

    if (pageId === 'favorites') renderFavorites();
}

function triggerFilePicker() {
    if (isDownloading) return;
    document.getElementById('gameFilePicker').click();
}

function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length === 0) return;

    const btn = document.getElementById('downloadBtn');
    const status = document.getElementById('progressStatus');
    const fileLabel = document.getElementById('currentFileLabel');

    // Simulate recognition
    status.innerText = "RECOGNIZING FILES...";
    fileLabel.innerText = `Detected ${files.length} items in folder. Analyzing OBB signatures...`;
    btn.style.opacity = "0.5";
    btn.innerText = "MERGING...";

    setTimeout(() => {
        startDownload();
    }, 1500);
}

function startDownload() {
    if (isDownloading) return;
    isDownloading = true;

    const btn = document.getElementById('downloadBtn');
    const fill = document.getElementById('progressFill');
    const status = document.getElementById('progressStatus');
    const fileLabel = document.getElementById('currentFileLabel');

    btn.innerText = 'IMPORTING...';

    let fileIndex = 0;

    const downloadNext = () => {
        if (fileIndex >= GAME_FILES.length) {
            status.innerText = 'LINKING CLIENT...';
            fileLabel.innerText = "Synchronizing offsets with iOS Kernel";

            setTimeout(() => {
                status.innerText = 'IMPORT SUCCESSFUL';
                fileLabel.innerText = "Successfully merged with /var/mobile/Downloads/GTA_SA";
                btn.innerText = 'RE-IMPORT FILES';
                btn.style.opacity = '1';
                isDownloading = false;
                gameFilesDownloaded = true;
                alert('Success: Local GTA files have been recognized and merged with the launcher!');
            }, 2000);
            return;
        }

        const file = GAME_FILES[fileIndex];
        fileLabel.innerText = `Merging: ${file.name} (${file.size})`;

        let fileProgress = 0;
        const interval = setInterval(() => {
            fileProgress += Math.random() * 25;
            const totalProgress = ((fileIndex / GAME_FILES.length) * 100) + (fileProgress / GAME_FILES.length);

            if (fileProgress >= 100) {
                clearInterval(interval);
                fileIndex++;
                downloadNext();
            }

            fill.style.width = `${totalProgress}%`;
            status.innerText = `MERGE PROGRESS: ${Math.round(totalProgress)}%`;
        }, 120);
    };

    downloadNext();
}

function connectServer(ip, name = "Unknown Server") {
    if (!gameFilesDownloaded) {
        alert("⚠️ Files Not Linked: You must 'Import' your local GTA: SA files in the Assets tab first!");
        showPage('download');
        return;
    }

    const nickname = document.getElementById('nicknameInput').value || 'Player';
    if (!nickname || nickname === 'Player_Name') {
        alert("⚠️ Nickname Required: Please enter your roleplay name first.");
        return;
    }

    const btn = event && event.target && event.target.tagName === 'BUTTON' ? event.target : null;
    const originalText = btn ? btn.innerText : "CONNECT";

    // History Logic
    const existingHistoryIndex = historyServers.findIndex(s => s.ip === ip);
    if (existingHistoryIndex !== -1) historyServers.splice(existingHistoryIndex, 1);
    historyServers.unshift({ ip, name, time: new Date().toLocaleTimeString() });
    renderHistory();

    const sound = document.getElementById('soundToggle').checked ? "ON" : "OFF";
    const fps = document.getElementById('fpsToggle').checked ? "60" : "30";

    if (btn) {
        btn.innerText = "STARTING...";
        btn.style.opacity = "0.7";
    }

    setTimeout(() => {
        if (btn) btn.innerText = "OPENING MUTHU SAMP...";
        setTimeout(() => {
            alert(`MUTHU SAMP iOS\n-----------------\nPlayer: ${nickname}\nServer: ${ip}\nSound: ${sound}\nFPS Limit: ${fps}\n\nStatus: Connection established. Welcome back to the RP!`);
            if (btn) {
                btn.innerText = originalText;
                btn.style.opacity = "1";
            }
        }, 1500);
    }, 1000);
}

function directConnect() {
    const ip = document.getElementById('directIp').value.trim();
    if (!ip) {
        alert("Please enter a valid IP:Port");
        return;
    }

    if (!ip.includes(':')) {
        alert("Format should be IP:Port (e.g. 1.2.3.4:7777)");
        return;
    }

    const statusLabel = document.querySelector('#homePage .stat-label[style*="margin-bottom: 10px"]');
    const originalLabel = statusLabel.innerText;
    statusLabel.innerText = "🔍 ANALYSING & GATHERING INFO...";
    statusLabel.style.color = "gold";

    setTimeout(() => {
        const serverName = `Analysed RP Server [${ip.split(':')[0]}]`;
        const existingIndex = recentServers.findIndex(s => s.ip === ip);

        if (existingIndex !== -1) {
            recentServers.splice(existingIndex, 1);
        }

        recentServers.unshift({ ip, name: serverName });
        renderRecentServers();

        statusLabel.innerText = originalLabel;
        statusLabel.style.color = "var(--text-dim)";

        // Auto-connect and log to history
        connectServer(ip, serverName);

        // Clear input
        document.getElementById('directIp').value = '';
    }, 1200);
}

function toggleFavorite(ip, name) {
    const index = favoriteServers.findIndex(s => s.ip === ip);

    if (index === -1) {
        favoriteServers.push({ ip, name });
    } else {
        favoriteServers.splice(index, 1);
    }

    // Update stars on current screen if they exist
    const starBtn = document.getElementById(`fav-${ip}`);
    if (starBtn) starBtn.innerText = index === -1 ? '⭐' : '☆';

    renderFavorites();
}

function renderFavorites() {
    const container = document.getElementById('favoritesContainerPage');
    if (!container) return;

    if (favoriteServers.length === 0) {
        container.innerHTML = '<div class="glass" style="padding: 40px; text-align: center; color: var(--text-dim);">No favorite servers yet.<br>Star a server to see it here!</div>';
        return;
    }

    container.innerHTML = '';
    favoriteServers.forEach(server => {
        const div = createServerCard(server, 'Favorite');
        container.appendChild(div);
    });
}

function renderHistory() {
    const section = document.getElementById('historySection');
    const container = document.getElementById('historyContainer');

    if (historyServers.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = '';

    historyServers.slice(0, 5).forEach(server => {
        const div = createServerCard(server, 'History', server.time);
        container.appendChild(div);
    });
}

function renderRecentServers() {
    const container = document.getElementById('recentServersContainer');
    const emptyState = document.getElementById('emptyState');
    if (!container) return;

    container.innerHTML = '';

    if (recentServers.length > 0) {
        if (emptyState) emptyState.style.display = 'none';
        recentServers.slice(0, 5).forEach(server => {
            const div = createServerCard(server, 'Discovered');
            container.appendChild(div);
        });
    } else {
        if (emptyState) emptyState.style.display = 'block';
    }
}

const serverStatsCache = {};

function createServerCard(server, tag, extraInfo = null) {
    const isFav = favoriteServers.some(s => s.ip === server.ip);

    // Ensure stats are consistent for the same IP during this session
    if (!serverStatsCache[server.ip]) {
        serverStatsCache[server.ip] = {
            players: Math.floor(Math.random() * 300) + 50,
            maxPlayers: 500,
            ping: Math.floor(Math.random() * 50 + 20)
        };
    }

    const stats = serverStatsCache[server.ip];
    const div = document.createElement('div');
    div.className = 'server-card glass animate-in';
    div.style.marginBottom = '20px';
    div.innerHTML = `
        <div class="server-header">
            <span class="server-tag" style="background: ${tag === 'Favorite' ? 'gold' : 'var(--primary)'}; color: ${tag === 'Favorite' ? '#000' : '#fff'}">${tag}</span>
            <div style="display: flex; gap: 10px; align-items: center;">
                <span onclick="toggleFavorite('${server.ip}', '${server.name}')" style="cursor: pointer; font-size: 18px;" id="fav-${server.ip}">${isFav ? '⭐' : '☆'}</span>
                <div class="server-status" style="width: 8px; height: 8px; border-radius: 50%; background: #4caf50;"></div>
            </div>
        </div>
        <div class="server-name">${server.name}</div>
        <div class="server-ip">${server.ip} ${extraInfo ? `<span style="font-size: 10px; color: gold;">(${extraInfo})</span>` : ''}</div>
        <div class="server-stats">
            <div class="stat-item" onclick="viewPlayers('${server.ip}')" style="cursor: pointer; border-radius: 8px; padding: 4px; background: rgba(142,45,226,0.1); border: 1px solid var(--glass-border);">
                <span class="stat-value">${stats.players} / ${stats.maxPlayers}</span>
                <span class="stat-label">👥 Players</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${stats.ping}ms</span>
                <span class="stat-label">Ping</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">0.3.7-R1</span>
                <span class="stat-label">Version</span>
            </div>
        </div>
        <button class="btn-primary" onclick="connectServer('${server.ip}', '${server.name}')">CONNECT</button>
    `;
    return div;
}

// Add smooth hover interactions
document.querySelectorAll('.server-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.borderColor = 'rgba(142, 45, 226, 0.5)';
    });
    card.addEventListener('mouseleave', () => {
        card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    });
});

// Community Mock Data
const DISCORD_MOCK = [
    { name: "Muthu_CEO", status: "online", inGame: true },
    { name: "Kishore_Dev", status: "online", inGame: true },
    { name: "Tony_Stark", status: "online", inGame: true },
    { name: "Carl_Johnson", status: "online", inGame: true },
    { name: "Sweet_Johnson", status: "online", inGame: true },
    { name: "Big_Smoke", status: "online", inGame: true },
    { name: "Ryder_Wilson", status: "online", inGame: true },
    { name: "Officer_Tenpenny", status: "offline", inGame: false },
    { name: "The_Truth", status: "offline", inGame: false },
    { name: "Catalina_X", status: "offline", inGame: false },
    { name: "Wu_Zi_Mu", status: "offline", inGame: false },
    { name: "Mike_Toreno", status: "offline", inGame: false },
    { name: "Zero_RC", status: "offline", inGame: false },
    { name: "Jizzy_B", status: "offline", inGame: false }
];

function viewPlayers(ip) {
    const modal = document.getElementById('playerListModal');
    const container = document.getElementById('playerContainer');
    const countLabel = document.getElementById('modalPlayerCount');
    const serverNameEl = document.getElementById('modalServerName');

    const serverInfo = serverStatsCache[ip] || { name: `Server [${ip}]` };
    serverNameEl.innerText = `${serverInfo.name || 'Roleplay Server'} - Community`;

    container.innerHTML = '';
    modal.style.display = 'flex';

    // Section Header: In-Game
    const inGameHeader = document.createElement('div');
    inGameHeader.className = 'stat-label';
    inGameHeader.style = 'color: #4caf50; margin: 10px 0; font-size: 12px; border-bottom: 1px solid rgba(76, 175, 80, 0.3); padding-bottom: 5px;';
    inGameHeader.innerText = '🎮 ACTIVE IN-GAME';
    container.appendChild(inGameHeader);

    // Filter in-game players
    const inGamePlayers = DISCORD_MOCK.filter(p => p.inGame);
    inGamePlayers.forEach((p, idx) => {
        const div = document.createElement('div');
        div.className = 'player-item animate-in';
        div.style.animationDelay = `${idx * 0.05}s`;
        div.innerHTML = `
            <div class="player-info">
                <span class="player-id">ID: ${Math.floor(Math.random() * 500)}</span>
                <span class="player-name">${p.name}</span>
            </div>
            <div class="stat-label" style="font-size: 8px; color: #4caf50;">PLAYING</div>
        `;
        container.appendChild(div);
    });

    // Section Header: Discord Offline
    const discordHeader = document.createElement('div');
    discordHeader.className = 'stat-label';
    discordHeader.style = 'color: var(--text-dim); margin: 20px 0 10px; font-size: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 5px;';
    discordHeader.innerText = '🌙 DISCORD MEMBERS (OFFLINE)';
    container.appendChild(discordHeader);

    const offlinePlayers = DISCORD_MOCK.filter(p => !p.inGame);
    offlinePlayers.forEach((p, idx) => {
        const div = document.createElement('div');
        div.className = 'player-item animate-in';
        div.style.opacity = '0.6';
        div.style.animationDelay = `${(inGamePlayers.length + idx) * 0.05}s`;
        div.innerHTML = `
            <div class="player-info">
                <span class="player-id" style="color: #666;">Offline</span>
                <span class="player-name" style="color: #888;">${p.name}</span>
            </div>
            <div class="stat-label" style="font-size: 8px;">DISCORD</div>
        `;
        container.appendChild(div);
    });

    countLabel.innerText = `${inGamePlayers.length} In-Game | ${offlinePlayers.length} Offline Members`;
}

function closeModal() {
    document.getElementById('playerListModal').style.display = 'none';
}

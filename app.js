// Reglas del juego
const STORAGE_KEY = 'verrotwood_app_state';
const TRAITS = ['STR', 'DEX', 'INT', 'DEF'];
const MAX_CULTISTS = 4;
const STAT_MIN = 1;
const STAT_MAX = 5;
const STAT_COST = 50;
const HEALTH_MIN = 10;
const HEALTH_MAX = 25;
const HEALTH_STEP = 5;
const HEALTH_COST = 75;
const DEFAULT_FAVOR = 300; // Manual: 300 para empezar campaña, 500 para partida suelta
const MOVE_INCHES = 6;
const RUN_INCHES = 9;
const MAX_RITUALS = 4;

// Catálogo de rituales (data/rituals.js) indexado por id
const RITUAL_BY_ID = new Map(RITUALS.map(r => [r.id, r]));

// Catálogo de equipo (data/equipment.js) indexado por id
const ITEM_BY_ID = new Map([
    ...WEAPONS.map(w => [w.id, { ...w, kind: 'weapon' }]),
    ...GEAR.map(g => [g.id, { ...g, kind: 'gear' }])
]);

// Variante del manual: empezar con RP fijo en lugar de tirar
const RP_FIXED = 20;

// Campaña (manual, págs. 48-51): Poder para ganar y recompensas de los encuentros
const POWER_GOAL_SHORT = 5;
const POWER_GOAL_LONG = 21;
const ENCOUNTER_WIN_POWER = 1;
const ENCOUNTER_WIN_FAVOR = 100;
const ENCOUNTER_LOSS_FAVOR = 50;

// Estado global de la aplicación
let cultState = {
    cultName: '',
    deityName: '',
    deityLore: '',
    ritualTrait: '',
    startingFavor: DEFAULT_FAVOR,
    power: 0,
    powerGoal: POWER_GOAL_SHORT,
    rpMode: 'roll', // 'roll' (tirada oficial) o 'fixed' (20 RP)
    rituals: [],
    reserve: [],    // Equipo comprado o encontrado que no lleva ningún cultista
    cultists: []
};

// Referencias al DOM
const cultNameInput = document.getElementById('cultName');
const displayDeityName = document.getElementById('displayDeityName');
const displayDeityLore = document.getElementById('displayDeityLore');
const displayRitualTrait = document.getElementById('displayRitualTrait');
const rosterSection = document.getElementById('rosterSection');
const rosterLockMessage = document.getElementById('rosterLockMessage');

// Referencias de la Modal
const deityModal = document.getElementById('deityModal');
const modalGrimoireBox = document.getElementById('modalGrimoireBox');
const openDeityModalBtn = document.getElementById('openDeityModalBtn');
const closeDeityModalBtn = document.getElementById('closeDeityModalBtn');
const saveDeityModalBtn = document.getElementById('saveDeityModalBtn');
const modalDeityName = document.getElementById('modalDeityName');
const modalDeityLore = document.getElementById('modalDeityLore');

const startingFavorInput = document.getElementById('startingFavor');
const favorHint = document.getElementById('favorHint');
const spentFavorSpan = document.getElementById('spentFavor');
const remainingFavorSpan = document.getElementById('remainingFavor');
const saveStatus = document.getElementById('saveStatus');
const rosterContainer = document.getElementById('rosterContainer');
const cultistCountSpan = document.getElementById('cultistCount');
const addCultistBtn = document.getElementById('addCultistBtn');
const rpPoolTotal = document.getElementById('rpPoolTotal');
const rpPoolStatus = document.getElementById('rpPoolStatus');
const rollAllRpBtn = document.getElementById('rollAllRpBtn');
const newGameBtn = document.getElementById('newGameBtn');
const rpFixedToggle = document.getElementById('rpFixedToggle');
const reserveList = document.getElementById('reserveList');

// Referencias de Campaña (Poder)
const powerValue = document.getElementById('powerValue');
const powerBarFill = document.getElementById('powerBarFill');
const powerStatus = document.getElementById('powerStatus');
const powerGoalInput = document.getElementById('powerGoal');
const powerDownBtn = document.getElementById('powerDownBtn');
const powerUpBtn = document.getElementById('powerUpBtn');
const encounterWinBtn = document.getElementById('encounterWinBtn');
const encounterLossBtn = document.getElementById('encounterLossBtn');
const campaignBox = document.querySelector('.campaign-box');

// Referencias de Rituales
const ritualStatus = document.getElementById('ritualStatus');
const selectedRitualsList = document.getElementById('selectedRituals');
const openRitualModalBtn = document.getElementById('openRitualModalBtn');
const ritualModal = document.getElementById('ritualModal');
const ritualSearch = document.getElementById('ritualSearch');
const ritualFilters = document.getElementById('ritualFilters');
const ritualCatalog = document.getElementById('ritualCatalog');
const ritualModalCount = document.getElementById('ritualModalCount');
const closeRitualModalBtn = document.getElementById('closeRitualModalBtn');

let ritualFilter = 'all';
let ritualQuery = '';

let selectedTraitTemp = null; // Atributo elegido en la modal, aún sin consagrar
let favorHintTimer = null;

// Escapar texto del usuario antes de insertarlo en innerHTML
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Entero dentro de [min, max]; si no es un número, devuelve fallback
function clampInt(value, min, max, fallback) {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
}

// Anular la tirada de RP de un cultista (vuelve a poder tirar)
function resetRoll(cultist) {
    cultist.rolled = false;
    cultist.diceResults = [];
    cultist.rpTotal = 0;
}

// Normalizar un cultista guardado: valores dentro de las reglas y tirada coherente
function sanitizeCultist(raw, index, ritualTrait) {
    const c = raw && typeof raw === 'object' ? raw : {};
    const health = clampInt(c.health, HEALTH_MIN, HEALTH_MAX, HEALTH_MIN);

    const cultist = {
        name: typeof c.name === 'string' ? c.name : `Iniciado ${index + 1}`,
        notes: typeof c.notes === 'string' ? c.notes : '',
        equipment: sanitizeEquipment(c.equipment),
        str: clampInt(c.str, STAT_MIN, STAT_MAX, STAT_MIN),
        dex: clampInt(c.dex, STAT_MIN, STAT_MAX, STAT_MIN),
        int: clampInt(c.int, STAT_MIN, STAT_MAX, STAT_MIN),
        def: clampInt(c.def, STAT_MIN, STAT_MAX, STAT_MIN),
        health: HEALTH_MIN + Math.round((health - HEALTH_MIN) / HEALTH_STEP) * HEALTH_STEP,
        rolled: false,
        diceResults: [],
        rpTotal: 0
    };

    // La tirada solo es válida si tiene tantos dados como el atributo de ritual actual
    const dice = Array.isArray(c.diceResults) ? c.diceResults.map(d => clampInt(d, 1, 10, 1)) : [];
    const expectedDice = ritualTrait ? cultist[ritualTrait.toLowerCase()] : 0;
    if (c.rolled === true && dice.length > 0 && dice.length === expectedDice) {
        cultist.rolled = true;
        cultist.diceResults = dice;
        cultist.rpTotal = Math.max(...dice);
    }
    return cultist;
}

// Normalizar una lista de equipo. Cada entrada guarda lo que costó: 0 si se encontró explorando.
// Las versiones anteriores guardaban solo ids; se asume el precio de catálogo.
function sanitizeEquipment(list) {
    if (!Array.isArray(list)) return [];
    return list.map(entry => {
        const id = typeof entry === 'string' ? entry : entry && entry.id;
        const item = ITEM_BY_ID.get(id);
        if (!item) return null;
        const cost = typeof entry === 'object' ? clampInt(entry.cost, 0, item.cost, item.cost) : item.cost;
        return { id, cost };
    }).filter(Boolean);
}

// Normalizar el estado guardado para que datos viejos o manipulados no rompan la app
function sanitizeState(raw) {
    const s = raw && typeof raw === 'object' ? raw : {};
    const ritualTrait = TRAITS.includes(s.ritualTrait) ? s.ritualTrait : '';
    const state = {
        cultName: typeof s.cultName === 'string' ? s.cultName : '',
        deityName: typeof s.deityName === 'string' ? s.deityName : '',
        deityLore: typeof s.deityLore === 'string' ? s.deityLore : '',
        ritualTrait,
        startingFavor: clampInt(s.startingFavor, 0, Infinity, DEFAULT_FAVOR),
        power: clampInt(s.power, 0, 999, 0),
        powerGoal: clampInt(s.powerGoal, 1, 999, POWER_GOAL_SHORT),
        rpMode: s.rpMode === 'fixed' ? 'fixed' : 'roll',
        // Solo ids del catálogo, sin repetir y como máximo 4
        rituals: Array.isArray(s.rituals)
            ? [...new Set(s.rituals.filter(id => RITUAL_BY_ID.has(id)))].slice(0, MAX_RITUALS)
            : [],
        reserve: sanitizeEquipment(s.reserve),
        cultists: Array.isArray(s.cultists)
            ? s.cultists.slice(0, MAX_CULTISTS).map((c, i) => sanitizeCultist(c, i, ritualTrait))
            : []
    };

    // Objetos únicos (la montura): solo se conserva el primero de todo el culto, reserva incluida
    const seenUnique = new Set();
    const keepFirstUnique = list => list.filter(entry => {
        if (!ITEM_BY_ID.get(entry.id).unique) return true;
        if (seenUnique.has(entry.id)) return false;
        seenUnique.add(entry.id);
        return true;
    });
    state.cultists.forEach(c => { c.equipment = keepFirstUnique(c.equipment); });
    state.reserve = keepFirstUnique(state.reserve);
    return state;
}

// Cargar estado desde localStorage
function loadState() {
    let saved = null;
    let raw = null;
    try {
        raw = localStorage.getItem(STORAGE_KEY);
        if (raw) saved = JSON.parse(raw);
    } catch (e) {
        // Datos corruptos: se conserva una copia y se empieza un culto nuevo
        console.warn('No se pudo leer el culto guardado; se empieza uno nuevo.', e);
        try {
            if (raw) localStorage.setItem(`${STORAGE_KEY}_corrupt`, raw);
        } catch (backupError) {}
    }
    if (!saved) return;
    applyState(sanitizeState(saved));
}

// Sustituir el culto actual por otro ya normalizado (al cargar o al importar)
function applyState(state) {
    cultState = state;
    // El presupuesto nunca puede quedar por debajo de lo ya gastado
    cultState.startingFavor = Math.max(cultState.startingFavor, calculateSpentFavor());

    cultNameInput.value = cultState.cultName;
    startingFavorInput.value = cultState.startingFavor;

    updateDeityDisplay();
}

// Guardar estado en localStorage
function saveState() {
    cultState.cultName = cultNameInput.value.trim();
    cultState.startingFavor = clampInt(startingFavorInput.value, 0, Infinity, 0);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cultState));
        showSaveStatus(true);
    } catch (e) {
        console.warn('No se pudo guardar el culto en el navegador.', e);
        showSaveStatus(false);
    }
}

// Indicador de guardado automático (sustituye al antiguo botón "Guardar Culto")
function showSaveStatus(ok) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    saveStatus.textContent = ok
        ? `✓ Guardado automáticamente · ${time}`
        : 'No se pudo guardar en este navegador. Exporta el culto a JSON para no perderlo.';
    saveStatus.classList.toggle('is-error', !ok);
}

// Actualizar la visualización de la deidad y bloquear/desbloquear Roster
function updateDeityDisplay() {
    if (cultState.deityName && cultState.ritualTrait) {
        displayDeityName.textContent = cultState.deityName;
        displayDeityLore.textContent = cultState.deityLore || 'Sin lore asignado...';
        displayRitualTrait.textContent = cultState.ritualTrait;
        // La web adopta la paleta del atributo de la deidad
        document.body.dataset.theme = cultState.ritualTrait;
    } else {
        displayDeityName.textContent = 'Ninguna deidad invocada';
        displayDeityLore.textContent = 'Asigna un dios a tu culto...';
        displayRitualTrait.textContent = '-';
        delete document.body.dataset.theme;
    }
    checkRosterLock();
}

function checkRosterLock() {
    if (cultState.deityName && cultState.ritualTrait) {
        rosterSection.classList.remove('locked-section');
        rosterLockMessage.style.display = 'none';
        addCultistBtn.disabled = cultState.cultists.length >= MAX_CULTISTS;
    } else {
        rosterSection.classList.add('locked-section');
        rosterLockMessage.style.display = 'block';
        addCultistBtn.disabled = true;
    }
}

// Control de la Modal de Deidad
openDeityModalBtn.addEventListener('click', () => {
    modalDeityName.value = cultState.deityName || '';
    modalDeityLore.value = cultState.deityLore || '';
    // Sin deidad no hay atributo preseleccionado: se elige a conciencia
    selectedTraitTemp = cultState.ritualTrait || null;
    highlightSelectedQuadrant(selectedTraitTemp);
    deityModal.style.display = 'flex';
    (quadrants.find(q => q.tabIndex === 0) || quadrants[0]).focus();
});

closeDeityModalBtn.addEventListener('click', () => {
    deityModal.style.display = 'none';
});

const quadrants = [...document.querySelectorAll('.quadrant')];

window.selectTrait = function(trait) {
    selectedTraitTemp = trait;
    highlightSelectedQuadrant(trait);
};

// Marca el atributo elegido (radio accesible) y previsualiza su paleta en la modal
function highlightSelectedQuadrant(trait) {
    quadrants.forEach(q => {
        const isSelected = q.dataset.trait === trait;
        q.classList.toggle('selected', isSelected);
        q.setAttribute('aria-checked', String(isSelected));
        q.tabIndex = isSelected ? 0 : -1;
    });
    // Sin selección, el primero recibe el foco con Tab
    if (!trait) quadrants[0].tabIndex = 0;

    if (trait) {
        modalGrimoireBox.dataset.theme = trait;
    } else {
        delete modalGrimoireBox.dataset.theme;
    }
}

// Ratón: clic en un cuadrante
document.querySelector('.quadrants-grid').addEventListener('click', (e) => {
    const quadrant = e.target.closest('.quadrant');
    if (quadrant) selectTrait(quadrant.dataset.trait);
});

// Teclado: Espacio/Intro eligen; las flechas se mueven por la rejilla 2x2 y eligen
document.querySelector('.quadrants-grid').addEventListener('keydown', (e) => {
    const index = quadrants.indexOf(document.activeElement);
    if (index < 0) return;

    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        selectTrait(quadrants[index].dataset.trait);
        return;
    }

    const moves = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 2, ArrowUp: -2 };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const next = quadrants[(index + moves[e.key] + quadrants.length) % quadrants.length];
    selectTrait(next.dataset.trait);
    next.focus();
});

saveDeityModalBtn.addEventListener('click', () => {
    if (!selectedTraitTemp) {
        alert('Elige el Atributo de Ritual que emana de tu dios.');
        quadrants[0].focus();
        return;
    }
    if (!modalDeityName.value.trim()) {
        alert('¡Tu deidad necesita un nombre antes de ser consagrada!');
        modalDeityName.focus();
        return;
    }

    // Cambiar el atributo de ritual invalida las tiradas de RP ya hechas
    const traitChanged = cultState.ritualTrait && cultState.ritualTrait !== selectedTraitTemp;
    const rolledCultists = cultState.cultists.filter(c => c.rolled);
    if (traitChanged && rolledCultists.length > 0) {
        const ok = confirm(`Cambiar el Atributo de ${cultState.ritualTrait} a ${selectedTraitTemp} anulará las tiradas de RP de ${rolledCultists.length} cultista(s). ¿Continuar?`);
        if (!ok) return;
    }
    if (traitChanged) {
        cultState.cultists.forEach(resetRoll);
    }

    cultState.deityName = modalDeityName.value.trim();
    cultState.deityLore = modalDeityLore.value.trim();
    cultState.ritualTrait = selectedTraitTemp;

    saveState();
    updateDeityDisplay();
    renderRoster();
    deityModal.style.display = 'none';
});

// Favor invertido en un cultista: mejoras de stats, salud y equipo
function calculateCultistFavor(c) {
    const statCost = (c.str + c.dex + c.int + c.def - 4 * STAT_MIN) * STAT_COST;
    const healthCost = ((c.health - HEALTH_MIN) / HEALTH_STEP) * HEALTH_COST;
    return statCost + healthCost + equipmentCost(c.equipment);
}

// Favor pagado por una lista de equipo (los objetos encontrados cuentan 0)
function equipmentCost(list) {
    return list.reduce((sum, entry) => sum + entry.cost, 0);
}

// ¿El culto tiene ya este objeto (en algún cultista o en la reserva)?
function cultOwnsItem(id) {
    return cultState.reserve.some(e => e.id === id) ||
        cultState.cultists.some(c => c.equipment.some(e => e.id === id));
}

// Lista de equipo de un destino: el índice de un cultista o 'reserve'
function getHolder(target) {
    if (target === 'reserve') return cultState.reserve;
    const cultist = cultState.cultists[target];
    return cultist ? cultist.equipment : null;
}

// Movimiento del cultista: la montura lo cambia
function getMovement(cultist) {
    const mount = cultist.equipment.map(e => ITEM_BY_ID.get(e.id)).find(item => item.move);
    return mount
        ? { move: mount.move, run: mount.run, mounted: true }
        : { move: MOVE_INCHES, run: RUN_INCHES, mounted: false };
}

// Línea de estadísticas de un arma: tipo · alcance · daño · crítico
function weaponStatsLine(w) {
    return `${w.type} · ${w.range} · Daño ${w.damage} · CRIT ${w.crit}`;
}

// Lista de equipo agrupando unidades repetidas.
// holder es el índice del cultista o 'reserve'; cambia las acciones de cada fila.
function renderEquipmentList(list, holder) {
    const groups = new Map();
    list.forEach(entry => {
        const group = groups.get(entry.id) || { qty: 0, paid: 0 };
        group.qty += 1;
        group.paid += entry.cost;
        groups.set(entry.id, group);
    });
    if (groups.size === 0) {
        return `<p class="equip-empty">${holder === 'reserve' ? 'La reserva está vacía.' : 'Sin equipo.'}</p>`;
    }

    const isReserve = holder === 'reserve';
    const cultistOptions = cultState.cultists
        .map((c, i) => `<option value="${i}">${escapeHtml(c.name || `Cultista ${i + 1}`)}</option>`)
        .join('');

    const rows = [...groups].map(([id, { qty, paid }]) => {
        const item = ITEM_BY_ID.get(id);
        const detail = item.kind === 'weapon'
            ? weaponStatsLine(item)
            : (item.consumable ? 'Un solo uso' : 'Montura');
        const found = paid < item.cost * qty;
        const lastCost = list.filter(e => e.id === id).pop().cost;

        const actions = isReserve
            ? `
                <select class="equip-assign" data-equip-from-reserve="${id}" aria-label="Equipar ${escapeHtml(item.name)} a un cultista"${cultistOptions ? '' : ' disabled'}>
                    <option value="">Equipar a…</option>${cultistOptions}
                </select>
            `
            : `<button class="equip-stash" data-stash-item="${holder}:${id}" aria-label="Guardar ${escapeHtml(item.name)} en la reserva" title="Guardar una unidad en la reserva">↓</button>`;

        return `
            <li class="equip-item" data-kind="${item.kind}">
                <div class="equip-info">
                    <span class="equip-name">${escapeHtml(item.name)}${qty > 1 ? ` <span class="equip-qty">×${qty}</span>` : ''}</span>
                    <span class="equip-detail">${detail}${found ? ' · <span class="equip-found">encontrado</span>' : ''}</span>
                </div>
                <span class="equip-cost" title="Favor pagado">${paid}</span>
                ${actions}
                <button class="equip-remove" data-remove-item="${holder}:${id}" aria-label="Quitar ${escapeHtml(item.name)}" title="Quitar una unidad${lastCost ? ` (devuelve ${lastCost} Favor)` : ''}">×</button>
            </li>
        `;
    }).join('');
    return `<ul class="equip-list">${rows}</ul>`;
}

// Calcular el Favor gastado total: cultistas y equipo en la reserva
function calculateSpentFavor() {
    return cultState.cultists.reduce((sum, c) => sum + calculateCultistFavor(c), 0) +
        equipmentCost(cultState.reserve);
}

function getRemainingFavor() {
    const budget = clampInt(startingFavorInput.value, 0, Infinity, 0);
    return budget - calculateSpentFavor();
}

// Actualizar contadores visuales de Favor
function updateFavorDisplay() {
    const spent = calculateSpentFavor();
    const remaining = getRemainingFavor();

    spentFavorSpan.textContent = spent;
    remainingFavorSpan.textContent = remaining;
    remainingFavorSpan.classList.toggle('is-negative', remaining < 0);

    // El selector numérico no deja bajar del Favor ya gastado
    startingFavorInput.min = spent;
}

// Aviso temporal bajo el campo de presupuesto
function showFavorHint(message) {
    favorHint.textContent = message;
    favorHint.hidden = false;
    clearTimeout(favorHintTimer);
    favorHintTimer = setTimeout(() => { favorHint.hidden = true; }, 4000);
}

// Renderizar la interfaz del Roster
function renderRoster() {
    rosterContainer.innerHTML = '';
    cultistCountSpan.textContent = cultState.cultists.length;

    const remaining = getRemainingFavor();
    const canAffordStat = remaining >= STAT_COST;
    const canAffordHealth = remaining >= HEALTH_COST;

    if (cultState.deityName && cultState.ritualTrait) {
        addCultistBtn.disabled = cultState.cultists.length >= MAX_CULTISTS;
    }

    cultState.cultists.forEach((cultist, index) => {
        const card = document.createElement('div');
        card.className = 'cultist-card';

        // Renderizado de la sección de Puntos de Ritual (RP) según si ya se tiró o no
        let rpHtml = '';
        if (cultist.rolled) {
            rpHtml = `
                <div class="rp-roll-row">
                    <label>Puntos de Ritual (${cultist.diceResults.length}d10 - Máx):</label>
                    <div><span class="rp-dice-box">${cultist.diceResults.join(' & ')}</span> (RP: <strong>${cultist.rpTotal}</strong>)</div>
                </div>
            `;
        } else {
            const numDice = cultist[cultState.ritualTrait.toLowerCase()] || 1;
            rpHtml = `
                <div class="rp-roll-row">
                    <label>Canalización de RP (${numDice}d10):</label>
                    <button class="rp-roll-btn" onclick="rollCultistRp(${index})">Tirar ${numDice}d10 (${cultState.ritualTrait})</button>
                </div>
            `;
        }

        const ritualKey = cultState.ritualTrait.toLowerCase();
        const statRow = (key, label) => {
            const value = cultist[key];
            const pips = [1, 2, 3, 4, 5].map(n => `<span class="pip${n <= value ? ' filled' : ''}"></span>`).join('');
            const atMax = value >= STAT_MAX;
            const plusTitle = atMax ? 'Máximo alcanzado' : (canAffordStat ? `Cuesta ${STAT_COST} Favor` : 'Favor insuficiente');
            return `
                <div class="stat-row${key === ritualKey ? ' is-ritual' : ''}">
                    <span class="stat-name">${label}</span>
                    <div class="stat-pips">${pips}</div>
                    <div class="stat-controls">
                        <button onclick="changeStat(${index}, '${key}', -1)" aria-label="Bajar ${label}"${value <= STAT_MIN ? ' disabled' : ''}>−</button>
                        <span class="stat-value">${value}</span>
                        <button onclick="changeStat(${index}, '${key}', 1)" aria-label="Subir ${label}" title="${plusTitle}"${atMax || !canAffordStat ? ' disabled' : ''}>+</button>
                    </div>
                </div>
            `;
        };
        const movement = getMovement(cultist);
        const healthPercent = (cultist.health / HEALTH_MAX) * 100;
        const healthAtMax = cultist.health >= HEALTH_MAX;
        const healthPlusTitle = healthAtMax ? 'Máximo alcanzado' : (canAffordHealth ? `Cuesta ${HEALTH_COST} Favor` : 'Favor insuficiente');

        card.innerHTML = `
            <div class="card-header">
                <span class="card-number">Nº ${index + 1}</span>
                <label for="cultistName${index}">Apodo / Nombre</label>
                <input type="text" id="cultistName${index}" value="${escapeHtml(cultist.name)}" onchange="updateCultistName(${index}, this.value)">
            </div>

            <div class="card-meta">
                <div class="meta-box${movement.mounted ? ' is-mounted' : ''}" title="Mover ${movement.move} pulgadas, ${movement.run} al correr${movement.mounted ? ' (montado)' : ''}">
                    <span class="meta-label">${movement.mounted ? 'Montado' : 'Mov. / Correr'}</span>
                    <strong>${movement.move}″ / ${movement.run}″</strong>
                </div>
                <div class="meta-box meta-favor" title="Favor invertido en este cultista">
                    <span class="meta-label">Favor</span>
                    <strong>${calculateCultistFavor(cultist)}</strong>
                </div>
            </div>

            <div class="stat-list">
                ${statRow('str', 'STR')}
                ${statRow('dex', 'DEX')}
                ${statRow('int', 'INT')}
                ${statRow('def', 'DEF')}
            </div>

            <div class="health-row">
                <div class="health-top">
                    <span class="stat-name">Salud</span>
                    <div class="stat-controls">
                        <button onclick="changeHealth(${index}, -${HEALTH_STEP})" aria-label="Bajar Salud"${cultist.health <= HEALTH_MIN ? ' disabled' : ''}>−${HEALTH_STEP}</button>
                        <span class="stat-value">${cultist.health}</span>
                        <button onclick="changeHealth(${index}, ${HEALTH_STEP})" aria-label="Subir Salud" title="${healthPlusTitle}"${healthAtMax || !canAffordHealth ? ' disabled' : ''}>+${HEALTH_STEP}</button>
                    </div>
                </div>
                <div class="health-bar"><span style="width: ${healthPercent}%"></span></div>
            </div>

            <div class="equip-section">
                <div class="equip-head">
                    <span class="section-label">Equipo</span>
                    <button class="equip-add-btn" data-open-armory="${index}">+ Equipar</button>
                </div>
                ${renderEquipmentList(cultist.equipment, index)}
            </div>

            <div class="notes-field">
                <label for="cultistNotes${index}">Notas</label>
                <textarea id="cultistNotes${index}" rows="2" placeholder="Lesiones, cicatrices, historia..." oninput="updateCultistNotes(${index}, this.value)">${escapeHtml(cultist.notes)}</textarea>
            </div>

            ${cultState.rpMode === 'fixed' ? '' : rpHtml}

            <button class="delete-btn" onclick="removeCultist(${index})">Sacrificar / Retirar</button>
        `;
        rosterContainer.appendChild(card);
    });

    reserveList.innerHTML = renderEquipmentList(cultState.reserve, 'reserve');

    updateFavorDisplay();
    renderRpPool();
};

// Reserva de RP del culto: suma del dado más alto de cada cultista que ya ha tirado
function renderRpPool() {
    const cultists = cultState.cultists;
    const rolled = cultists.filter(c => c.rolled);
    const pending = cultists.length - rolled.length;
    const fixed = cultState.rpMode === 'fixed';

    rpFixedToggle.checked = fixed;
    rpPoolTotal.textContent = fixed ? RP_FIXED : rolled.reduce((sum, c) => sum + c.rpTotal, 0);

    let status;
    if (fixed) {
        status = `Variante del manual: cada culto empieza la partida con ${RP_FIXED} RP, sin tirar.`;
    } else if (cultists.length === 0) {
        status = 'Indoctrina cultistas para generar RP.';
    } else if (pending > 0) {
        status = `Faltan ${pending} cultista(s) por tirar.`;
    } else {
        status = 'Reserva inicial completa.';
    }
    // The Devout: +1 RP por cultista en pie al inicio de cada ronda
    if (cultState.rituals.includes('the-devout') && cultists.length > 0) {
        status += ` The Devout: +${cultists.length} RP al inicio de cada ronda.`;
    }
    rpPoolStatus.textContent = status;

    rollAllRpBtn.hidden = fixed;
    newGameBtn.hidden = fixed;
    rollAllRpBtn.disabled = pending === 0;
    newGameBtn.disabled = rolled.length === 0;
}

// Cambiar entre la tirada oficial y el RP fijo de 20
rpFixedToggle.addEventListener('change', () => {
    cultState.rpMode = rpFixedToggle.checked ? 'fixed' : 'roll';
    saveState();
    renderRoster();
});

// Regla oficial: el cultista tira tantos d10 como su Atributo de Ritual y se queda con el más alto
function rollRpFor(cultist) {
    const traitKey = cultState.ritualTrait.toLowerCase(); // 'str', 'dex', 'int' o 'def'
    const numDice = cultist[traitKey] || 1;

    const rolls = [];
    for (let i = 0; i < numDice; i++) {
        rolls.push(Math.floor(Math.random() * 10) + 1);
    }

    cultist.diceResults = rolls;
    cultist.rpTotal = Math.max(...rolls);
    cultist.rolled = true;
}

window.rollCultistRp = function(index) {
    rollRpFor(cultState.cultists[index]);
    saveState();
    renderRoster();
};

// Tirar de una vez a todos los cultistas que aún no han tirado
rollAllRpBtn.addEventListener('click', () => {
    cultState.cultists.filter(c => !c.rolled).forEach(rollRpFor);
    saveState();
    renderRoster();
});

// Los RP se generan al inicio de cada partida: una partida nueva borra las tiradas
newGameBtn.addEventListener('click', () => {
    if (!confirm('¿Empezar una nueva partida? Se borrarán las tiradas de RP actuales.')) return;
    cultState.cultists.forEach(resetRoll);
    saveState();
    renderRoster();
});

// Acciones globales
window.updateCultistName = function(index, newName) {
    cultState.cultists[index].name = newName;
    saveState();
};

// Se guarda al escribir, sin volver a pintar la tarjeta (no se pierde el foco)
window.updateCultistNotes = function(index, notes) {
    cultState.cultists[index].notes = notes;
    saveState();
};

window.changeStat = function(index, stat, delta) {
    const cultist = cultState.cultists[index];
    const newVal = cultist[stat] + delta;

    if (newVal < STAT_MIN || newVal > STAT_MAX) return;
    // Respaldo: los botones ya se desactivan sin Favor suficiente
    if (delta > 0 && getRemainingFavor() < STAT_COST) return;

    cultist[stat] = newVal;
    // Si cambia el atributo de ritual, la tirada ya no corresponde a los dados actuales
    if (stat === cultState.ritualTrait.toLowerCase() && cultist.rolled) {
        resetRoll(cultist);
    }
    saveState();
    renderRoster();
};

window.changeHealth = function(index, delta) {
    const cultist = cultState.cultists[index];
    const newVal = cultist.health + delta;

    if (newVal < HEALTH_MIN || newVal > HEALTH_MAX) return;
    if (delta > 0 && getRemainingFavor() < HEALTH_COST) return;

    cultist.health = newVal;
    saveState();
    renderRoster();
};

// El equipo del cultista retirado no se pierde: pasa a la reserva del culto
window.removeCultist = function(index) {
    const [removed] = cultState.cultists.splice(index, 1);
    if (removed && removed.equipment.length > 0) {
        cultState.reserve.push(...removed.equipment);
    }
    closeArmoryModal();
    saveState();
    renderRoster();
};

// El nombre del culto se guarda mientras se escribe, como todo lo demás
cultNameInput.addEventListener('input', saveState);

// Primer "Iniciado N" libre, para que no se repitan nombres al retirar y añadir cultistas
function nextInitiateName() {
    const used = new Set(cultState.cultists.map(c => c.name.trim()));
    let n = 1;
    while (used.has(`Iniciado ${n}`)) n++;
    return `Iniciado ${n}`;
}

// ---------- Exportar / Importar JSON ----------

const EXPORT_FORMAT = 'verrotwood-cult';
const EXPORT_VERSION = 1;

const exportJsonBtn = document.getElementById('exportJsonBtn');
const importJsonBtn = document.getElementById('importJsonBtn');
const importJsonInput = document.getElementById('importJsonInput');

// Nombre de archivo a partir del nombre del culto: "Los Hijastros" -> "los-hijastros"
function slugify(text) {
    return normalizeText(text).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'culto';
}

exportJsonBtn.addEventListener('click', () => {
    saveState();
    const data = {
        format: EXPORT_FORMAT,
        version: EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        cult: cultState
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `verrotwood-${slugify(cultState.cultName)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
});

importJsonBtn.addEventListener('click', () => importJsonInput.click());

importJsonInput.addEventListener('change', async () => {
    const file = importJsonInput.files[0];
    importJsonInput.value = ''; // permite volver a elegir el mismo archivo
    if (!file) return;

    let data;
    try {
        data = JSON.parse(await file.text());
    } catch (e) {
        alert('El archivo no es un JSON válido.');
        return;
    }

    // Acepta el formato exportado ({ format, cult }) y también el estado guardado directamente
    const raw = data && data.format === EXPORT_FORMAT ? data.cult : data;
    if (!raw || typeof raw !== 'object' || (!('cultists' in raw) && !('deityName' in raw))) {
        alert('El archivo no parece un culto de Verrotwood.');
        return;
    }

    const imported = sanitizeState(raw);
    const name = imported.cultName || 'sin nombre';
    if (!confirm(`¿Importar el culto "${name}"? Se sustituirá el culto actual.`)) return;

    applyState(imported);
    saveState();
    renderRoster();
    renderSelectedRituals();
    renderPower();
});

// Mientras se escribe solo se actualizan los contadores y los botones
startingFavorInput.addEventListener('input', () => {
    renderRoster();
});

// Al confirmar el valor, no se permite un presupuesto menor que lo ya gastado
startingFavorInput.addEventListener('change', () => {
    const spent = calculateSpentFavor();
    const value = clampInt(startingFavorInput.value, 0, Infinity, 0);
    if (value < spent) {
        startingFavorInput.value = spent;
        showFavorHint(`El presupuesto no puede ser menor que el Favor ya gastado (${spent}). Rebaja mejoras primero.`);
    } else {
        startingFavorInput.value = value;
    }
    saveState();
    renderRoster();
});

// Presupuestos del manual: 300 (campaña) y 500 (partida suelta)
document.querySelector('.favor-presets').addEventListener('click', (e) => {
    const preset = e.target.closest('[data-favor-preset]');
    if (!preset) return;
    startingFavorInput.value = preset.dataset.favorPreset;
    startingFavorInput.dispatchEvent(new Event('change'));
});

addCultistBtn.addEventListener('click', () => {
    if (cultState.deityName && cultState.ritualTrait && cultState.cultists.length < MAX_CULTISTS) {
        cultState.cultists.push({
            name: nextInitiateName(),
            notes: '',
            equipment: [],
            str: STAT_MIN,
            dex: STAT_MIN,
            int: STAT_MIN,
            def: STAT_MIN,
            health: HEALTH_MIN,
            rolled: false,
            diceResults: [],
            rpTotal: 0
        });
        saveState();
        renderRoster();
    }
});

// ---------- Campaña: Poder del dios ----------

function renderPower() {
    const { power, powerGoal } = cultState;
    const awakened = power >= powerGoal;

    powerValue.textContent = `${power} / ${powerGoal}`;
    powerBarFill.style.width = `${Math.min(100, (power / powerGoal) * 100)}%`;
    powerGoalInput.value = powerGoal;
    powerDownBtn.disabled = power <= 0;
    campaignBox.classList.toggle('is-awakened', awakened);

    powerStatus.textContent = awakened
        ? '¡Tu dios ha despertado! El culto ha ganado la campaña (si hay empate, se sigue jugando).'
        : `Faltan ${powerGoal - power} de Poder para despertar a tu dios.`;
}

function changePower(delta) {
    cultState.power = Math.max(0, cultState.power + delta);
    saveState();
    renderPower();
}

// Las recompensas de Favor suben el Favor total del culto
function gainFavor(amount) {
    startingFavorInput.value = clampInt(startingFavorInput.value, 0, Infinity, 0) + amount;
    saveState();
    renderRoster();
}

powerUpBtn.addEventListener('click', () => changePower(1));
powerDownBtn.addEventListener('click', () => changePower(-1));

powerGoalInput.addEventListener('change', () => {
    cultState.powerGoal = clampInt(powerGoalInput.value, 1, 999, POWER_GOAL_SHORT);
    saveState();
    renderPower();
});

document.querySelector('.power-presets').addEventListener('click', (e) => {
    const preset = e.target.closest('[data-power-goal]');
    if (!preset) return;
    cultState.powerGoal = Number(preset.dataset.powerGoal);
    saveState();
    renderPower();
});

// Recompensas de los encuentros del manual (Relic Hunt, Place of Power)
encounterWinBtn.addEventListener('click', () => {
    changePower(ENCOUNTER_WIN_POWER);
    gainFavor(ENCOUNTER_WIN_FAVOR);
});

encounterLossBtn.addEventListener('click', () => gainFavor(ENCOUNTER_LOSS_FAVOR));

// ---------- Rituales ----------

function getRitualCategory(ritual) {
    return RITUAL_CATEGORIES.find(c => ritual.cost >= c.min && ritual.cost <= c.max);
}

// Efecto con formato: **negrita** y *cursiva*, escapando antes el resto
function formatEffect(text) {
    return escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

// Texto en minúsculas y sin tildes, para buscar
function normalizeText(text) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function ritualCostLabel(ritual) {
    return ritual.cost === 0 ? 'Pasivo' : `${ritual.cost} RP`;
}

// Las 4 ranuras del panel del culto
function renderSelectedRituals() {
    const selected = cultState.rituals.map(id => RITUAL_BY_ID.get(id));
    const missing = MAX_RITUALS - selected.length;

    ritualStatus.textContent = missing > 0
        ? `${selected.length}/${MAX_RITUALS} elegidos · faltan ${missing}`
        : `${MAX_RITUALS}/${MAX_RITUALS} elegidos · culto completo`;
    ritualStatus.classList.toggle('is-complete', missing === 0);

    let html = selected.map(r => `
        <li class="ritual-slot is-filled" data-category="${getRitualCategory(r).id}">
            <div class="ritual-slot-head">
                <span class="ritual-slot-name">${escapeHtml(r.name)}</span>
                <span class="ritual-cost">${ritualCostLabel(r)}</span>
                <button class="ritual-remove-btn" data-remove-ritual="${r.id}" aria-label="Quitar ${escapeHtml(r.name)}" title="Quitar ritual">×</button>
            </div>
            <p class="ritual-slot-effect">${formatEffect(r.effect)}</p>
        </li>
    `).join('');
    for (let i = 0; i < missing; i++) {
        html += `<li class="ritual-slot is-empty"><button class="ritual-empty-btn" data-open-grimoire>+ Ranura vacía</button></li>`;
    }
    selectedRitualsList.innerHTML = html;
}

// Chips de filtro por coste
function renderRitualFilters() {
    const options = [{ id: 'all', label: 'Todos', range: `${RITUALS.length}` }, ...RITUAL_CATEGORIES];
    ritualFilters.innerHTML = options.map(o => `
        <button class="ritual-filter${o.id === ritualFilter ? ' is-active' : ''}" data-filter="${o.id}" aria-pressed="${o.id === ritualFilter}">
            ${o.label} <span>${o.range}</span>
        </button>
    `).join('');
}

// Catálogo agrupado por categoría, con el efecto desplegable
function renderRitualCatalog() {
    const query = normalizeText(ritualQuery.trim());
    const isFull = cultState.rituals.length >= MAX_RITUALS;

    const groups = RITUAL_CATEGORIES
        .filter(c => ritualFilter === 'all' || c.id === ritualFilter)
        .map(category => {
            const items = RITUALS.filter(r => getRitualCategory(r) === category &&
                (!query || normalizeText(`${r.name} ${r.effect}`).includes(query)));
            if (items.length === 0) return '';

            const rows = items.map(r => {
                const isSelected = cultState.rituals.includes(r.id);
                const disabled = !isSelected && isFull;
                return `
                    <li class="ritual-item${isSelected ? ' is-selected' : ''}">
                        <details>
                            <summary>
                                <span class="ritual-name">${escapeHtml(r.name)}</span>
                                <span class="ritual-cost">${ritualCostLabel(r)}</span>
                            </summary>
                            <p class="ritual-effect">${formatEffect(r.effect)}</p>
                        </details>
                        <button class="ritual-toggle" data-toggle-ritual="${r.id}"${disabled ? ' disabled title="Ya tienes 4 rituales"' : ''}>
                            ${isSelected ? 'Quitar' : 'Elegir'}
                        </button>
                    </li>
                `;
            }).join('');

            return `
                <section class="ritual-group" data-category="${category.id}">
                    <header class="ritual-group-header">
                        <h3>${category.label} <span>${category.range}</span></h3>
                        <p>${category.desc}</p>
                    </header>
                    <ul class="ritual-list">${rows}</ul>
                </section>
            `;
        }).join('');

    ritualCatalog.innerHTML = groups || '<p class="ritual-empty">Ningún ritual coincide con la búsqueda.</p>';

    const count = cultState.rituals.length;
    ritualModalCount.textContent = `${count}/${MAX_RITUALS} elegidos`;
    ritualModalCount.classList.toggle('is-complete', count === MAX_RITUALS);
}

function toggleRitual(id) {
    const index = cultState.rituals.indexOf(id);
    if (index >= 0) {
        cultState.rituals.splice(index, 1);
    } else if (cultState.rituals.length < MAX_RITUALS && RITUAL_BY_ID.has(id)) {
        cultState.rituals.push(id);
    } else {
        return;
    }
    saveState();
    renderSelectedRituals();
    renderRpPool();
    if (ritualModal.style.display === 'flex') {
        // Conservar los rituales desplegados al volver a pintar
        const openIds = [...ritualCatalog.querySelectorAll('details[open] + [data-toggle-ritual]')].map(b => b.dataset.toggleRitual);
        renderRitualCatalog();
        openIds.forEach(openId => {
            ritualCatalog.querySelector(`[data-toggle-ritual="${openId}"]`)?.previousElementSibling.setAttribute('open', '');
        });
    }
}

function openRitualModal() {
    renderRitualFilters();
    renderRitualCatalog();
    ritualModal.style.display = 'flex';
    ritualSearch.focus();
}

function closeRitualModal() {
    ritualModal.style.display = 'none';
}

openRitualModalBtn.addEventListener('click', openRitualModal);
closeRitualModalBtn.addEventListener('click', closeRitualModal);

selectedRitualsList.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('[data-remove-ritual]');
    if (removeBtn) toggleRitual(removeBtn.dataset.removeRitual);
    if (e.target.closest('[data-open-grimoire]')) openRitualModal();
});

ritualCatalog.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('[data-toggle-ritual]');
    if (toggleBtn) toggleRitual(toggleBtn.dataset.toggleRitual);
});

ritualFilters.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-filter]');
    if (!chip) return;
    ritualFilter = chip.dataset.filter;
    renderRitualFilters();
    renderRitualCatalog();
});

ritualSearch.addEventListener('input', () => {
    ritualQuery = ritualSearch.value;
    renderRitualCatalog();
});

// ---------- Armería (equipo de un cultista) ----------

const armoryModal = document.getElementById('armoryModal');
const armoryTitle = document.getElementById('armoryTitle');
const armoryFavor = document.getElementById('armoryFavor');
const armoryCatalog = document.getElementById('armoryCatalog');
const closeArmoryModalBtn = document.getElementById('closeArmoryModalBtn');

const armoryFoundToggle = document.getElementById('armoryFoundToggle');

// Destino de la armería: índice de un cultista o 'reserve'
let armoryTarget = null;

// Por qué no se puede añadir un objeto (o null si se puede)
function itemBlockReason(item, found) {
    if (item.unique && cultOwnsItem(item.id)) return 'El culto ya tiene una';
    if (!found && getRemainingFavor() < item.cost) return 'Favor insuficiente';
    return null;
}

function armoryRow(item, owned) {
    const found = armoryFoundToggle.checked;
    const reason = itemBlockReason(item, found);
    const isWeapon = item.kind === 'weapon';
    const stats = isWeapon
        ? `
            <span class="armory-stat"><em>Tipo</em> ${WEAPON_TYPES[item.type]}</span>
            <span class="armory-stat"><em>Alcance</em> ${item.range}</span>
            <span class="armory-stat"><em>Daño</em> ${item.damage}</span>
            <span class="armory-stat"><em>CRIT</em> ${item.crit}</span>
        `
        : '';
    const body = isWeapon
        ? `<div class="armory-stats">${stats}</div>`
        : `<details><summary>Ver efecto</summary><p class="armory-effect">${formatEffect(item.effect)}</p></details>`;

    return `
        <li class="armory-item" data-kind="${item.kind}">
            <div class="armory-main">
                <div class="armory-title">
                    <span class="armory-name">${escapeHtml(item.name)}</span>
                    ${owned ? `<span class="armory-owned">${armoryTarget === 'reserve' ? 'En reserva' : 'Lleva'} ${owned}</span>` : ''}
                </div>
                ${body}
            </div>
            <button class="armory-buy${found ? ' is-found' : ''}" data-add-item="${item.id}"${reason ? ` disabled title="${reason}"` : ''}>
                ${found ? 'Añadir gratis' : (item.cost === 0 ? 'Gratis' : `${item.cost} Favor`)}
            </button>
        </li>
    `;
}

function renderArmory() {
    const holder = getHolder(armoryTarget);
    if (!holder) return closeArmoryModal();

    const cultist = cultState.cultists[armoryTarget];
    armoryTitle.textContent = armoryTarget === 'reserve'
        ? 'Armería · Reserva del culto'
        : `Armería · ${cultist.name || `Cultista ${armoryTarget + 1}`}`;
    const remaining = getRemainingFavor();
    armoryFavor.textContent = `${remaining} Favor disponible`;
    armoryFavor.classList.toggle('is-negative', remaining < 0);

    const owned = id => holder.filter(e => e.id === id).length;
    armoryCatalog.innerHTML = `
        <section class="armory-group">
            <h3>Armas</h3>
            <ul class="armory-list">${WEAPONS.map(w => armoryRow(ITEM_BY_ID.get(w.id), owned(w.id))).join('')}</ul>
        </section>
        <section class="armory-group">
            <h3>Objetos y monturas</h3>
            <ul class="armory-list">${GEAR.map(g => armoryRow(ITEM_BY_ID.get(g.id), owned(g.id))).join('')}</ul>
        </section>
    `;
}

function openArmoryModal(target) {
    armoryTarget = target;
    armoryFoundToggle.checked = false;
    renderArmory();
    armoryModal.style.display = 'flex';
    closeArmoryModalBtn.focus();
}

function closeArmoryModal() {
    armoryModal.style.display = 'none';
    armoryTarget = null;
}

// "1:mount" -> 1, "reserve:mount" -> 'reserve'
function parseHolderKey(key) {
    const [holder, id] = key.split(':');
    return { target: holder === 'reserve' ? 'reserve' : Number(holder), id };
}

// Añadir un objeto comprado (o encontrado, sin coste) a un cultista o a la reserva
function addItem(target, id) {
    const holder = getHolder(target);
    const item = ITEM_BY_ID.get(id);
    const found = armoryFoundToggle.checked;
    if (!holder || !item || itemBlockReason(item, found)) return;
    holder.push({ id, cost: found ? 0 : item.cost });
    saveState();
    renderRoster();
    if (armoryTarget !== null) renderArmory();
}

// Quitar una unidad (la última añadida) y devolver lo que costó
function removeItem(target, id) {
    const holder = getHolder(target);
    const pos = holder ? holder.map(e => e.id).lastIndexOf(id) : -1;
    if (pos < 0) return;
    holder.splice(pos, 1);
    saveState();
    renderRoster();
}

// Mover una unidad entre un cultista y la reserva (el Favor pagado no cambia)
function moveItem(from, to, id) {
    const source = getHolder(from);
    const dest = getHolder(to);
    const pos = source ? source.map(e => e.id).lastIndexOf(id) : -1;
    if (pos < 0 || !dest) return;
    dest.push(...source.splice(pos, 1));
    saveState();
    renderRoster();
}

rosterSection.addEventListener('click', (e) => {
    const openBtn = e.target.closest('[data-open-armory]');
    if (openBtn) {
        const target = openBtn.dataset.openArmory;
        openArmoryModal(target === 'reserve' ? 'reserve' : Number(target));
    }

    const removeBtn = e.target.closest('[data-remove-item]');
    if (removeBtn) {
        const { target, id } = parseHolderKey(removeBtn.dataset.removeItem);
        removeItem(target, id);
    }

    const stashBtn = e.target.closest('[data-stash-item]');
    if (stashBtn) {
        const { target, id } = parseHolderKey(stashBtn.dataset.stashItem);
        moveItem(target, 'reserve', id);
    }
});

// Equipar desde la reserva eligiendo el cultista en el desplegable
rosterSection.addEventListener('change', (e) => {
    const select = e.target.closest('[data-equip-from-reserve]');
    if (select && select.value !== '') {
        moveItem('reserve', Number(select.value), select.dataset.equipFromReserve);
    }
});

armoryCatalog.addEventListener('click', (e) => {
    const buyBtn = e.target.closest('[data-add-item]');
    if (buyBtn) addItem(armoryTarget, buyBtn.dataset.addItem);
});

armoryFoundToggle.addEventListener('change', renderArmory);

closeArmoryModalBtn.addEventListener('click', closeArmoryModal);

// Cerrar modales con Escape o pulsando fuera de la caja
[deityModal, ritualModal].forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.style.display = 'none';
    });
});

armoryModal.addEventListener('click', (e) => {
    if (e.target === armoryModal) closeArmoryModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    [deityModal, ritualModal].forEach(overlay => { overlay.style.display = 'none'; });
    closeArmoryModal();
});

// ---------- Hoja de culto imprimible ----------
// Basada en la hoja oficial del manual (última página): apaisada, culto y rituales
// a la izquierda y 4 cajas de cultista a la derecha. Cabe en A4 y en Letter.

const printSheet = document.getElementById('printSheet');
const printSheetBtn = document.getElementById('printSheetBtn');

const TRAIT_NAMES = { STR: 'Fuerza', DEX: 'Destreza', INT: 'Inteligencia', DEF: 'Defensa' };

// Líneas en blanco para escribir a mano
function blankLines(count) {
    return `<div class="ps-lines">${'<span></span>'.repeat(count)}</div>`;
}

// Equipo agrupado para la hoja: nombre ×N y su resumen de una línea
function printEquipment(list) {
    const groups = new Map();
    list.forEach(e => groups.set(e.id, (groups.get(e.id) || 0) + 1));
    return [...groups].map(([id, qty]) => {
        const item = ITEM_BY_ID.get(id);
        const detail = item.kind === 'weapon' ? weaponStatsLine(item) : item.short;
        return `<li><strong>${escapeHtml(item.name)}${qty > 1 ? ` ×${qty}` : ''}</strong> <span>${detail}</span></li>`;
    }).join('');
}

function printCultist(cultist, index) {
    if (!cultist) {
        // Caja vacía, como en la hoja oficial, para rellenar a mano
        return `
            <section class="ps-cultist is-blank">
                <header class="ps-cultist-head"><span class="ps-label">Nombre</span><span class="ps-num">Nº ${index + 1}</span></header>
                <div class="ps-stats">
                    ${['STR', 'DEX', 'INT', 'DEF'].map(k => `<div class="ps-stat"><span class="ps-circle"></span><span class="ps-stat-name">${k}</span></div>`).join('')}
                    <div class="ps-stat"><span class="ps-health"></span><span class="ps-stat-name">Salud</span></div>
                </div>
                ${blankLines(5)}
            </section>
        `;
    }

    const ritualKey = cultState.ritualTrait.toLowerCase();
    const movement = getMovement(cultist);
    const stats = ['str', 'dex', 'int', 'def'].map(k => `
        <div class="ps-stat${k === ritualKey ? ' is-ritual' : ''}">
            <span class="ps-circle">${cultist[k]}</span>
            <span class="ps-stat-name">${k.toUpperCase()}</span>
        </div>
    `).join('');
    const equipment = printEquipment(cultist.equipment);

    return `
        <section class="ps-cultist">
            <header class="ps-cultist-head">
                <span class="ps-label">Nombre</span>
                <strong class="ps-name">${escapeHtml(cultist.name) || '&nbsp;'}</strong>
                <span class="ps-num">Nº ${index + 1}</span>
            </header>
            <div class="ps-stats">
                ${stats}
                <div class="ps-stat">
                    <span class="ps-health">${cultist.health}</span>
                    <span class="ps-stat-name">Salud</span>
                </div>
            </div>
            <p class="ps-meta">
                ${movement.mounted ? 'Montado · ' : ''}Mover ${movement.move}″ · Correr ${movement.run}″ · Favor ${calculateCultistFavor(cultist)}
            </p>
            ${equipment ? `<ul class="ps-equip">${equipment}</ul>` : ''}
            ${cultist.notes.trim() ? `<p class="ps-notes">${escapeHtml(cultist.notes)}</p>` : ''}
            ${blankLines(2)}
        </section>
    `;
}

function renderPrintSheet() {
    saveState();
    const s = cultState;
    const spent = calculateSpentFavor();
    const total = clampInt(startingFavorInput.value, 0, Infinity, 0);

    // RP de la partida: fijo, la suma ya tirada o una casilla en blanco para la tirada
    const allRolled = s.cultists.length > 0 && s.cultists.every(c => c.rolled);
    let rpValue = '';
    if (s.rpMode === 'fixed') rpValue = RP_FIXED;
    else if (allRolled) rpValue = s.cultists.reduce((sum, c) => sum + c.rpTotal, 0);
    const rpHint = s.rpMode === 'fixed'
        ? 'Variante de RP fijo'
        : `Cada cultista tira tantos d10 como su ${s.ritualTrait || 'atributo'} y suma el más alto`;

    const rituals = s.rituals.map(id => RITUAL_BY_ID.get(id));
    const ritualItems = Array.from({ length: MAX_RITUALS }, (_, i) => {
        const r = rituals[i];
        if (!r) return `<li class="ps-ritual is-blank">${blankLines(2)}</li>`;
        return `
            <li class="ps-ritual">
                <div class="ps-ritual-head"><strong>${escapeHtml(r.name)}</strong><span>${ritualCostLabel(r)}</span></div>
                <p>${formatEffect(r.effect)}</p>
            </li>
        `;
    }).join('');

    const reserve = printEquipment(s.reserve);

    printSheet.innerHTML = `
        <div class="ps-left">
            <header class="ps-header">
                <span class="ps-brand">Verrotwood · Hoja de culto · Herramienta no oficial</span>
                <span class="ps-label">Culto</span>
                <h1>${escapeHtml(s.cultName) || '&nbsp;'}</h1>
                <div class="ps-deity">
                    <span class="ps-label">Deidad</span>
                    <strong>${escapeHtml(s.deityName) || '&nbsp;'}</strong>
                    ${s.deityLore ? `<em>${escapeHtml(s.deityLore)}</em>` : ''}
                </div>
                <div class="ps-kv">
                    <div><span class="ps-label">Atributo de Ritual</span><strong>${s.ritualTrait ? `${s.ritualTrait} · ${TRAIT_NAMES[s.ritualTrait]}` : '—'}</strong></div>
                    <div><span class="ps-label">Favor</span><strong>${total}</strong><small>gastado ${spent} · restante ${total - spent}</small></div>
                    <div><span class="ps-label">Poder</span><strong>${s.power} / ${s.powerGoal}</strong></div>
                </div>
            </header>

            <section class="ps-block">
                <h2>Rituales</h2>
                <ol class="ps-rituals">${ritualItems}</ol>
                <div class="ps-rp">
                    <span class="ps-box">${rpValue}</span>
                    <div><strong>Puntos de Ritual</strong><small>${rpHint}</small></div>
                </div>
            </section>

            ${reserve ? `<section class="ps-block"><h2>Reserva</h2><ul class="ps-equip">${reserve}</ul></section>` : ''}

            <section class="ps-block ps-notes-block">
                <h2>Notas</h2>
                ${blankLines(reserve ? 2 : 4)}
            </section>
        </div>

        <div class="ps-right">
            ${Array.from({ length: MAX_CULTISTS }, (_, i) => printCultist(s.cultists[i], i)).join('')}
        </div>
    `;
}

printSheetBtn.addEventListener('click', () => {
    renderPrintSheet();
    window.print();
});

// También con Ctrl+P o el menú del navegador
window.addEventListener('beforeprint', renderPrintSheet);

// Inicialización
loadState();
renderRoster();
renderSelectedRituals();
renderPower();

// Activar la transición de paleta solo después del primer pintado
requestAnimationFrame(() => {
    requestAnimationFrame(() => document.body.classList.add('theme-animate'));
});

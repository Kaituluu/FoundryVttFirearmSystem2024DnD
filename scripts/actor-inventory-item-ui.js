// =====================================================
// FireArmSystem — Actor Inventory & Actions UI (V13)
// - Detects firearms via dnd5e weapon property "fir"
// - Reads firearm data from flags.firearmsystem
// - Renders status pills using shared CSS
// =====================================================

const FIREARM_FLAG = "firearmsystem";
const FIREARM_PROPERTY = "fir";

/* -------------------------------------------- */
/* Helpers                                      */
/* -------------------------------------------- */

function isFirearm(item) {
  if (!item || item.type !== "weapon") return false;

  const props = item.system?.properties;
  return props instanceof Set && props.has(FIREARM_PROPERTY);
}

function getFirearmData(item) {
  if (!isFirearm(item)) return null;

  const fs = item.flags?.[FIREARM_FLAG];
  if (!fs || !fs.capacity) return null;

  return {
    current: fs.capacity.current,
    max: fs.capacity.max,
    misfire: fs.misfire
  };
}

/* -------------------------------------------- */
/* UI Injection                                 */
/* -------------------------------------------- */

function injectFirearmStatus(row, data) {
  // Prevent duplicates on rerender
  if (row.querySelector(".firearm-status")) return;

  // Anchor near item name (works for inventory + actions)
  const anchor =
    row.querySelector(".item-name") ||
    row.querySelector(".name") ||
    row.querySelector(".item-title") ||
    row;

  const status = document.createElement("div");
  status.classList.add("firearm-status", "firearm-status--actor");

  const ammoClass = data.current === 0 ? "empty" : "";

  status.innerHTML = `
    <span class="firearm-pill ammo ${ammoClass}">
      Ammo: ${data.current}/${data.max}
    </span>
    <span class="firearm-pill misfire">
      Misfire: ${data.misfire}
    </span>
  `;

  anchor.appendChild(status);
}

/* -------------------------------------------- */
/* Main Render                                  */
/* -------------------------------------------- */

function renderActorFirearms(app) {
  const actor = app.actor;
  const root = app.element;

  if (!actor || !root) return;

  // Inventory + Actions rows that actually map to items
  const rows = root.querySelectorAll("[data-item-id]");

  for (const row of rows) {
    const itemId = row.dataset?.itemId;
    if (!itemId) continue;

    const item = actor.items.get(itemId);
    if (!item) continue;

    const firearmData = getFirearmData(item);
    if (!firearmData) continue;

    injectFirearmStatus(row, firearmData);
  }
}

/* -------------------------------------------- */
/* Hooks                                        */
/* -------------------------------------------- */

// Actor sheets (PCs + NPCs) — ApplicationV2
Hooks.on("renderActorSheetV2", (app) => {
  renderActorFirearms(app);
});

// Re-render when firearm data changes (ammo, misfire, reload, etc.)
Hooks.on("updateItem", (item, changes) => {
  const actor = item?.parent;
  if (!actor) return;

  if (!changes?.flags?.[FIREARM_FLAG]) return;

  for (const sheet of Object.values(actor.apps ?? {})) {
    if (sheet.rendered) sheet.render(true);
  }
});

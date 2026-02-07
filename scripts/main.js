// =============================================
// FirearmSystem2024 — Main Entry Point
// Foundry VTT v13 / dnd5e
// =============================================

Hooks.once("init", () => {
  console.log("FirearmSystem2024 | Init");
});


function syncFirearmPanelEditState(app, html) {
  const panel = html.querySelector(".firearm-system-panel");
  if (!panel) return;

  panel.querySelectorAll("input").forEach(input => {
    input.disabled = !app.isEditable;
  });
}
Hooks.on("activateItemSheet5eListeners", (app, html) => {
  syncFirearmPanelEditState(app, html);
});
// =============================================
// Firearm data initializer
// =============================================

function ensureFirearmData(item) {
  if (item.type !== "weapon") return;

  const isFirearm = item.system.properties?.has("fir");
  if (!isFirearm) return;

  const fs = foundry.utils.duplicate(item.flags.firearmsystem ?? {});
  let changed = false;

  if (fs.misfire === undefined) {
    fs.misfire = 1;
    changed = true;
  }

  if (!fs.capacity) {
    fs.capacity = { max: 1, current: 1 };
    changed = true;
  } else {
    if (fs.capacity.max === undefined) {
      fs.capacity.max = 1;
      changed = true;
    }
    if (fs.capacity.current === undefined) {
      fs.capacity.current = fs.capacity.max;
      changed = true;
    }
  }

  if (changed) {
    return item.update({ "flags.firearmsystem": fs });
  }
}

// ---------------------------------------------
// Re-render when weapon properties change
// ---------------------------------------------

Hooks.on("updateItem", (item, changes) => {
  if (item.type !== "weapon") return;
  if (!changes?.system?.properties) return;

  if (item.sheet?.rendered) {
    item.sheet.render(true);
  }
});

// ============================================================
// FirearmSystem2024 — Item Sheet Extension (dnd5e v13)
// Injects:
// - Firearm pills in Description tab
// - Firearm System panel in Details tab
// ============================================================

// ============================================================
// FirearmSystem2024 — Item Sheet Extension (FINAL, v13-safe)
// ============================================================

Hooks.on("renderItemSheet5e", (app, html) => {
  const item = app.item;

  // ----------------------------------------------------------
  // Guards
  // ----------------------------------------------------------

  if (item.type !== "weapon") return;

  const isFirearm = item.system.properties?.has("fir");

  if (isFirearm) {
    ensureFirearmData(item);
  }

  const fs = item.flags.firearmsystem;

  // ----------------------------------------------------------
  // Helper — Sync lock state with dnd5e edit toggle
  // ----------------------------------------------------------

  function syncFirearmPanelLockState() {
    const form = html.closest("form");
    if (!form) return;

    const locked =
      form.classList.contains("locked") ||
      !form.classList.contains("editable");

    html
      .querySelectorAll(".firearm-system-panel input")
      .forEach(input => {
        input.disabled = locked;
      });
  }

  // ----------------------------------------------------------
  // DESCRIPTION TAB — Native-style pills
  // ----------------------------------------------------------

  const descriptionTab = html.querySelector(
    'section[data-tab="description"]'
  );

  if (descriptionTab) {
    descriptionTab
      .querySelectorAll(".firearm-pill-bar")
      .forEach(e => e.remove());

    if (isFirearm && fs) {
      descriptionTab.insertAdjacentHTML(
        "beforeend",
        `
        <div class="pills">
          <span class="pill transparent">Firearm</span>
          <span class="pill transparent">Misfire: ${fs.misfire}</span>
          <span class="pill transparent">
            Ammo: ${fs.capacity.current}/${fs.capacity.max}
          </span>
        </div>
        `
      );
    }
  }

  // ----------------------------------------------------------
  // DETAILS TAB — Firearm System Panel
  // ----------------------------------------------------------

  const detailsTab = html.querySelector(
    'section[data-tab="details"]'
  );

  if (!detailsTab) return;

  detailsTab
    .querySelectorAll(".firearm-system-panel")
    .forEach(e => e.remove());

  if (!isFirearm || !fs) return;

  const panel = document.createElement("fieldset");
  panel.classList.add("firearm-system-panel");

  panel.innerHTML = `
    <legend>Firearm System</legend>

    <div class="form-group">
      <label>Misfire</label>
      <input type="number"
        name="firearmsystem.misfire"
        value="${fs.misfire}"
        min="0"
        step="1"
      />
    </div>

    <div class="form-group">
      <label>Capacity (Max)</label>
      <input type="number"
        name="firearmsystem.capacity.max"
        value="${fs.capacity.max}"
        min="1"
        step="1"
      />
    </div>

    <div class="form-group">
      <label>Capacity (Current)</label>
      <input type="number"
        name="firearmsystem.capacity.current"
        value="${fs.capacity.current}"
        min="0"
        step="1"
      />
    </div>
  `;

  detailsTab.appendChild(panel);

  // ----------------------------------------------------------
  // Persist changes
  // ----------------------------------------------------------

  panel.querySelectorAll("input").forEach(input => {
    input.addEventListener("change", event => {
      const path = event.target.name;
      const value = Number(event.target.value);

      item.update({
        [`flags.${path}`]: value
      });
    });
  });

  // ----------------------------------------------------------
  // Initial lock sync
  // ----------------------------------------------------------

  syncFirearmPanelLockState();

  // ----------------------------------------------------------
  // Listen for ✏️ / ✖ edit toggle (DOM-based, v13 reality)
  // ----------------------------------------------------------

  const header = html.closest(".app")?.querySelector(".window-header");
  if (header) {
    header.addEventListener("click", () => {
      // Let dnd5e toggle classes first
      setTimeout(syncFirearmPanelLockState, 0);
    });
  }
});

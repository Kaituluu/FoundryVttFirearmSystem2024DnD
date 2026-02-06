// ================================
// FirearmSystem – Actor Inventory UI
// ================================

Hooks.on("renderActorSheet", (app, html, data) => {
  const actor = app.actor;
  if (!actor) return;

  // Find inventory items
  const itemElements = html.find(".item[data-item-id]");
  if (!itemElements.length) return;

  for (const li of itemElements) {
    const itemId = li.dataset.itemId;
    const item = actor.items.get(itemId);
    if (!item) continue;

    const fs = item.flags?.firearmsystem;
    if (!fs?.isFirearm) continue;

    const current = fs.capacity?.current;
    const max = fs.capacity?.max;
    const misfire = fs.misfire;

    if (current == null || max == null || misfire == null) continue;

    injectFirearmPills(li, current, max, misfire);
  }
});
// ================================
// UI Injection
// ================================

function injectFirearmPills(li, current, max, misfire) {
  // Prevent duplicates on re-render
  if (li.querySelector(".firearm-status")) return;

  const status = document.createElement("div");
  status.classList.add("firearm-status");

  status.innerHTML = `
    <span class="firearm-pill">
      Ammo: <strong>${current}</strong> / ${max}
    </span>
    <span class="firearm-pill">
      Misfire: <strong>${misfire}</strong>
    </span>
  `;

  // Insert after item name
  const name = li.querySelector(".item-name");
  if (name) {
    name.appendChild(status);
  }
}

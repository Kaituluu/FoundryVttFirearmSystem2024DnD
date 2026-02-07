// =====================================================
// FireArmSystem — Chat Integration (v13 Activities)
// Inject firearm pills into card-footer under DAMAGE
// =====================================================

(() => {
  if (globalThis.FireArmSystemChat) return;
  globalThis.FireArmSystemChat = true;

  const FIREARM_FLAG = "firearmsystem";
  const FIREARM_PROPERTY = "fir";

  function isFirearm(item) {
    if (!item || item.type !== "weapon") return false;
    const props = item.system?.properties;
    return props instanceof Set && props.has(FIREARM_PROPERTY);
  }

  function getFirearmData(item) {
    if (!isFirearm(item)) return null;
    const fs = item.flags?.[FIREARM_FLAG];
    if (!fs?.capacity) return null;

    return {
      current: fs.capacity.current,
      max: fs.capacity.max,
      misfire: fs.misfire
    };
  }

  Hooks.on("renderChatMessageHTML", async (message, html) => {
    const dnd5e = message.flags?.dnd5e;
    if (!dnd5e?.item?.uuid) return;

    const item = await fromUuid(dnd5e.item.uuid);
    if (!item) return;

    const firearmData = getFirearmData(item);
    if (!firearmData) return;

    // Find the pill footer (THIS is the correct anchor)
    const footer = html.querySelector("ul.card-footer.pills");
    if (!footer) return;

    // Prevent duplicates
    if (footer.querySelector(".firearm-chat-pill")) return;

    // Ammo pill
    const ammoLi = document.createElement("li");
    ammoLi.className = "pill transparent firearm-chat-pill";
    ammoLi.innerHTML = `<span class="label">Ammo: ${firearmData.current}/${firearmData.max}</span>`;

    // Misfire pill
    const misfireLi = document.createElement("li");
    misfireLi.className = "pill transparent firearm-chat-pill";
    misfireLi.innerHTML = `<span class="label">Misfire: ${firearmData.misfire}</span>`;

    footer.appendChild(ammoLi);
    footer.appendChild(misfireLi);
  });

})();

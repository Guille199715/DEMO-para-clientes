(() => {
  "use strict";

  const defaults = () => ({ ownerName: "", businessName: "", businessDescription: "", mode: "showcase", whatsappEnabled: false, phonePrefix: "549", phone: "", products: [], design: "editorial", currency: "ARS", logo: "", logoShape: "original", brandColor: "" });
  let state = defaults();
  let step = 0;
  let uploading = false;
  let logoUploading = false;
  let draftReady = false;
  let draftTimer;
  let draftRevision = 0;
  let saveQueue = Promise.resolve();
  let previewTimer;
  let previewHtml = "";
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const captions = ["Tu negocio", "Tu página", "Tus productos", "Tu diseño"];
  const designNames = { editorial: "Editorial", nocturna: "Nocturna", galeria: "Galería" };
  const designColors = { editorial: "#225d4a", nocturna: "#00dac3", galeria: "#96334e" };
  const form = $("#demoForm");
  const iframe = $("#sitePreview");

  function paintIcons(root = document) {
    root.querySelectorAll("[data-icon]").forEach((element) => {
      element.outerHTML = DemoSite.icon(element.dataset.icon);
    });
  }

  function draftStatus(message, failed = false) {
    $("#draftStatus").textContent = message;
    $(".editor-footer").classList.toggle("save-failed", failed);
  }

  function persistDraft() {
    clearTimeout(draftTimer);
    draftTimer = undefined;
    if (!draftReady) return;
    const revision = draftRevision;
    const snapshot = structuredClone(state);
    const savedStep = step;
    saveQueue = saveQueue.catch(() => {}).then(() => DemoDraft.save(snapshot, savedStep)).then(() => {
      if (revision === draftRevision) draftStatus("Borrador guardado");
    }).catch(() => {
      if (revision === draftRevision) draftStatus("Borrador no guardado", true);
    });
  }

  function scheduleDraft() {
    if (!draftReady) return;
    draftRevision++;
    clearTimeout(draftTimer);
    draftStatus("Guardando borrador…");
    draftTimer = setTimeout(persistDraft, 500);
  }

  function normalizedDraft(record) {
    if (record?.schema !== 1 || !record.config || typeof record.config !== "object") return null;
    const source = record.config;
    const result = defaults();
    const text = (value, limit) => typeof value === "string" ? value.slice(0, limit) : "";
    const image = (value) => typeof value === "string" && value.length < 4000000 && /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/]+={0,2}$/.test(value) ? value : "";
    result.ownerName = text(source.ownerName, 60);
    result.businessName = text(source.businessName, 80);
    result.businessDescription = text(source.businessDescription, 240);
    result.phone = text(source.phone, 24);
    if (["549", "598", "56", "34", "1", ""].includes(source.phonePrefix)) result.phonePrefix = source.phonePrefix;
    result.whatsappEnabled = source.whatsappEnabled === true;
    if (["showcase", "catalog"].includes(source.mode)) result.mode = source.mode;
    if (Object.hasOwn(designNames, source.design)) result.design = source.design;
    if (["ARS", "USD", "UYU", "CLP", "EUR"].includes(source.currency)) result.currency = source.currency;
    if (/^#[a-fA-F0-9]{6}$/.test(source.brandColor || "")) result.brandColor = source.brandColor.toLowerCase();
    result.logo = image(source.logo);
    if (["original", "circle", "square"].includes(source.logoShape)) result.logoShape = source.logoShape;
    const products = Array.isArray(source.products) ? source.products.slice(0, 5) : [];
    const ids = new Set();
    result.products = products.flatMap((product) => {
      if (!product || typeof product !== "object") return [];
      const photo = image(product.image);
      if (!photo) return [];
      let id = typeof product.id === "string" && /^[a-zA-Z0-9-]{1,64}$/.test(product.id) ? product.id : crypto.randomUUID();
      if (ids.has(id)) id = crypto.randomUUID();
      ids.add(id);
      const price = product.price !== "" && product.price !== null && product.price !== undefined && Number.isFinite(Number(product.price)) && Number(product.price) >= 0 && Number(product.price) <= 999999999 ? String(product.price) : "";
      return [{ id, image: photo, name: text(product.name, 80), description: text(product.description, 280), price }];
    });
    return { config: result, step: Number.isInteger(record.step) ? Math.max(0, Math.min(3, record.step)) : 0 };
  }

  function updateBusyControls() {
    const busy = uploading || logoUploading;
    $("#nextStep").disabled = busy;
    $("#resetButton").disabled = busy || !draftReady;
    ["addLogo", "logoInput", "removeLogo"].forEach((id) => { $(`#${id}`).disabled = busy; });
    $("#addPhotos").disabled = busy || state.products.length >= 5;
    $("#photoInput").disabled = busy || state.products.length >= 5;
  }

  function refreshBrand() {
    $("#logoThumbnail").hidden = !state.logo;
    $("#logoShapeSetting").hidden = !state.logo;
    $("#logoThumbnail").dataset.shape = state.logoShape;
    $$('input[name="logoShape"]').forEach((input) => { input.checked = input.value === state.logoShape; });
    $("#removeLogo").hidden = !state.logo;
    if (state.logo) $("#logoImage").src = state.logo;
    else $("#logoImage").removeAttribute("src");
    $("#logoButtonLabel").textContent = logoUploading ? "Preparando logo…" : state.logo ? "Cambiar logo" : "Agregar logo";
    const color = state.brandColor || designColors[state.design];
    $("#brandColor").value = color;
    $("#colorValue").textContent = color.toUpperCase();
    $("#resetColor").disabled = !state.brandColor;
    $$("[data-color]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.color === state.brandColor)));
    $$(".design-option").forEach((label) => label.style.setProperty("--sample-accent", state.brandColor || designColors[label.querySelector("input").value]));
    updateBusyControls();
  }

  async function initialize() {
    form.inert = true;
    $("#resetButton").disabled = true;
    let message = "Nuevo borrador";
    let failed = false;
    try {
      const restored = normalizedDraft(await DemoDraft.load());
      if (restored) {
        state = restored.config;
        ["ownerName", "businessName", "businessDescription", "phone", "phonePrefix", "currency"].forEach((key) => { $(`#${key}`).value = state[key]; });
        $("#whatsappEnabled").checked = state.whatsappEnabled;
        $$("input[name=mode],input[name=design]").forEach((input) => { input.checked = input.value === state[input.name]; });
        renderProductEditors();
        let restoredStep = restored.step;
        if (!state.ownerName.trim() || !state.businessName.trim()) restoredStep = 0;
        else if (state.whatsappEnabled && !/^\d{8,15}$/.test(phoneNumber())) restoredStep = Math.min(restoredStep, 1);
        else if (state.products.some((product) => !product.name.trim() || !product.description.trim())) restoredStep = Math.min(restoredStep, 2);
        showStep(restoredStep, false);
        refreshChoices();
        refreshPreview();
        message = "Borrador recuperado";
      }
    } catch {
      message = "Guardado local no disponible";
      failed = true;
    } finally {
      draftReady = true;
      form.inert = false;
      updateBusyControls();
      draftStatus(message, failed);
    }
  }

  function phoneNumber() {
    if (!state.whatsappEnabled) return "";
    let digits = state.phone.replace(/\D/g, "");
    if (!digits) return "";
    if (state.phone.trim().startsWith("+")) return digits;
    if (state.phonePrefix === "549") {
      if (digits.startsWith("549")) return digits;
      if (digits.startsWith("54")) return `549${digits.slice(2).replace(/^9/, "")}`;
      digits = digits.replace(/^0/, "");
    } else if (state.phonePrefix && digits.startsWith(state.phonePrefix)) return digits;
    return state.phonePrefix + digits;
  }

  function config() {
    const number = phoneNumber();
    return { ...state, whatsappNumber: /^\d{8,15}$/.test(number) ? number : "" };
  }

  function slug(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "tu-negocio";
  }

  function refreshPreview() {
    clearTimeout(previewTimer);
    const nextHtml = DemoSite.build(config());
    if (nextHtml !== previewHtml) {
      previewHtml = nextHtml;
      iframe.srcdoc = previewHtml;
    }
    $("#previewAddress").textContent = `${slug(state.businessName)}.demo`;
    $("#previewDesignName").textContent = designNames[state.design];
    $("#previewModeName").textContent = state.mode === "catalog" ? "Catálogo" : "Vidriera";
    refreshSummary();
    scheduleDraft();
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(refreshPreview, 220);
    scheduleDraft();
  }

  function refreshSummary() {
    $("#demoSummary").innerHTML = [
      ["Tu negocio", state.businessName || "Tu negocio"],
      ["Página", state.mode === "catalog" ? "Catálogo de venta" : "Vidriera de productos"],
      ["Productos", String(state.products.length)],
      ["WhatsApp", state.whatsappEnabled ? "Activado" : "Sin botón"],
      ["Logo", state.logo ? "Agregado" : "Sin logo"],
      ["Color", (state.brandColor || designColors[state.design]).toUpperCase()],
    ].map(([label, value]) => `<div class="summary-row"><span>${label}</span><strong>${DemoSite.escape(value)}</strong></div>`).join("");
    const details = state.products.map((product) => product.name).filter(Boolean).join(", ");
    const message = `Hola CSSENZA, soy ${state.ownerName.trim()}. Probé la demo para ${state.businessName.trim()} y quiero un presupuesto sin cargo.\n\nTipo: ${state.mode === "catalog" ? "Catálogo de venta" : "Vidriera"}.\nDiseño: ${designNames[state.design]}.\nColor: ${state.brandColor || designColors[state.design]}.\nLogo: ${state.logo ? "Sí" : "No"}.\nProductos: ${state.products.length}${details ? ` (${details})` : ""}.\nWhatsApp en mi página: ${state.whatsappEnabled ? "Sí" : "No"}.`;
    $("#requestQuote").href = `https://wa.me/5493412473546?text=${encodeURIComponent(message)}`;
  }

  function fieldError(input, message, element) {
    input.setAttribute("aria-invalid", message ? "true" : "false");
    element.textContent = message;
    element.hidden = !message;
    return !message;
  }

  function validateStep(index) {
    if (uploading || logoUploading) return false;
    let invalid = null;
    if (index === 0) {
      if (!fieldError($("#ownerName"), state.ownerName.trim() ? "" : "Ingresá tu nombre.", $("#ownerError"))) invalid = $("#ownerName");
      if (!fieldError($("#businessName"), state.businessName.trim() ? "" : "Ingresá el nombre de tu empresa.", $("#businessError"))) invalid ||= $("#businessName");
    }
    if (index === 1) {
      const message = state.whatsappEnabled && !/^\d{8,15}$/.test(phoneNumber()) ? "Ingresá un número válido con código de área." : "";
      if (!fieldError($("#phone"), message, $("#phoneError"))) invalid = $("#phone");
    }
    if (index === 2) {
      if (uploading) return false;
      state.products.forEach((product) => {
        const row = $(`[data-editor="${product.id}"]`);
        let productInvalid = false;
        ["name", "description"].forEach((key) => {
          const input = row.querySelector(`[data-field="${key}"]`);
          const message = product[key].trim() ? "" : key === "name" ? "Ingresá el nombre del producto." : "Agregá una descripción del producto.";
          input.setAttribute("aria-invalid", message ? "true" : "false");
          productInvalid ||= Boolean(message);
          if (message) invalid ||= input;
        });
        const priceInput = row.querySelector('[data-field="price"]');
        if (state.mode === "catalog" && (!priceInput.validity.valid || (product.price !== "" && (!Number.isFinite(Number(product.price)) || Number(product.price) < 0)))) {
          priceInput.setAttribute("aria-invalid", "true");
          productInvalid = true;
          invalid ||= priceInput;
        } else priceInput.setAttribute("aria-invalid", "false");
        const error = row.querySelector(".field-error");
        error.textContent = "Completá el nombre y la descripción. El precio, si lo agregás, debe ser válido.";
        error.hidden = !productInvalid;
      });
    }
    if (invalid) {
      showStep(index, false);
      invalid.focus();
      return false;
    }
    return true;
  }

  function validateAll() {
    for (let index = 0; index < 3; index++) if (!validateStep(index)) return false;
    return true;
  }

  function showStep(next, focus = true) {
    step = next;
    $$("[data-panel]").forEach((panel) => { panel.hidden = Number(panel.dataset.panel) !== step; });
    $$("[data-step]").forEach((button) => {
      const index = Number(button.dataset.step);
      button.classList.toggle("active", index === step);
      button.classList.toggle("complete", index < step);
      if (index === step) button.setAttribute("aria-current", "step"); else button.removeAttribute("aria-current");
    });
    $("#stepCaption").textContent = `0${step + 1} / ${captions[step]}`;
    $("#stepCount").textContent = `${step + 1} de 4`;
    $("#previousStep").hidden = step === 0;
    $("#nextStep").hidden = step === 3;
    if (step === 3) refreshPreview();
    if (focus) {
      const heading = $(`[data-panel="${step}"] h2`);
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      if (window.innerWidth <= 800) $(".editor").scrollIntoView({ behavior: "auto", block: "start" });
    }
    $("#announcement").textContent = `Paso ${step + 1} de 4: ${captions[step]}`;
    scheduleDraft();
  }

  function refreshChoices() {
    $$(".mode-option,.design-option").forEach((label) => label.classList.toggle("selected", label.querySelector("input").checked));
    $("#phoneFields").hidden = !state.whatsappEnabled;
    $("#phone").required = state.whatsappEnabled;
    $("#currencyField").hidden = state.mode !== "catalog";
    $$(".product-price-field").forEach((field) => { field.hidden = state.mode !== "catalog"; });
    refreshBrand();
  }

  function renderProductEditors() {
    $("#productEditors").innerHTML = state.products.map((product, index) => `<fieldset class="product-editor" data-editor="${product.id}"><legend class="sr-only">Producto ${index + 1}</legend><div class="product-editor-head"><img src="${product.image}" alt="Foto del producto ${index + 1}"/><span class="product-number">Producto ${String(index + 1).padStart(2, "0")}</span><button class="icon-button" type="button" data-remove-product="${product.id}" title="Quitar producto" aria-label="Quitar producto ${index + 1}">${DemoSite.icon("Trash2")}</button></div><div class="field"><label for="name-${product.id}">Nombre del producto *</label><input id="name-${product.id}" type="text" data-field="name" value="${DemoSite.escape(product.name)}" maxlength="80" required aria-describedby="error-${product.id}"/></div><div class="field"><label for="description-${product.id}">Descripción *</label><textarea id="description-${product.id}" data-field="description" rows="2" maxlength="280" placeholder="Qué hace especial a este producto" required aria-describedby="error-${product.id}">${DemoSite.escape(product.description)}</textarea></div><div class="field product-price-field" ${state.mode !== "catalog" ? "hidden" : ""}><label for="price-${product.id}">Precio <span class="optional">Opcional</span></label><input id="price-${product.id}" type="number" data-field="price" value="${DemoSite.escape(product.price)}" min="0" max="999999999" step="0.01" inputmode="decimal" placeholder="A consultar" aria-describedby="error-${product.id}"/></div><p class="field-error" id="error-${product.id}" hidden></p></fieldset>`).join("");
    $("#photoCount").textContent = `${state.products.length} / 5 fotos`;
    updateBusyControls();
    refreshChoices();
  }

  // Sequential resizing keeps a five-photo upload manageable on mobile devices.
  async function prepareImage(file, maxDimension = 1400) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Usá fotos JPG, PNG o WebP.");
    if (file.size > 12 * 1024 * 1024) throw new Error("Cada foto debe pesar menos de 12 MB.");
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (!image.naturalWidth || !image.naturalHeight) throw new Error("No pudimos abrir una de las fotos.");
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No pudimos preparar la foto. Probá con otra imagen.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const result = canvas.toDataURL("image/webp", .86);
      canvas.width = 1;
      canvas.height = 1;
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("No pudimos")) throw error;
      throw new Error("Una foto no es válida. Probá con otra imagen.");
    } finally { URL.revokeObjectURL(url); }
  }

  async function addPhotos(files) {
    if (uploading || logoUploading || !files.length) return;
    const error = $("#uploadError");
    error.hidden = true;
    if (state.products.length + files.length > 5) {
      error.textContent = `Podés subir hasta 5 fotos. Quedan ${5 - state.products.length} lugares.`;
      error.hidden = false;
      return;
    }
    uploading = true;
    $("#dropzone").classList.add("busy");
    $("#dropzone").setAttribute("aria-busy", "true");
    updateBusyControls();
    const added = [];
    const messages = new Set();
    for (const file of files) {
      try {
        const image = await prepareImage(file);
        added.push({ id: crypto.randomUUID(), image, name: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 80), description: "", price: "" });
      } catch (failure) { messages.add(failure.message); }
    }
    state.products.push(...added);
    uploading = false;
    $("#dropzone").classList.remove("busy");
    $("#dropzone").setAttribute("aria-busy", "false");
    updateBusyControls();
    renderProductEditors();
    refreshPreview();
    if (messages.size) { error.textContent = [...messages].join(" "); error.hidden = false; }
    $("#announcement").textContent = `${added.length} ${added.length === 1 ? "foto agregada" : "fotos agregadas"}.`;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (step < 3 && validateStep(step)) showStep(step + 1);
  });
  $("#previousStep").addEventListener("click", () => { if (step > 0 && !uploading && !logoUploading) showStep(step - 1); });
  $$("[data-step]").forEach((button) => button.addEventListener("click", () => {
    if (uploading || logoUploading) return;
    const next = Number(button.dataset.step);
    for (let index = 0; index < next; index++) if (!validateStep(index)) return;
    showStep(next);
  }));

  ["ownerName", "businessName", "businessDescription", "phone"].forEach((key) => $(`#${key}`).addEventListener("input", (event) => {
    state[key] = event.target.value;
    const errorId = { ownerName: "ownerError", businessName: "businessError", phone: "phoneError" }[key];
    if (errorId) fieldError(event.target, "", $(`#${errorId}`));
    schedulePreview();
  }));
  $$("input[name=mode],input[name=design]").forEach((input) => input.addEventListener("change", (event) => {
    state[event.target.name] = event.target.value;
    refreshChoices();
    refreshPreview();
  }));
  $("#whatsappEnabled").addEventListener("change", (event) => { state.whatsappEnabled = event.target.checked; refreshChoices(); refreshPreview(); });
  $("#phonePrefix").addEventListener("change", (event) => { state.phonePrefix = event.target.value; schedulePreview(); });
  $("#currency").addEventListener("change", (event) => { state.currency = event.target.value; refreshPreview(); });
  $("#productEditors").addEventListener("input", (event) => {
    const input = event.target.closest("[data-field]");
    if (!input) return;
    const product = state.products.find((item) => item.id === input.closest("[data-editor]").dataset.editor);
    if (!product) return;
    product[input.dataset.field] = input.value;
    input.setAttribute("aria-invalid", "false");
    schedulePreview();
  });
  $("#productEditors").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-product]");
    if (!button || uploading || logoUploading) return;
    state.products = state.products.filter((product) => product.id !== button.dataset.removeProduct);
    renderProductEditors();
    refreshPreview();
    $("#addPhotos").focus();
  });
  $("#addPhotos").addEventListener("click", () => $("#photoInput").click());
  $("#photoInput").addEventListener("change", async (event) => { await addPhotos([...event.target.files]); event.target.value = ""; });
  $("#addLogo").addEventListener("click", () => $("#logoInput").click());
  $("#logoInput").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file || uploading || logoUploading) return;
    logoUploading = true;
    $("#logoError").hidden = true;
    refreshBrand();
    try {
      state.logo = await prepareImage(file, 440);
      refreshPreview();
    } catch (error) {
      $("#logoError").textContent = error.message;
      $("#logoError").hidden = false;
    } finally {
      logoUploading = false;
      event.target.value = "";
      refreshBrand();
    }
  });
  $("#removeLogo").addEventListener("click", () => { state.logo = ""; $("#logoError").hidden = true; refreshBrand(); refreshPreview(); });
  $$('input[name="logoShape"]').forEach((input) => input.addEventListener("change", () => {
    state.logoShape = input.value;
    refreshBrand();
    refreshPreview();
  }));
  $("#brandColor").addEventListener("input", (event) => { state.brandColor = event.target.value; refreshBrand(); schedulePreview(); });
  $$("[data-color]").forEach((button) => button.addEventListener("click", () => { state.brandColor = button.dataset.color; refreshBrand(); refreshPreview(); }));
  $("#resetColor").addEventListener("click", () => { state.brandColor = ""; refreshBrand(); refreshPreview(); });
  ["dragenter", "dragover"].forEach((name) => $("#dropzone").addEventListener(name, (event) => { event.preventDefault(); if (!uploading) $("#dropzone").classList.add("dragover"); }));
  ["dragleave", "drop"].forEach((name) => $("#dropzone").addEventListener(name, (event) => { event.preventDefault(); $("#dropzone").classList.remove("dragover"); }));
  $("#dropzone").addEventListener("drop", (event) => addPhotos([...event.dataTransfer.files]));
  window.addEventListener("dragover", (event) => event.preventDefault());
  window.addEventListener("drop", (event) => event.preventDefault());

  $$("[data-device]").forEach((button) => button.addEventListener("click", () => {
    const mobile = button.dataset.device === "mobile";
    $("#previewStage").classList.toggle("mobile", mobile);
    $$("[data-device]").forEach((item) => { const active = item === button; item.classList.toggle("active", active); item.setAttribute("aria-pressed", String(active)); });
  }));
  function expandPreview() {
    const expanded = $(".preview-area").classList.toggle("expanded");
    $(".editor").inert = expanded;
    $(".app-header").inert = expanded;
    if (expanded) {
      $(".preview-area").setAttribute("role", "dialog");
      $(".preview-area").setAttribute("aria-modal", "true");
    } else {
      $(".preview-area").removeAttribute("role");
      $(".preview-area").removeAttribute("aria-modal");
    }
    $("#expandPreview").setAttribute("aria-label", expanded ? "Reducir vista previa" : "Ampliar vista previa");
    $("#expandPreview").title = expanded ? "Reducir vista previa" : "Ampliar vista previa";
    $("#expandPreview").innerHTML = DemoSite.icon(expanded ? "Minimize2" : "Maximize2");
    if (expanded) $("#expandPreview").focus();
  }
  $("#expandPreview").addEventListener("click", expandPreview);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && $(".preview-area").classList.contains("expanded")) expandPreview(); });

  function deliverDemo(download) {
    if (!validateAll()) return;
    refreshPreview();
    const url = URL.createObjectURL(new Blob([previewHtml], { type: "text/html;charset=utf-8" }));
    if (download) {
      const link = document.createElement("a");
      link.href = url;
      link.download = `demo-${slug(state.businessName)}.html`;
      link.click();
    } else {
      const opened = window.open(url, "_blank");
      if (opened) opened.opener = null;
      else { $("#announcement").textContent = "El navegador bloqueó la nueva pestaña. Podés descargar la demo."; }
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  $("#openDemo").addEventListener("click", () => deliverDemo(false));
  $("#downloadDemo").addEventListener("click", () => deliverDemo(true));
  $("#requestQuote").addEventListener("click", (event) => { if (!validateAll()) event.preventDefault(); else refreshSummary(); });

  $("#resetButton").addEventListener("click", () => $("#resetDialog").showModal());
  $("#resetDialog").addEventListener("close", async () => {
    if ($("#resetDialog").returnValue !== "reset") return;
    clearTimeout(previewTimer);
    clearTimeout(draftTimer);
    draftTimer = undefined;
    draftRevision++;
    draftReady = false;
    state = defaults();
    form.reset();
    $$(".field-error").forEach((element) => { element.hidden = true; element.textContent = ""; });
    $$("[aria-invalid]").forEach((element) => element.removeAttribute("aria-invalid"));
    renderProductEditors();
    refreshChoices();
    showStep(0);
    refreshPreview();
    $("#ownerName").focus();
    form.inert = true;
    updateBusyControls();
    try {
      saveQueue = saveQueue.catch(() => {}).then(() => DemoDraft.clear());
      await saveQueue;
      draftStatus("Nuevo borrador");
    } catch { draftStatus("No se pudo borrar el borrador guardado", true); }
    finally { draftReady = true; form.inert = false; updateBusyControls(); $("#ownerName").focus(); }
  });

  window.addEventListener("pagehide", () => { if (draftTimer !== undefined) persistDraft(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && draftTimer !== undefined) persistDraft(); });

  paintIcons();
  renderProductEditors();
  refreshChoices();
  refreshPreview();
  initialize();
})();

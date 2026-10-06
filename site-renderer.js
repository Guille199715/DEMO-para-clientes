(() => {
  "use strict";

  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const icon = (name) => {
    const nodes = window.DEMO_ICONS?.[name] || [];
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${nodes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([key, value]) => `${key}="${escape(value)}"`).join(" ")}></${tag}>`).join("")}</svg>`;
  };
  const money = (value, currency) => new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);

  function luminance(hex) {
    const values = hex.slice(1).match(/.{2}/g).map((part) => {
      const channel = parseInt(part, 16) / 255;
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
    });
    return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
  }

  function contrast(first, second) {
    const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
    return (values[0] + .05) / (values[1] + .05);
  }

  // Keep the selected brand color intact, with a readable shade for small text.
  function readableAccent(color, background) {
    if (contrast(color, background) >= 4.5) return color;
    const target = contrast("#ffffff", background) > contrast("#000000", background) ? 255 : 0;
    const channels = color.slice(1).match(/.{2}/g).map((part) => parseInt(part, 16));
    for (let amount = 1; amount <= 20; amount++) {
      const shade = "#" + channels.map((value) => Math.round(value + (target - value) * amount / 20).toString(16).padStart(2, "0")).join("");
      if (contrast(shade, background) >= 4.5) return shade;
    }
    return target ? "#ffffff" : "#000000";
  }

  const css = `
    :root{color-scheme:light;--bg:#f8faf8;--paper:#fff;--ink:#192c22;--muted:#708176;--accent:#225d4a;--line:#dbe4dc;--soft:#edf3ee;--heading:Georgia,"Times New Roman",serif;font-family:"Segoe UI",Arial,sans-serif;font-synthesis:none}
    *{box-sizing:border-box;letter-spacing:0}body{margin:0;background:var(--bg);color:var(--ink)}[hidden]{display:none!important}button,a{touch-action:manipulation}button,input{font:inherit}button{cursor:pointer}a{color:inherit}button:focus-visible,a:focus-visible{outline:3px solid var(--accent);outline-offset:4px}button:disabled{opacity:.55;cursor:default}svg{width:19px;height:19px;flex:none;vertical-align:middle}img{display:block;width:100%}button,a{-webkit-tap-highlight-color:transparent}.site-header{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:78px;padding:16px 6%;border-bottom:1px solid var(--line);background:var(--paper)}.wordmark{display:flex;align-items:center;gap:10px;text-decoration:none;min-width:0}.monogram{display:grid;place-items:center;background:var(--accent);color:var(--paper);width:33px;height:33px;flex:none;border-radius:3px;font-size:12px;font-weight:700}.brand-name{font-family:var(--heading);font-size:21px;font-weight:500;max-width:360px;overflow-wrap:anywhere;line-height:1.25}.site-nav{display:flex;gap:23px;align-items:center;flex:none}.site-nav>a{text-decoration:none;font-size:11px}.site-nav .contact-nav{display:flex;gap:6px;align-items:center}.cart-trigger{display:flex;align-items:center;gap:7px;border:0;background:transparent;color:var(--ink);padding:7px}.cart-count{display:grid;place-items:center;background:var(--soft);font-size:10px;border-radius:50%;width:19px;height:19px}.hero{position:relative;min-height:395px;display:flex;align-items:center;overflow:hidden;padding:44px 6%}.hero-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:0}.hero:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(248,250,248,.97),rgba(248,250,248,.8) 30%,rgba(248,250,248,.03) 80%);z-index:1}.hero-copy{position:relative;z-index:2;width:53%;max-width:510px}.eyebrow{font-size:9px;font-weight:700;color:var(--accent);text-transform:uppercase;margin:0 0 17px}.hero h1{font-family:var(--heading);font-size:49px;font-weight:400;line-height:1.13;margin:0 0 20px;overflow-wrap:anywhere}.hero-description{font-size:13px;line-height:1.8;max-width:360px;white-space:pre-line;margin:0 0 26px;color:var(--muted);overflow-wrap:anywhere}.site-button{display:inline-flex;justify-content:center;align-items:center;gap:10px;padding:12px 18px;min-height:43px;border:1px solid var(--accent);background:var(--accent);color:var(--paper);font-size:11px;font-weight:600;text-decoration:none;border-radius:3px;line-height:1.4}.site-button.outline{background:transparent;color:var(--accent)}.section-inner{max-width:1230px;margin:0 auto;padding:35px 6% 48px}.collection-heading{display:flex;justify-content:space-between;align-items:baseline;gap:20px;margin:0 0 26px}.collection-heading h2{font-family:var(--heading);font-size:29px;font-weight:400;line-height:1.2;margin:0}.collection-heading>span{font-size:10px;color:var(--muted)}.products{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.product{min-width:0}.product-image{display:block;width:100%;padding:0;border:0;background:var(--soft);aspect-ratio:4/3;border-radius:4px;overflow:hidden}.product-image img{height:100%;width:100%;object-fit:cover;transition:transform 180ms}.product-image:hover img{transform:scale(1.025)}.product-info{padding-top:16px}.product h3{font-size:17px;line-height:1.4;font-weight:600;margin:0 0 6px;overflow-wrap:anywhere}.product-description{color:var(--muted);font-size:11px;line-height:1.7;white-space:pre-line;overflow-wrap:anywhere;margin:0 0 13px}.product-bottom{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:12px}.product-price{font-size:14px;font-weight:600}.product-bottom .site-button{padding:9px 12px;min-height:35px;font-size:10px}.text-button{display:inline-flex;align-items:center;gap:5px;font-size:10px;color:var(--accent);padding:5px 0;text-decoration:none;border:0;background:transparent}.text-button svg{width:15px;height:15px}.about{border-top:1px solid var(--line)}.about-inner{max-width:860px;margin:0 auto;padding:38px 6%;text-align:center}.about h2{font-family:var(--heading);font-size:27px;font-weight:400;margin:0 0 12px}.about p{font-size:13px;line-height:1.8;color:var(--muted);white-space:pre-line;overflow-wrap:anywhere;margin:0 0 17px}.site-footer{padding:24px 6%;display:flex;justify-content:space-between;align-items:center;gap:15px;border-top:1px solid var(--line);font-size:10px;color:var(--muted)}.site-footer>span{overflow-wrap:anywhere}.site-footer>a{text-decoration:none;flex:none}.demo-tag{color:var(--muted);font-size:9px;border:1px solid var(--line);padding:4px 7px;border-radius:3px}.site--nocturna{color-scheme:dark;--bg:#131919;--paper:#192222;--ink:#f3f7f5;--muted:#a4b7ae;--accent:#00dac3;--line:#2c3c35;--soft:#243830;--heading:"Segoe UI",Arial,sans-serif}.site--nocturna .monogram,.site--nocturna .site-button:not(.outline){color:#10291e}.site--nocturna .site-header{background:var(--bg)}.site--nocturna .brand-name{font-weight:700;font-size:18px}.site--nocturna .hero{min-height:440px}.site--nocturna .hero:after{background:linear-gradient(90deg,rgba(19,25,25,.97),rgba(19,25,25,.9) 29%,rgba(19,25,25,.05) 90%)}.site--nocturna .hero h1{font-size:47px;font-weight:700}.site--nocturna .products{grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.site--nocturna .product{background:var(--paper);border:1px solid var(--line);border-radius:6px;overflow:hidden}.site--nocturna .product-image{border-radius:0;aspect-ratio:4/5}.site--nocturna .product-info{padding:15px}.site--nocturna .product h3{font-size:14px}.site--nocturna .collection-heading h2{font-weight:600;font-size:26px}.site--galeria{--bg:#fff;--paper:#fff;--ink:#292328;--muted:#867580;--accent:#96334e;--line:#eadfe4;--soft:#f7eff2;--heading:Georgia,"Times New Roman",serif}.site--galeria .site-header{justify-content:center;flex-wrap:wrap;padding:20px 6%;gap:14px;min-height:98px}.site--galeria .wordmark{width:100%;justify-content:center}.site--galeria .monogram{display:none}.site--galeria .brand-name{font-size:26px;text-align:center;max-width:none}.site--galeria .site-nav{justify-content:center;gap:28px}.site--galeria .hero{justify-content:center;min-height:355px;text-align:center}.site--galeria .hero-copy{width:85%;max-width:560px}.site--galeria .hero:after{background:rgba(255,255,255,.75)}.site--galeria .hero h1{font-size:46px}.site--galeria .hero-description{margin-left:auto;margin-right:auto;max-width:390px}.site--galeria .products{gap:32px}.site--galeria .product-image{aspect-ratio:4/5;border-radius:0}.site--galeria .product-info{text-align:center}.site--galeria .product-bottom{justify-content:center}.site--galeria .collection-heading{justify-content:center;flex-direction:column;align-items:center;gap:10px}.site--galeria .site-button{border-radius:0}.cart-dialog,.detail-dialog{color:var(--ink);background:var(--paper);border:1px solid var(--line);border-radius:8px;padding:25px;width:min(480px,calc(100% - 28px));max-height:calc(100dvh - 35px);overflow:auto}.cart-dialog::backdrop,.detail-dialog::backdrop{background:#10231a88}.dialog-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:15px}.dialog-heading h2{font-family:var(--heading);font-size:25px;line-height:1.2;margin:9px 0 21px}.dialog-heading p{margin:0;font-size:10px;color:var(--accent)}.icon-button{display:grid;place-items:center;width:33px;height:33px;background:transparent;border:1px solid var(--line);border-radius:4px;padding:0;color:var(--ink);flex:none}.empty-cart{font-size:13px;line-height:1.8;color:var(--muted);padding:12px 0 30px}.cart-row{display:grid;grid-template-columns:48px minmax(0,1fr) 26px;gap:12px;border-bottom:1px solid var(--line);padding:17px 0}.cart-row img{width:48px;height:60px;object-fit:cover;border-radius:3px}.cart-row h3{font-size:12px;line-height:1.4;overflow-wrap:anywhere;margin:0 0 5px}.cart-row p{font-size:11px;color:var(--muted);margin:0 0 9px}.quantity{display:flex;align-items:center;gap:12px;font-size:12px}.quantity button{width:25px;height:25px}.quantity svg{width:12px;height:12px}.remove-item{border:0;padding:0;background:transparent;color:var(--muted);width:24px;height:28px}.remove-item svg{width:15px;height:15px}.cart-total{display:flex;justify-content:space-between;gap:10px;padding:24px 0;font-size:13px}.cart-total strong{font-weight:700}.cart-checkout{width:100%;margin-bottom:7px}.detail-photo{width:100%;max-height:340px;object-fit:contain;background:var(--soft);margin:0 0 20px;border-radius:4px}.detail-description{font-size:13px;line-height:1.8;white-space:pre-line;overflow-wrap:anywhere;color:var(--muted)}.detail-dialog .product-bottom{margin-bottom:10px}.toast{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:var(--ink);color:var(--bg);font-size:12px;padding:12px 18px;border-radius:5px;max-width:calc(100% - 32px);z-index:20;pointer-events:none;box-shadow:0 5px 20px #0002}
    @media(max-width:900px){.site--nocturna .products{grid-template-columns:repeat(2,minmax(0,1fr))}.hero h1,.site--nocturna .hero h1{font-size:40px}.hero-copy{width:60%}.site--galeria .hero h1{font-size:40px}.site-nav{gap:14px}.brand-name{font-size:19px;max-width:240px}.site--nocturna .hero{min-height:395px}}
    @media(max-width:600px){.site-header{min-height:65px;padding:14px 5%;gap:12px}.site-nav{gap:12px}.site-nav>a{font-size:10px}.site-nav .collection-nav{display:none}.brand-name{font-size:18px;max-width:195px}.monogram{width:29px;height:29px;font-size:10px}.wordmark{gap:8px}.contact-nav svg{width:16px;height:16px}.contact-nav span{display:none}.hero,.site--nocturna .hero{min-height:390px;padding:37px 6%;align-items:flex-start}.hero-copy{width:90%}.hero:after{background:linear-gradient(180deg,rgba(248,250,248,.93),rgba(248,250,248,.87) 45%,rgba(248,250,248,.08))}.hero-image{object-position:64% center}.hero h1,.site--nocturna .hero h1{font-size:36px;margin-bottom:17px}.hero-description{font-size:12px;line-height:1.7;max-width:310px;margin-bottom:22px}.site--nocturna .hero:after{background:linear-gradient(180deg,rgba(19,25,25,.97),rgba(19,25,25,.85) 45%,rgba(19,25,25,.13))}.section-inner{padding:27px 5% 36px}.collection-heading{gap:12px;margin-bottom:20px}.collection-heading h2{font-size:25px}.products{gap:19px 13px}.product-image{aspect-ratio:4/5}.product h3{font-size:14px}.product-description{font-size:10px;line-height:1.65}.product-bottom{gap:8px}.product-price{font-size:12px}.product-bottom .site-button{font-size:10px;width:100%;min-height:36px}.product-bottom .site-button svg{width:14px;height:14px}.site--nocturna .product-info{padding:12px 10px}.site--nocturna .product h3{font-size:13px}.site--nocturna .products{gap:13px}.site--galeria .hero{min-height:340px;align-items:center;padding:33px 6%}.site--galeria .hero-copy{width:100%}.site--galeria .hero h1{font-size:36px}.site--galeria .products{gap:22px 13px}.site--galeria .brand-name{font-size:24px;max-width:100%}.site--galeria .site-nav{gap:24px}.site-footer{flex-wrap:wrap;justify-content:center;text-align:center;padding:22px 5%;font-size:9px}.about-inner{padding:30px 6%}.about h2{font-size:24px}.about p{font-size:12px}.cart-dialog,.detail-dialog{padding:20px}.dialog-heading h2{font-size:23px}.cart-row{grid-template-columns:42px minmax(0,1fr) 24px;gap:10px}}
    @media(max-width:360px){.hero h1,.site--nocturna .hero h1,.site--galeria .hero h1{font-size:31px}.brand-name{max-width:150px}.products{gap:18px 10px}.product h3{font-size:13px}.cart-count{width:17px;height:17px}.site-nav{gap:8px}.site--nocturna .product-info{padding:11px 8px}}
    .products{--product-spacing:24px}.site--nocturna .products{--product-spacing:18px}.site--galeria .products{--product-spacing:32px}
    @media(max-width:600px){.products{--product-spacing:19px}.site--nocturna .products{--product-spacing:13px}.site--galeria .products{--product-spacing:22px}}
    @supports(grid-template-rows:subgrid){
      .site--editorial .products,.site--nocturna .products,.site--galeria .products{row-gap:0}
      .products .product{display:grid;grid-template-rows:subgrid;grid-row:span 4;row-gap:0;margin-bottom:var(--product-spacing)}
      .products .product-info{display:grid;grid-template-rows:subgrid;grid-row:span 3;row-gap:0}
      .products .product h3,.products .product-description,.products .product-bottom{align-self:start}
    }
    .site-logo{width:46px;height:46px;object-fit:contain;flex:none}.site--galeria .site-logo{width:42px;height:42px}
    body[class] .monogram,body[class] .site-button:not(.outline){color:var(--on-accent,var(--paper))}
    .eyebrow,.text-button,.site-button.outline,.dialog-heading p{color:var(--accent-text,var(--accent))}
    .site-button.outline{border-color:var(--accent-text,var(--accent))}
    button:focus-visible,a:focus-visible{outline-color:var(--accent-text,var(--accent))}
    @media(max-width:600px){.site-logo{width:36px;height:36px}.site--galeria .site-logo{width:37px;height:37px}}
    .site-logo[data-shape="circle"]{object-fit:cover;border-radius:50%}
    .site-logo[data-shape="square"]{object-fit:cover;border-radius:0}
    .site-logo[data-shape="original"]{width:auto;max-width:140px;object-fit:contain;border-radius:0}
    @media(max-width:600px){.site-logo[data-shape="original"]{max-width:95px}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}}
  `;

  // This runtime travels with downloaded demos; product data never needs a server.
  function siteRuntime() {
    const data = JSON.parse(document.getElementById("site-data").textContent);
    const cart = new Map();
    const dialog = document.getElementById("cartDialog");
    const detailDialog = document.getElementById("detailDialog");
    const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    const money = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: data.currency, maximumFractionDigits: 2 }).format(value);
    const photo = (id) => document.querySelector(`[data-product="${id}"] img`)?.src || "";
    let toastTimer;

    function toast(message) {
      const element = document.getElementById("toast");
      element.textContent = message;
      element.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { element.hidden = true; }, 2400);
    }

    function renderCart() {
      const items = data.products.filter((product) => cart.has(product.id));
      const count = [...cart.values()].reduce((sum, quantity) => sum + quantity, 0);
      const countElement = document.getElementById("cart-count");
      if (countElement) countElement.textContent = String(count);
      document.getElementById("cart-items").innerHTML = items.length ? items.map((product) => `<article class="cart-row"><img src="${photo(product.id)}" alt="${escape(product.name)}"/><div><h3>${escape(product.name)}</h3><p>${product.price === null ? "Precio a consultar" : money(product.price)}</p><div class="quantity"><button class="icon-button" data-decrease="${product.id}" aria-label="Reducir cantidad de ${escape(product.name)}">${data.icons.Minus}</button><span>${cart.get(product.id)}</span><button class="icon-button" data-increase="${product.id}" aria-label="Aumentar cantidad de ${escape(product.name)}" ${cart.get(product.id) >= 99 ? "disabled" : ""}>${data.icons.Plus}</button></div></div><button class="remove-item" data-remove="${product.id}" aria-label="Quitar ${escape(product.name)}">${data.icons.Trash2}</button></article>`).join("") : '<p class="empty-cart">Tu pedido está vacío.</p>';
      const priced = items.filter((product) => product.price !== null);
      const subtotal = priced.reduce((sum, product) => sum + product.price * cart.get(product.id), 0);
      document.getElementById("cart-total-label").textContent = items.some((product) => product.price === null) ? "Subtotal informado" : "Total";
      document.getElementById("cart-total-value").textContent = items.length && !priced.length ? "A consultar" : money(subtotal);
      document.getElementById("cart-checkout").disabled = !items.length;
    }

    function addProduct(id) {
      if (!data.products.some((product) => product.id === id)) return;
      cart.set(id, Math.min(99, (cart.get(id) || 0) + 1));
      renderCart();
      toast("Agregado a tu pedido");
    }

    function showProduct(id) {
      const product = data.products.find((item) => item.id === id);
      if (!product) return;
      document.getElementById("detailName").textContent = product.name;
      document.getElementById("detailDescription").textContent = product.description;
      const image = document.getElementById("detailPhoto");
      image.src = photo(id);
      image.alt = product.name;
      const price = document.getElementById("detailPrice");
      price.textContent = product.price === null ? "Precio a consultar" : money(product.price);
      price.hidden = data.mode !== "catalog";
      const button = document.getElementById("detailAdd");
      button.hidden = data.mode !== "catalog";
      button.dataset.add = id;
      const contact = document.getElementById("detailContact");
      contact.hidden = !data.phone || data.mode === "catalog";
      if (data.phone) contact.href = `https://wa.me/${data.phone}?text=${encodeURIComponent(`Hola, quiero consultar por ${product.name}.`)}`;
      detailDialog.showModal();
    }

    document.addEventListener("click", (event) => {
      const anchor = event.target.closest('a[href^="#"]');
      if (anchor) {
        // srcdoc anchors otherwise resolve against the editor's URL.
        event.preventDefault();
        const section = document.getElementById(anchor.getAttribute("href").slice(1));
        if (section) section.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
        return;
      }
      const target = event.target.closest("button");
      if (!target) return;
      if (target.dataset.add) addProduct(target.dataset.add);
      if (target.dataset.detail) showProduct(target.dataset.detail);
      if (target.hasAttribute("data-cart-open")) { renderCart(); dialog.showModal(); }
      if (target.dataset.close) document.getElementById(target.dataset.close).close();
      if (target.dataset.increase) addProduct(target.dataset.increase);
      if (target.dataset.decrease) {
        const id = target.dataset.decrease;
        const quantity = (cart.get(id) || 0) - 1;
        if (quantity > 0) cart.set(id, quantity); else cart.delete(id);
        renderCart();
      }
      if (target.dataset.remove) { cart.delete(target.dataset.remove); renderCart(); }
    });

    document.getElementById("cart-checkout").addEventListener("click", () => {
      const products = data.products.filter((product) => cart.has(product.id));
      if (!products.length) return;
      const lines = products.map((product) => `${cart.get(product.id)} x ${product.name} - ${product.price === null ? "Precio a consultar" : money(product.price * cart.get(product.id))}`);
      const message = `[DEMO] Pedido de prueba para ${data.businessName}\n\n${lines.join("\n")}\n\n${document.getElementById("cart-total-label").textContent}: ${document.getElementById("cart-total-value").textContent}`;
      if (data.phone) {
        window.open(`https://wa.me/${data.phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      } else {
        const url = URL.createObjectURL(new Blob([message], { type: "text/plain;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "pedido-de-prueba.txt";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    });

    [dialog, detailDialog].forEach((element) => element.addEventListener("click", (event) => {
      if (event.target !== element) return;
      const rect = element.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) element.close();
    }));
  }

  function build(config) {
    const design = ["editorial", "nocturna", "galeria"].includes(config.design) ? config.design : "editorial";
    const name = config.businessName.trim() || "Tu negocio";
    const description = config.businessDescription.trim();
    const selling = config.mode === "catalog";
    const phone = config.whatsappNumber || "";
    const products = config.products;
    const palette = { editorial: { accent: "#225d4a", background: "#f8faf8" }, nocturna: { accent: "#00dac3", background: "#192222" }, galeria: { accent: "#96334e", background: "#ffffff" } }[design];
    const color = /^#[a-fA-F0-9]{6}$/.test(config.brandColor || "") ? config.brandColor.toLowerCase() : palette.accent;
    const onAccent = contrast("#ffffff", color) >= contrast("#000000", color) ? "#ffffff" : "#000000";
    const brandStyle = `--accent:${color};--on-accent:${onAccent};--accent-text:${readableAccent(color, palette.background)}`;
    const logo = typeof config.logo === "string" && /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/]+={0,2}$/.test(config.logo) ? config.logo : "";
    const initials = (name.match(/[\p{L}\p{N}]+/gu) || ["Tu", "negocio"]).slice(0, 2).map((word) => [...word][0]).join("").toUpperCase();
    const logoShape = ["circle", "square"].includes(config.logoShape) ? config.logoShape : "original";
    const brandMark = logo ? `<img class="site-logo" data-shape="${logoShape}" src="${logo}" alt="Logo de ${escape(name)}"/>` : `<span class="monogram">${escape(initials)}</span>`;
    const heroPhoto = products[0]?.image || window.DEMO_HERO || "";
    const whatsappHref = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(`Hola, quiero consultar por ${name}.`)}` : "";
    const cards = products.map((product) => {
      const price = product.price === "" ? null : Number(product.price);
      return `<article class="product" data-product="${product.id}"><button class="product-image" type="button" data-detail="${product.id}" aria-label="Ver ${escape(product.name || "producto")}"><img src="${product.image}" alt="${escape(product.name || "Producto")}" loading="lazy" decoding="async" /></button><div class="product-info"><h3>${escape(product.name || "Tu producto")}</h3><p class="product-description">${escape(product.description)}</p><div class="product-bottom">${selling ? `<span class="product-price">${price === null ? "Precio a consultar" : escape(money(price, config.currency))}</span><button type="button" class="site-button" data-add="${product.id}">${icon("Plus")}Agregar</button>` : `<button class="text-button" type="button" data-detail="${product.id}">Ver producto${icon("ArrowUpRight")}</button>${phone ? `<a class="text-button" href="https://wa.me/${phone}?text=${encodeURIComponent(`Hola, quiero consultar por ${product.name || "un producto"}.`)}" target="_blank" rel="noopener">Consultar${icon("MessageCircle")}</a>` : ""}`}</div></div></article>`;
    }).join("");
    const runtimeData = {
      businessName: name,
      mode: config.mode,
      currency: config.currency,
      phone,
      products: products.map((product) => ({ id: product.id, name: product.name || "Tu producto", description: product.description, price: product.price === "" ? null : Number(product.price) })),
      icons: Object.fromEntries(["Minus", "Plus", "Trash2"].map((key) => [key, icon(key)])),
    };
    const json = JSON.stringify(runtimeData).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex,nofollow"/><title>${escape(name)} | Demo CSSENZA</title><style>${css}</style></head><body class="site--${design}" style="${brandStyle}"><header class="site-header"><a href="#inicio" class="wordmark">${brandMark}<span class="brand-name">${escape(name)}</span></a><nav class="site-nav" aria-label="Navegación">${products.length ? '<a class="collection-nav" href="#coleccion">Productos</a>' : ""}${phone ? `<a class="contact-nav" href="${whatsappHref}" target="_blank" rel="noopener">${icon("MessageCircle")}<span>WhatsApp</span></a>` : ""}${selling ? `<button class="cart-trigger" type="button" data-cart-open aria-label="Abrir pedido de prueba">${icon("ShoppingBag")}<span id="cart-count" class="cart-count">0</span></button>` : ""}</nav></header><main><section class="hero" id="inicio"><img class="hero-image" src="${heroPhoto}" alt="${products.length ? escape(products[0].name || "Producto de tu negocio") : "Composición de productos para la presentación de tu negocio"}"/><div class="hero-copy"><p class="eyebrow">${selling ? "Nuestro catálogo" : "Nuestra propuesta"}</p><h1>${escape(name)}</h1>${description ? `<p class="hero-description">${escape(description)}</p>` : ""}${products.length ? `<a class="site-button" href="#coleccion">${selling ? "Explorar catálogo" : "Ver productos"}${icon("ArrowRight")}</a>` : phone ? `<a class="site-button" href="${whatsappHref}" target="_blank" rel="noopener">Hablemos${icon("MessageCircle")}</a>` : ""}</div></section>${products.length ? `<section class="section-inner" id="coleccion"><div class="collection-heading"><h2>${selling ? "Elegí tus favoritos." : "Nuestra colección."}</h2><span>${products.length} ${products.length === 1 ? "producto" : "productos"}</span></div><div class="products">${cards}</div></section>` : ""}${phone ? `<section class="about"><div class="about-inner"><h2>Conversemos.</h2><a class="site-button outline" href="${whatsappHref}" target="_blank" rel="noopener">Escribinos por WhatsApp${icon("ArrowUpRight")}</a></div></section>` : ""}</main><footer class="site-footer"><span>${escape(name)}</span><span class="demo-tag">Demo de prueba</span><a href="https://cssenza.com.ar" target="_blank" rel="noopener">Diseño por CSSENZA STUDIO</a></footer><dialog id="cartDialog" class="cart-dialog"><div class="dialog-heading"><div><p>CATÁLOGO</p><h2>Tu pedido de prueba.</h2></div><button class="icon-button" type="button" data-close="cartDialog" aria-label="Cerrar pedido">${icon("X")}</button></div><div id="cart-items"></div><div class="cart-total"><span id="cart-total-label">Total</span><strong id="cart-total-value"></strong></div><button class="site-button cart-checkout" id="cart-checkout" type="button">${phone ? "Consultar pedido por WhatsApp" : "Descargar pedido de prueba"}${icon(phone ? "MessageCircle" : "Download")}</button></dialog><dialog id="detailDialog" class="detail-dialog"><div class="dialog-heading"><h2 id="detailName"></h2><button class="icon-button" type="button" data-close="detailDialog" aria-label="Cerrar producto">${icon("X")}</button></div><img id="detailPhoto" class="detail-photo" alt=""/><p class="detail-description" id="detailDescription"></p><div class="product-bottom"><strong id="detailPrice"></strong><button class="site-button" id="detailAdd" type="button">${icon("Plus")}Agregar al pedido</button><a class="site-button" id="detailContact" href="#" target="_blank" rel="noopener">Consultar${icon("MessageCircle")}</a></div></dialog><p class="toast" id="toast" role="status" hidden></p><script id="site-data" type="application/json">${json}</script><script>(${siteRuntime.toString()})();</script></body></html>`;
  }

  window.DemoSite = { build, escape, icon };
})();

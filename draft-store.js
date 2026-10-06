(() => {
  "use strict";

  let databasePromise;

  function open() {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(new Error("El navegador no permite guardar el borrador.")); return; }
      let settled = false;
      const request = indexedDB.open("cssenza-demo-clientes", 1);
      const timeout = setTimeout(() => {
        settled = true;
        reject(new Error("No se pudo abrir el guardado local."));
      }, 4000);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("drafts")) db.createObjectStore("drafts");
      };
      request.onsuccess = () => {
        clearTimeout(timeout);
        if (settled) { request.result.close(); return; }
        const db = request.result;
        db.onversionchange = () => { db.close(); databasePromise = undefined; };
        resolve(db);
      };
      request.onerror = request.onblocked = () => {
        clearTimeout(timeout);
        settled = true;
        reject(request.error || new Error("El guardado local está bloqueado."));
      };
    });
    databasePromise.catch(() => { databasePromise = undefined; });
    return databasePromise;
  }

  async function transaction(mode, operation) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("drafts", mode);
      const request = operation(tx.objectStore("drafts"));
      let result;
      request.onsuccess = () => { result = request.result; };
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => reject(tx.error || request.error || new Error("No se pudo guardar el borrador."));
    });
  }

  window.DemoDraft = {
    load: () => transaction("readonly", (store) => store.get("current")),
    save: (config, step) => transaction("readwrite", (store) => store.put({ schema: 1, config, step, updatedAt: Date.now() }, "current")),
    clear: () => transaction("readwrite", (store) => store.delete("current")),
  };
})();

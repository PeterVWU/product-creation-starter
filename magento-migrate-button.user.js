// ==UserScript==
// @name         Magento Product Migration Button
// @namespace    https://vapewholesaleusa.com/
// @version      1.1.0
// @description  Adds a "Migrate Product" button to the Magento admin product edit page
// @author       VWUSA
// @match        https://as.vapewholesaleusa.com/admin_N7zuJfehzDnf/catalog/product/edit/*
// @match        https://x19z7.vapewholesaleusa.com/GAYygQ6cafEK7hZf6uzf/catalog/product/edit/*
// @grant        GM_xmlhttpRequest
// @connect      product-creation-api.vapewholesaleusa.com
// ==/UserScript==

(function () {
  "use strict";

  const API_BASE_URL =
    "https://product-creation-api.vapewholesaleusa.com/api/v1/migrate/product";

  const STORE_CONFIG = {
    magento: [
      { code: "default", displayName: "ejuices.com" },
      { code: "misthub", displayName: "misthub.com" },
    ],
    shopify: [
      { code: "ELIQUIDCOM", displayName: "eliquid.com" },
      { code: "EJUICESCO", displayName: "ejuices.co" },
      { code: "ALOHA", displayName: "aloha.com" },
      { code: "RODMAN", displayName: "rodman9k.com" },
      { code: "test", displayName: "test" },
    ],
  };

  const STYLES = `
    .migrate-btn-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
    }

    .migrate-btn {
      padding: 10px 16px;
      background: #4a90d9;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
    }

    .migrate-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .migrate-store-panel {
      position: absolute;
      bottom: 100%;
      right: 0;
      margin-bottom: 8px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 12px;
      min-width: 200px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      display: none;
    }

    .migrate-store-panel.visible {
      display: block;
    }

    .migrate-store-section {
      margin-bottom: 12px;
    }

    .migrate-store-section:last-child {
      margin-bottom: 0;
    }

    .migrate-store-section-title {
      font-weight: bold;
      font-size: 12px;
      color: #666;
      margin-bottom: 6px;
      text-transform: uppercase;
    }

    .migrate-store-option {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }

    .migrate-store-option input[type="checkbox"] {
      margin-right: 8px;
    }

    .migrate-store-option label {
      font-size: 13px;
      color: #333;
      cursor: pointer;
    }

    .migrate-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #eee;
    }

    .migrate-actions button {
      flex: 1;
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    }

    .migrate-actions .migrate-submit {
      background: #28a745;
      color: white;
    }

    .migrate-actions .migrate-cancel {
      background: #6c757d;
      color: white;
    }

    .migrate-actions .migrate-sync-prices {
      background: #fd7e14;
      color: white;
    }

    .migrate-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 350px;
      padding: 12px 16px;
      border-radius: 4px;
      color: white;
      font-size: 13px;
      z-index: 10001;
    }

    .migrate-notification.success { background: #28a745; }
    .migrate-notification.error { background: #dc3545; }
    .migrate-notification.warning { background: #fd7e14; }

    .migrate-notification-title {
      font-weight: bold;
      margin-bottom: 4px;
    }

    .migrate-notification-close {
      position: absolute;
      top: 4px;
      right: 8px;
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
    }
  `;

  function injectStyles() {
    const styleEl = document.createElement("style");
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);
  }

  function getSku() {
    const skuInput = document.querySelector('input[name="product[sku]"]');
    return skuInput ? skuInput.value.trim() : null;
  }

  function showNotification(type, title, message, duration = 5000) {
    const existing = document.querySelector(".migrate-notification");
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement("div");
    notification.className = `migrate-notification ${type}`;
    notification.innerHTML = `
      <button class="migrate-notification-close">&times;</button>
      <div class="migrate-notification-title">${title}</div>
      <div>${message}</div>
    `;

    document.body.appendChild(notification);

    notification
      .querySelector(".migrate-notification-close")
      .addEventListener("click", () => notification.remove());

    if (duration > 0) {
      setTimeout(() => notification.remove(), duration);
    }
  }

  function getSelectedStores() {
    const magentoStores = [];
    const shopifyStores = [];

    document.querySelectorAll('.migrate-store-option input[type="checkbox"]:checked').forEach((checkbox) => {
      const storeCode = checkbox.dataset.storeCode;
      const storeType = checkbox.dataset.storeType;
      if (storeType === "magento") {
        magentoStores.push(storeCode);
      } else if (storeType === "shopify") {
        shopifyStores.push(storeCode);
      }
    });

    return { magentoStores, shopifyStores };
  }

  function migrateToMagento(sku, targetStores, productEnabled) {
    const payload = {
      sku: sku,
      options: {
        includeImages: true,
        createMissingAttributes: true,
        overwriteExisting: false,
        targetStores: targetStores,
        productEnabled: productEnabled,
      },
    };

    GM_xmlhttpRequest({
      method: "POST",
      url: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify(payload),
    });
  }

  function migrateToShopify(sku, shopifyStore, productEnabled) {
    const payload = {
      sku: sku,
      options: {
        includeImages: true,
        shopifyStore: shopifyStore,
        productStatus: productEnabled ? "ACTIVE" : "DRAFT",
      },
    };

    GM_xmlhttpRequest({
      method: "POST",
      url: `${API_BASE_URL}/shopify`,
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify(payload),
    });
  }

  function migrateProduct() {
    const sku = getSku();

    if (!sku) {
      showNotification("error", "Error", "Could not find SKU on this page.");
      return;
    }

    const { magentoStores, shopifyStores } = getSelectedStores();

    if (magentoStores.length === 0 && shopifyStores.length === 0) {
      showNotification("error", "Error", "Please select at least one target store.");
      return;
    }

    const productEnabled = document.getElementById("migrate-product-enabled").checked;

    const targets = [];

    if (magentoStores.length > 0) {
      migrateToMagento(sku, magentoStores, productEnabled);
      targets.push(...magentoStores.map((code) => {
        const store = STORE_CONFIG.magento.find((s) => s.code === code);
        return store ? store.displayName : code;
      }));
    }

    shopifyStores.forEach((shopifyStore) => {
      migrateToShopify(sku, shopifyStore, productEnabled);
      const store = STORE_CONFIG.shopify.find((s) => s.code === shopifyStore);
      targets.push(`Shopify: ${store ? store.displayName : shopifyStore}`);
    });

    showNotification(
      "success",
      "Request Sent",
      `Migration request sent for SKU: ${sku} to: ${targets.join(", ")}`
    );

    // Hide the panel after migration
    const panel = document.querySelector(".migrate-store-panel");
    if (panel) {
      panel.classList.remove("visible");
    }
  }

  function syncPrices() {
    const sku = getSku();

    if (!sku) {
      showNotification("error", "Error", "Could not find SKU on this page.");
      return;
    }

    const { magentoStores, shopifyStores } = getSelectedStores();

    if (magentoStores.length === 0 && shopifyStores.length === 0) {
      showNotification("error", "Error", "Please select at least one target store.");
      return;
    }

    const payload = {
      sku: sku,
      options: {
        targetMagentoStores: magentoStores,
        targetShopifyStores: shopifyStores,
        includeMagento: magentoStores.length > 0,
        includeShopify: shopifyStores.length > 0,
      },
    };

    GM_xmlhttpRequest({
      method: "POST",
      url: "https://product-creation-api.vapewholesaleusa.com/api/v1/sync/prices",
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify(payload),
    });

    const targets = [];
    magentoStores.forEach((code) => {
      const store = STORE_CONFIG.magento.find((s) => s.code === code);
      targets.push(store ? store.displayName : code);
    });
    shopifyStores.forEach((code) => {
      const store = STORE_CONFIG.shopify.find((s) => s.code === code);
      targets.push(`Shopify: ${store ? store.displayName : code}`);
    });

    showNotification(
      "success",
      "Request Sent",
      `Price sync request sent for SKU: ${sku} to: ${targets.join(", ")}`
    );

    // Hide the panel after sync
    const panel = document.querySelector(".migrate-store-panel");
    if (panel) {
      panel.classList.remove("visible");
    }
  }

  function createStorePanel() {
    const panel = document.createElement("div");
    panel.className = "migrate-store-panel";

    // Magento stores section
    const magentoSection = document.createElement("div");
    magentoSection.className = "migrate-store-section";
    magentoSection.innerHTML = '<div class="migrate-store-section-title">Magento Stores</div>';

    STORE_CONFIG.magento.forEach((store) => {
      const option = document.createElement("div");
      option.className = "migrate-store-option";
      option.innerHTML = `
        <input type="checkbox" id="store-${store.code}" data-store-code="${store.code}" data-store-type="magento" checked>
        <label for="store-${store.code}">${store.displayName}</label>
      `;
      magentoSection.appendChild(option);
    });

    panel.appendChild(magentoSection);

    // Shopify stores section
    const shopifySection = document.createElement("div");
    shopifySection.className = "migrate-store-section";
    shopifySection.innerHTML = '<div class="migrate-store-section-title">Shopify Stores</div>';

    STORE_CONFIG.shopify.forEach((store) => {
      const option = document.createElement("div");
      option.className = "migrate-store-option";
      const isChecked = !["ALOHA", "RODMAN"].includes(store.code);
      option.innerHTML = `
        <input type="checkbox" id="store-shopify-${store.code}" data-store-code="${store.code}" data-store-type="shopify" ${isChecked ? "checked" : ""}>
        <label for="store-shopify-${store.code}">${store.displayName}</label>
      `;
      shopifySection.appendChild(option);
    });

    panel.appendChild(shopifySection);

    // Product status option
    const statusSection = document.createElement("div");
    statusSection.className = "migrate-store-section";
    statusSection.innerHTML = `
      <div class="migrate-store-option">
        <input type="checkbox" id="migrate-product-enabled" checked>
        <label for="migrate-product-enabled">Enable product on target stores</label>
      </div>
    `;
    panel.appendChild(statusSection);

    // Action buttons
    const actions = document.createElement("div");
    actions.className = "migrate-actions";
    actions.innerHTML = `
      <button class="migrate-cancel">Cancel</button>
      <button class="migrate-sync-prices">Sync Prices</button>
      <button class="migrate-submit">Migrate</button>
    `;

    actions.querySelector(".migrate-cancel").addEventListener("click", () => {
      panel.classList.remove("visible");
    });

    actions.querySelector(".migrate-sync-prices").addEventListener("click", () => {
      syncPrices();
    });

    actions.querySelector(".migrate-submit").addEventListener("click", () => {
      migrateProduct();
    });

    panel.appendChild(actions);

    return panel;
  }

  function createButton() {
    const container = document.createElement("div");
    container.className = "migrate-btn-container";

    const panel = createStorePanel();
    container.appendChild(panel);

    const button = document.createElement("button");
    button.className = "migrate-btn";
    button.textContent = "Migrate Product";

    button.addEventListener("click", () => {
      panel.classList.toggle("visible");
    });

    container.appendChild(button);
    document.body.appendChild(container);
  }

  function init() {
    injectStyles();
    createButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

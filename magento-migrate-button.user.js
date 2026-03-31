// ==UserScript==
// @name         Magento Product Migration Button
// @namespace    https://vapewholesaleusa.com/
// @version      1.2.0
// @description  Adds a "Migrate Product" button to the Magento admin product edit page
// @author       VWUSA
// @match        https://as.vapewholesaleusa.com/admin_N7zuJfehzDnf/catalog/product/edit/*
// @match        https://x19z7.vapewholesaleusa.com/GAYygQ6cafEK7hZf6uzf/catalog/product/edit/*
// @grant        GM_xmlhttpRequest
// @connect      product-creation-api.vapewholesaleusa.com
// @connect      localhost
// ==/UserScript==

(function () {
  "use strict";

  const API_BASE_URL = "https://product-creation-api.vapewholesaleusa.com";
  //const API_BASE_URL = "http://localhost:3002";
  const API_KEY = "your-api-key-here";

  // Feature flags
  const ENABLE_DELETE_FEATURE = false;

  const STORE_CONFIG = {
    magento: [
      { code: "ejuices", displayName: "ejuices.com" },
      { code: "misthub", displayName: "misthub.com" },
    ],
    shopify: [
      { code: "eliquidcom", displayName: "eliquid.com" },
      { code: "ejuicesco", displayName: "ejuices.co" },
      { code: "vapordna", displayName: "vapordna.com" },
      { code: "aloha", displayName: "aloha.com" },
      { code: "rodman", displayName: "rodman9k.com" },
      { code: "vapejuice", displayName: "vapejuice.com" },
      { code: "test", displayName: "test" },
    ],
  };

  const STYLES = `
    .migrate-btn-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
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

    .migrate-actions .migrate-update-fields {
      background: #17a2b8;
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

    .migrate-btn.generate-desc {
      background: #6f42c1;
      margin-top: 8px;
    }

    .migrate-btn.manage-prompts {
      background: #e83e8c;
      margin-top: 8px;
    }

    .migrate-btn.go-to-parent {
      background: #007bff;
      margin-top: 8px;
    }

    .migrate-btn.go-to-parent:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .migrate-actions .migrate-delete {
      background: #dc3545;
      color: white;
    }

    .migrate-confirm-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 10003;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .migrate-confirm-dialog {
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 420px;
      width: 90%;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }

    .migrate-confirm-dialog h3 {
      margin: 0 0 12px 0;
      color: #dc3545;
      font-size: 18px;
    }

    .migrate-confirm-dialog p {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #333;
    }

    .migrate-confirm-dialog .confirm-store-list {
      margin: 12px 0;
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 4px;
      font-size: 13px;
      color: #555;
    }

    .migrate-confirm-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      justify-content: flex-end;
    }

    .migrate-confirm-actions button {
      padding: 8px 20px;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      cursor: pointer;
    }

    .migrate-confirm-actions .confirm-cancel {
      background: #6c757d;
      color: white;
    }

    .migrate-confirm-actions .confirm-delete {
      background: #dc3545;
      color: white;
    }

    .prompt-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 480px;
      height: 100%;
      background: white;
      box-shadow: -2px 0 12px rgba(0,0,0,0.2);
      z-index: 10002;
      display: none;
      flex-direction: column;
      font-family: Arial, sans-serif;
    }

    .prompt-panel.visible {
      display: flex;
    }

    .prompt-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #eee;
    }

    .prompt-panel-header h3 {
      margin: 0;
      font-size: 16px;
      color: #333;
    }

    .prompt-panel-close {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #666;
    }

    .prompt-panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .prompt-store-item {
      margin-bottom: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 12px;
    }

    .prompt-store-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .prompt-store-name {
      font-weight: bold;
      font-size: 13px;
      color: #333;
    }

    .prompt-store-type {
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
    }

    .prompt-store-item textarea {
      width: 100%;
      min-height: 80px;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 8px;
      font-size: 13px;
      resize: vertical;
      box-sizing: border-box;
      font-family: inherit;
    }

    .prompt-store-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
    }

    .prompt-save-btn {
      background: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 6px 16px;
      font-size: 12px;
      cursor: pointer;
    }

    .prompt-save-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .prompt-loading {
      text-align: center;
      padding: 40px;
      color: #999;
      font-size: 14px;
    }

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

  function isStandaloneProduct() {
    const visibilitySelect = document.querySelector('select[name="product[visibility]"]');
    const configurableMatrix = document.querySelector('[data-index="configurable-matrix"]');

    const visibilityIsNotHidden = visibilitySelect && visibilitySelect.value !== "1";
    const hasNoConfigurations = !configurableMatrix || configurableMatrix.style.display === "none";

    return visibilityIsNotHidden && hasNoConfigurations;
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
        targetMagentoStores: targetStores,
        productEnabled: productEnabled,
      },
    };
    const url = `${API_BASE_URL}/api/v1/migrate/product`;
    console.log("[Migrate] POST to Magento:", url);
    console.log("[Migrate] Payload:", JSON.stringify(payload, null, 2));

    GM_xmlhttpRequest({
      method: "POST",
      url: url,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      data: JSON.stringify(payload),
      onload: (response) => {
        console.log("[Migrate] Magento response status:", response.status);
        console.log("[Migrate] Magento response:", response.responseText);
      },
      onerror: (error) => {
        console.error("[Migrate] Magento error:", error);
      },
    });
  }

  function migrateToShopify(sku, shopifyStore, productEnabled) {
    const url = `${API_BASE_URL}/api/v1/migrate/product/shopify`;
    const payload = {
      sku: sku,
      options: {
        includeImages: true,
        shopifyStore: shopifyStore,
        productStatus: productEnabled ? "ACTIVE" : "DRAFT",
      },
    };

    console.log("[Migrate] POST to Shopify:", url);
    console.log("[Migrate] Payload:", JSON.stringify(payload, null, 2));

    GM_xmlhttpRequest({
      method: "POST",
      url: url,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      data: JSON.stringify(payload),
      onload: (response) => {
        console.log("[Migrate] Shopify response status:", response.status);
        console.log("[Migrate] Shopify response:", response.responseText);
      },
      onerror: (error) => {
        console.error("[Migrate] Shopify error:", error);
      },
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

    const url = `${API_BASE_URL}/api/v1/sync/prices`;
    const payload = {
      sku: sku,
      options: {
        targetMagentoStores: magentoStores,
        targetShopifyStores: shopifyStores,
        includeMagento: magentoStores.length > 0,
        includeShopify: shopifyStores.length > 0,
      },
    };

    console.log("[SyncPrices] POST to:", url);
    console.log("[SyncPrices] Payload:", JSON.stringify(payload, null, 2));

    GM_xmlhttpRequest({
      method: "POST",
      url: url,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      data: JSON.stringify(payload),
      onload: (response) => {
        console.log("[SyncPrices] Response status:", response.status);
        console.log("[SyncPrices] Response:", response.responseText);
      },
      onerror: (error) => {
        console.error("[SyncPrices] Error:", error);
      },
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

  function updateProductFields() {
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

    const url = `${API_BASE_URL}/api/v1/sync/product-fields`;
    const payload = {
      sku: sku,
      options: {
        targetMagentoStores: magentoStores,
        targetShopifyStores: shopifyStores,
        includeMagento: magentoStores.length > 0,
        includeShopify: shopifyStores.length > 0,
      },
    };

    console.log("[UpdateFields] POST to:", url);
    console.log("[UpdateFields] Payload:", JSON.stringify(payload, null, 2));

    GM_xmlhttpRequest({
      method: "POST",
      url: url,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      data: JSON.stringify(payload),
      onload: (response) => {
        console.log("[UpdateFields] Response status:", response.status);
        console.log("[UpdateFields] Response:", response.responseText);
      },
      onerror: (error) => {
        console.error("[UpdateFields] Error:", error);
      },
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
      `Product fields update request sent for SKU: ${sku} to: ${targets.join(", ")}`
    );

    // Hide the panel after update
    const panel = document.querySelector(".migrate-store-panel");
    if (panel) {
      panel.classList.remove("visible");
    }
  }

  function deleteProductFromStore(sku, platform, storeName) {
    let url = `${API_BASE_URL}/api/v1/products/${encodeURIComponent(sku)}?platform=${platform}`;
    if (storeName) {
      url += `&storeName=${storeName}`;
    }

    console.log("[Delete] DELETE:", url);

    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "DELETE",
        url: url,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        onload: (response) => {
          console.log("[Delete] Response status:", response.status);
          console.log("[Delete] Response:", response.responseText);
          if (response.status >= 200 && response.status < 300) {
            resolve(JSON.parse(response.responseText));
          } else {
            reject(`HTTP ${response.status}: ${response.responseText}`);
          }
        },
        onerror: (error) => {
          console.error("[Delete] Error:", error);
          reject(error);
        },
      });
    });
  }

  function showDeleteConfirmation() {
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

    const targetNames = [];
    magentoStores.forEach((code) => {
      const store = STORE_CONFIG.magento.find((s) => s.code === code);
      targetNames.push(store ? store.displayName : code);
    });
    shopifyStores.forEach((code) => {
      const store = STORE_CONFIG.shopify.find((s) => s.code === code);
      targetNames.push(`Shopify: ${store ? store.displayName : code}`);
    });

    const overlay = document.createElement("div");
    overlay.className = "migrate-confirm-overlay";
    overlay.innerHTML = `
      <div class="migrate-confirm-dialog">
        <h3>Delete Product</h3>
        <p>Are you sure you want to delete <strong>${sku}</strong> from the following stores?</p>
        <div class="confirm-store-list">${targetNames.join("<br>")}</div>
        <p>This action cannot be undone. Configurable products will have all child variants deleted as well.</p>
        <div class="migrate-confirm-actions">
          <button class="confirm-cancel">Cancel</button>
          <button class="confirm-delete">Delete</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector(".confirm-cancel").addEventListener("click", () => {
      overlay.remove();
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    overlay.querySelector(".confirm-delete").addEventListener("click", () => {
      overlay.remove();
      executeDelete(sku, magentoStores, shopifyStores, targetNames);
    });
  }

  function executeDelete(sku, magentoStores, shopifyStores, targetNames) {
    const promises = [];

    magentoStores.forEach((storeName) => {
      promises.push(
        deleteProductFromStore(sku, "target-magento", storeName)
          .then(() => ({ store: storeName, success: true }))
          .catch((err) => ({ store: storeName, success: false, error: err }))
      );
    });

    shopifyStores.forEach((storeName) => {
      promises.push(
        deleteProductFromStore(sku, "target-shopify", storeName)
          .then(() => ({ store: storeName, success: true }))
          .catch((err) => ({ store: storeName, success: false, error: err }))
      );
    });

    showNotification("warning", "Deleting...", `Deleting ${sku} from ${targetNames.join(", ")}`, 0);

    Promise.all(promises).then((results) => {
      const succeeded = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      if (failed.length === 0) {
        showNotification(
          "success",
          "Deleted",
          `Successfully deleted ${sku} from ${targetNames.join(", ")}`
        );
      } else if (succeeded.length === 0) {
        showNotification(
          "error",
          "Delete Failed",
          `Failed to delete ${sku} from all stores. Check console for details.`
        );
      } else {
        showNotification(
          "warning",
          "Partial Delete",
          `Deleted from: ${succeeded.map((r) => r.store).join(", ")}. Failed: ${failed.map((r) => r.store).join(", ")}`,
          0
        );
      }
    });

    const panel = document.querySelector(".migrate-store-panel");
    if (panel) {
      panel.classList.remove("visible");
    }
  }

  function fetchParentProduct(sku, callback) {
    const url = `${API_BASE_URL}/api/v1/products/${encodeURIComponent(sku)}/parent`;
    console.log("[Parent] GET:", url);

    GM_xmlhttpRequest({
      method: "GET",
      url: url,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      onload: (response) => {
        console.log("[Parent] Response status:", response.status);
        console.log("[Parent] Response:", response.responseText);
        if (response.status >= 200 && response.status < 300) {
          const result = JSON.parse(response.responseText);
          callback(null, result.data);
        } else {
          callback(`Failed to fetch parent: HTTP ${response.status}`);
        }
      },
      onerror: (error) => {
        console.error("[Parent] Error:", error);
        callback("Failed to fetch parent product");
      },
    });
  }

  function goToParentProduct(button) {
    const sku = getSku();
    if (!sku) {
      showNotification("error", "Error", "Could not find SKU on this page.");
      return;
    }

    button.disabled = true;
    button.textContent = "Finding Parent...";

    fetchParentProduct(sku, (err, data) => {
      if (err) {
        showNotification("error", "Error", err);
        button.disabled = false;
        button.textContent = "Go to Parent Product";
        return;
      }

      if (!data.isVariant) {
        showNotification("warning", "Not a Variant", data.message || "This product is not a variant.");
        button.disabled = false;
        button.textContent = "Go to Parent Product";
        return;
      }

      if (!data.parentFound || !data.parent || !data.parent.adminUrl) {
        showNotification("warning", "Parent Not Found", data.message || "Could not find parent product.");
        button.disabled = false;
        button.textContent = "Go to Parent Product";
        return;
      }

      showNotification("success", "Parent Found", `Navigating to parent: ${data.parent.sku}`);
      window.location.href = data.parent.adminUrl;
    });
  }

  function generateDescription() {
    const sku = getSku();

    if (!sku) {
      showNotification("error", "Error", "Could not find SKU on this page.");
      return;
    }

    const url = `${API_BASE_URL}/api/v1/products/generate-description`;
    const payload = { sku: sku };

    console.log("[GenerateDescription] POST to:", url);
    console.log("[GenerateDescription] Payload:", JSON.stringify(payload, null, 2));

    GM_xmlhttpRequest({
      method: "POST",
      url: url,
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      data: JSON.stringify(payload),
      onload: (response) => {
        console.log("[GenerateDescription] Response status:", response.status);
        console.log("[GenerateDescription] Response:", response.responseText);
        if (response.status >= 200 && response.status < 300) {
          showNotification("success", "Request Sent", `Description generation requested for SKU: ${sku}`);
        } else {
          showNotification("error", "Error", `Failed to generate description: ${response.status}`);
        }
      },
      onerror: (error) => {
        console.error("[GenerateDescription] Error:", error);
        showNotification("error", "Error", "Failed to send generate description request.");
      },
    });
  }

  function fetchPrompts(callback) {
    const url = `${API_BASE_URL}/api/v1/prompts`;
    console.log("[Prompts] GET:", url);

    GM_xmlhttpRequest({
      method: "GET",
      url: url,
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      onload: (response) => {
        console.log("[Prompts] Response status:", response.status);
        console.log("[Prompts] Response:", response.responseText);
        if (response.status >= 200 && response.status < 300) {
          const result = JSON.parse(response.responseText);
          callback(null, result.data || []);
        } else {
          callback("Failed to fetch prompts: " + response.status);
        }
      },
      onerror: (error) => {
        console.error("[Prompts] Error:", error);
        callback("Failed to fetch prompts");
      },
    });
  }

  function savePrompt(storeCode, promptText, callback) {
    const url = `${API_BASE_URL}/api/v1/prompts/${storeCode}`;
    const payload = { prompt: promptText };
    console.log("[Prompts] POST:", url);
    console.log("[Prompts] Payload:", JSON.stringify(payload, null, 2));

    GM_xmlhttpRequest({
      method: "POST",
      url: url,
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      data: JSON.stringify(payload),
      onload: (response) => {
        console.log("[Prompts] Save response status:", response.status);
        console.log("[Prompts] Save response:", response.responseText);
        if (response.status >= 200 && response.status < 300) {
          callback(null);
        } else {
          callback("Failed to save prompt: " + response.status);
        }
      },
      onerror: (error) => {
        console.error("[Prompts] Save error:", error);
        callback("Failed to save prompt");
      },
    });
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
      const isChecked = !["vapordna", "aloha", "rodman", "test", "vapejuice"].includes(store.code);
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
      ${ENABLE_DELETE_FEATURE ? '<button class="migrate-delete">Delete</button>' : ''}
      <button class="migrate-sync-prices">Sync Prices</button>
      <button class="migrate-update-fields">Update Fields</button>
      <button class="migrate-submit">Migrate</button>
    `;

    actions.querySelector(".migrate-cancel").addEventListener("click", () => {
      panel.classList.remove("visible");
    });

    if (ENABLE_DELETE_FEATURE) {
      actions.querySelector(".migrate-delete").addEventListener("click", () => {
        showDeleteConfirmation();
      });
    }

    actions.querySelector(".migrate-sync-prices").addEventListener("click", () => {
      syncPrices();
    });

    actions.querySelector(".migrate-update-fields").addEventListener("click", () => {
      updateProductFields();
    });

    actions.querySelector(".migrate-submit").addEventListener("click", () => {
      migrateProduct();
    });

    panel.appendChild(actions);

    return panel;
  }

  function updateButtonState(button) {
    const configurableMatrix = document.querySelector('[data-index="configurable-matrix"]');
    const hasConfigurations = configurableMatrix && configurableMatrix.style.display !== "none";
    const visibilitySelect = document.querySelector('select[name="product[visibility]"]');
    const isVariant = visibilitySelect && visibilitySelect.value === "1" && !hasConfigurations;

    const parentBtn = document.querySelector(".migrate-btn.go-to-parent");

    if (hasConfigurations) {
      button.textContent = "Migrate Configurable Product";
      button.disabled = false;
      if (parentBtn) parentBtn.style.display = "none";
    } else if (isVariant) {
      button.textContent = "Cant Migrate Single Variant";
      button.disabled = true;
      if (parentBtn) parentBtn.style.display = "";
    } else if (isStandaloneProduct()) {
      button.textContent = "Migrate Standalone Product";
      button.disabled = false;
      if (parentBtn) parentBtn.style.display = "none";
    } else {
      button.textContent = "Migrate Product";
      button.disabled = false;
      if (parentBtn) parentBtn.style.display = "none";
    }
  }

  function waitForProductRender(button) {
    const CHECK_INTERVAL = 300;
    const MAX_WAIT = 15000;
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += CHECK_INTERVAL;
      const visibilitySelect = document.querySelector('select[name="product[visibility]"]');
      const configurableMatrix = document.querySelector('[data-index="configurable-matrix"]');

      const isReady = visibilitySelect && visibilitySelect.value !== "" && configurableMatrix;

      if (isReady || elapsed >= MAX_WAIT) {
        clearInterval(interval);
        updateButtonState(button);
      }
    }, CHECK_INTERVAL);
  }

  function createPromptPanel() {
    const panel = document.createElement("div");
    panel.className = "prompt-panel";

    const header = document.createElement("div");
    header.className = "prompt-panel-header";
    header.innerHTML = '<h3>AI Prompt Management</h3>';

    const closeBtn = document.createElement("button");
    closeBtn.className = "prompt-panel-close";
    closeBtn.textContent = "\u00d7";
    closeBtn.addEventListener("click", () => {
      panel.classList.remove("visible");
    });
    header.appendChild(closeBtn);
    panel.appendChild(header);

    const body = document.createElement("div");
    body.className = "prompt-panel-body";
    body.innerHTML = '<div class="prompt-loading">Loading prompts...</div>';
    panel.appendChild(body);

    panel.loadPrompts = function () {
      body.innerHTML = '<div class="prompt-loading">Loading prompts...</div>';

      fetchPrompts((err, prompts) => {
        if (err) {
          body.innerHTML = '<div class="prompt-loading">Failed to load prompts.</div>';
          showNotification("error", "Error", err);
          return;
        }

        const promptMap = {};
        prompts.forEach((p) => {
          promptMap[p.store_name] = p.prompt_text || "";
        });

        body.innerHTML = "";

        const allStores = [
          ...STORE_CONFIG.magento.map((s) => ({ ...s, type: "magento" })),
          ...STORE_CONFIG.shopify.map((s) => ({ ...s, type: "shopify" })),
        ];

        allStores.forEach((store) => {
          const item = document.createElement("div");
          item.className = "prompt-store-item";

          const storeHeader = document.createElement("div");
          storeHeader.className = "prompt-store-header";
          storeHeader.innerHTML = `
            <span class="prompt-store-name">${store.displayName}</span>
            <span class="prompt-store-type">${store.type}</span>
          `;
          item.appendChild(storeHeader);

          const textarea = document.createElement("textarea");
          textarea.value = promptMap[store.code] || "";
          textarea.placeholder = "Enter AI prompt for this store...";
          item.appendChild(textarea);

          const actions = document.createElement("div");
          actions.className = "prompt-store-actions";

          const saveBtn = document.createElement("button");
          saveBtn.className = "prompt-save-btn";
          saveBtn.textContent = "Save";
          saveBtn.addEventListener("click", () => {
            saveBtn.disabled = true;
            saveBtn.textContent = "Saving...";

            savePrompt(store.code, textarea.value, (saveErr) => {
              saveBtn.disabled = false;
              saveBtn.textContent = "Save";
              if (saveErr) {
                showNotification("error", "Error", saveErr);
              } else {
                showNotification("success", "Saved", `Prompt saved for ${store.displayName}`);
              }
            });
          });

          actions.appendChild(saveBtn);
          item.appendChild(actions);
          body.appendChild(item);
        });
      });
    };

    return panel;
  }

  function createButton() {
    const container = document.createElement("div");
    container.className = "migrate-btn-container";

    const panel = createStorePanel();
    container.appendChild(panel);

    const button = document.createElement("button");
    button.className = "migrate-btn";
    button.textContent = "Loading...";
    button.disabled = true;

    waitForProductRender(button);

    button.addEventListener("click", () => {
      panel.classList.toggle("visible");
    });

    container.appendChild(button);

    const goToParentBtn = document.createElement("button");
    goToParentBtn.className = "migrate-btn go-to-parent";
    goToParentBtn.textContent = "Go to Parent Product";
    goToParentBtn.style.display = "none";
    goToParentBtn.addEventListener("click", () => {
      goToParentProduct(goToParentBtn);
    });
    container.appendChild(goToParentBtn);

    const generateDescBtn = document.createElement("button");
    generateDescBtn.className = "migrate-btn generate-desc";
    generateDescBtn.textContent = "Generate Description";
    generateDescBtn.addEventListener("click", () => {
      generateDescription();
    });

    container.appendChild(generateDescBtn);

    const promptPanel = createPromptPanel();
    document.body.appendChild(promptPanel);

    const managePromptsBtn = document.createElement("button");
    managePromptsBtn.className = "migrate-btn manage-prompts";
    managePromptsBtn.textContent = "Manage Prompts";
    managePromptsBtn.addEventListener("click", () => {
      promptPanel.classList.toggle("visible");
      if (promptPanel.classList.contains("visible")) {
        promptPanel.loadPrompts();
      }
    });

    container.appendChild(managePromptsBtn);
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

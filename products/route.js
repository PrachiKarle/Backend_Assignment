const express = require("express");
const router = express.Router();

//vendor json data
const vendorA = require("../services/vendorA");
const vendorB = require("../services/vendorB");

//cache
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 60 });

//validation
function validateSKU(sku) {
  const regex = /^[a-zA-Z0-9]{3,20}$/;
  return regex.test(sku);
}

router.get("/:sku", async (req, res) => {
  const sku = req.params.sku;

  // 1. Validate SKU
  const { error } = validateSKU(sku);
  if (error) {
    return res.status(400).json({ error: "Invalid SKU" });
  }

  // 2. Check cache
  const cached = cache.get(sku);
  if (cached) {
    return res.json(cached);
  }

  // 3. Call both vendors in parallel
  const [vA, vB] = await Promise.allSettled([
    vendorA.getProduct(sku),
    vendorB.getProduct(sku)
  ]);

  const results = [];

  // ------------------------
  // Vendor A Normalization
  // ------------------------
  if (vA.status === "fulfilled" && vA.value) {
    const raw = vA.value;

    const stock =
      raw.inventory === null && raw.status === "IN_STOCK"
        ? 5
        : raw.inventory > 0
        ? raw.inventory
        : 0;

    const price =
      typeof raw.price_usd === "number" && raw.price_usd > 0
        ? raw.price_usd
        : null;

    if (price) {
      results.push({ vendor: "A", stock, price });
    }
  }

  // ------------------------
  // Vendor B Normalization
  // ------------------------
  if (vB.status === "fulfilled" && vB.value) {
    const raw = vB.value;

    const stock = raw.stock_count > 0 ? raw.stock_count : 0;

    const price =
      typeof raw.amount === "number" && raw.amount > 0 ? raw.amount : null;

    if (price) {
      results.push({ vendor: "B", stock, price });
    }
  }

  // 4. Best vendor selection
  const available = results.filter((v) => v.stock > 0);

  if (available.length === 0) {
    const response = { sku, status: "OUT_OF_STOCK" };
    cache.set(sku, response);
    return res.json(response);
  }

  // lowest price wins
  const best = available.sort((a, b) => a.price - b.price)[0];

  const response = {
    sku,
    status: "AVAILABLE",
    vendor: best.vendor,
    price: best.price,
    stock: best.stock
  };

  // 5. Save in cache
  cache.set(sku, response);

  res.json(response);
});

module.exports = router;
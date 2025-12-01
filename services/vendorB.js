const vendorBData = require("../mock/vendorB.json");

exports.getProduct=async(sku)=>{
    return vendorBData[sku];
}
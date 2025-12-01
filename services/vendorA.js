const vendorAData = require("../mock/vendorA.json");

exports.getProduct=async(sku)=>{
    return vendorAData[sku];
}
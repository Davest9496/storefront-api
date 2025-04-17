"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentStatus = exports.PaymentProvider = exports.ProductCategory = exports.OrderStatus = void 0;
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["ACTIVE"] = "active";
    OrderStatus["COMPLETE"] = "complete";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var ProductCategory;
(function (ProductCategory) {
    ProductCategory["HEADPHONES"] = "headphones";
    ProductCategory["SPEAKERS"] = "speakers";
    ProductCategory["EARPHONES"] = "earphones";
})(ProductCategory || (exports.ProductCategory = ProductCategory = {}));
var PaymentProvider;
(function (PaymentProvider) {
    PaymentProvider["STRIPE"] = "stripe";
    PaymentProvider["PAYPAL"] = "paypal";
})(PaymentProvider || (exports.PaymentProvider = PaymentProvider = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["FAILED"] = "failed";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));

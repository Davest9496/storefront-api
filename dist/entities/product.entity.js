"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../types/enums");
const order_product_entity_1 = require("./order-product.entity");
let Product = class Product {
    // Calculate is_new based on createdAt date - this happens after loading from DB
    updateIsNew() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        this.isNew = this.createdAt > thirtyDaysAgo;
    }
    // Set isNew to true for new products by default
    setIsNewOnInsert() {
        this.isNew = true;
    }
};
exports.Product = Product;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ length: 50 }),
    __metadata("design:type", String)
], Product.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_name', length: 100 }),
    __metadata("design:type", String)
], Product.prototype, "productName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Product.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_products_category'),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.ProductCategory,
    }),
    __metadata("design:type", String)
], Product.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_desc', length: 250, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "productDesc", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_name', length: 255 }),
    __metadata("design:type", String)
], Product.prototype, "imageName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_features', type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], Product.prototype, "productFeatures", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_accessories', type: 'text', array: true, nullable: true }),
    __metadata("design:type", Array)
], Product.prototype, "productAccessories", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Product.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Product.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_new', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Product.prototype, "isNew", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_product_entity_1.OrderProduct, (orderProduct) => orderProduct.product),
    __metadata("design:type", Array)
], Product.prototype, "orderProducts", void 0);
__decorate([
    (0, typeorm_1.AfterLoad)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Product.prototype, "updateIsNew", null);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Product.prototype, "setIsNewOnInsert", null);
exports.Product = Product = __decorate([
    (0, typeorm_1.Entity)({ name: 'products' })
], Product);

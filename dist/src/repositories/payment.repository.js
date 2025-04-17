"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRepository = exports.PaymentRepository = void 0;
const typeorm_1 = require("typeorm");
const payment_entity_1 = require("../entities/payment.entity");
const database_1 = __importDefault(require("../config/database"));
class PaymentRepository extends typeorm_1.Repository {
    constructor() {
        super(payment_entity_1.Payment, database_1.default.manager);
    }
    async findByOrderId(orderId) {
        return this.findOne({
            where: { orderId },
            relations: ['order'],
        });
    }
    async findByProviderTransactionId(providerTransactionId) {
        return this.findOne({
            where: { providerTransactionId },
        });
    }
    async getPaymentsByStatus(status) {
        return this.find({
            where: { status },
            relations: ['order'],
            order: { createdAt: 'DESC' },
        });
    }
    async getPaymentsByProvider(provider) {
        return this.find({
            where: { provider },
            relations: ['order'],
            order: { createdAt: 'DESC' },
        });
    }
}
exports.PaymentRepository = PaymentRepository;
// Export a singleton instance
exports.paymentRepository = new PaymentRepository();

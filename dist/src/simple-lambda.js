"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = __importDefault(require("./utils/logger"));
const handler = async (event, context) => {
    logger_1.default.info('Event:', JSON.stringify(event));
    logger_1.default.info('Context:', JSON.stringify(context));
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Hello from Lambda!',
            path: event.path,
            method: event.httpMethod,
            timestamp: new Date().toISOString(),
        }),
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
        },
    };
};
exports.handler = handler;

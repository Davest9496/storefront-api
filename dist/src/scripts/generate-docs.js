"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const swagger_1 = __importDefault(require("../config/swagger"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Script to generate OpenAPI documentation as JSON file
 */
async function generateDocs() {
    try {
        // Create docs directory if it doesn't exist
        const docsDir = path_1.default.join(process.cwd(), 'docs');
        if (!fs_1.default.existsSync(docsDir)) {
            fs_1.default.mkdirSync(docsDir);
        }
        // Write swagger.json file
        const outputPath = path_1.default.join(docsDir, 'swagger.json');
        fs_1.default.writeFileSync(outputPath, JSON.stringify(swagger_1.default, null, 2));
        logger_1.default.info(`✅ OpenAPI documentation generated: ${outputPath}`);
    }
    catch (error) {
        logger_1.default.error('Error generating OpenAPI documentation:', error);
        process.exit(1);
    }
}
// Run the script if this file is executed directly
if (require.main === module) {
    generateDocs()
        .then(() => {
        process.exit(0);
    })
        .catch((error) => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}
exports.default = generateDocs;

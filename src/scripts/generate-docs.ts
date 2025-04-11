import fs from 'fs';
import path from 'path';
import swaggerSpec from '../config/swagger';
import logger from '../utils/logger';

/**
 * Script to generate OpenAPI documentation as JSON file
 */
async function generateDocs(): Promise<void> {
  try {
    // Create docs directory if it doesn't exist
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir);
    }

    // Write swagger.json file
    const outputPath = path.join(docsDir, 'swagger.json');
    fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));

    logger.info(`✅ OpenAPI documentation generated: ${outputPath}`);
  } catch (error) {
    logger.error('Error generating OpenAPI documentation:', error);
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

export default generateDocs;

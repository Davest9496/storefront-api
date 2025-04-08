import app from './app';
import logger from './utils/logger';

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  logger.info(`Server started on port ${port}`);
});

app.get('/', (_req, res) => {
  res.send('Hello, World!');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

export default server;

import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { authRouter } from '../server/routes/auth';
import { healthRouter, companyRouter } from '../server/routes/company';
import { statsRouter } from '../server/routes/stats';
import { quotesRouter } from '../server/routes/quotes';
import { contactRouter } from '../server/routes/contact';
import { portfolioRouter } from '../server/routes/portfolio';
import { servicesRouter } from '../server/routes/services';
import { pricesRouter } from '../server/routes/prices';
import { auditRouter } from '../server/routes/audit';
import { globalErrorHandler } from '../server/middleware/errorHandler';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Sub-routers
app.use('/api/auth', authRouter);
app.use('/api/health', healthRouter);
app.use('/api/company', companyRouter);
app.use('/api/stats', statsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/contact', contactRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/services', servicesRouter);
app.use('/api/prices', pricesRouter);
app.use('/api/audit', auditRouter);

// Fallback for unmatched /api routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Endpoint API introuvable : ${req.method} ${req.originalUrl}`,
  });
});

app.use(globalErrorHandler);

export default app;

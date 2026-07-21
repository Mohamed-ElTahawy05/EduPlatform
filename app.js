const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const globalErrorHandler = require('./controllers/errorController');
const ApiError = require('./utils/ApiError');

const gradeRouter = require('./routes/gradeRoutes');
const courseRouter = require('./routes/courseRoutes');
const lessonRouter = require('./routes/lessonRoutes');
const authRouter = require('./routes/authRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) GLOBAL MIDDLEWARES
app.use(cors());
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
    whitelist: [
        'duration', 'marks', 'NumberQuestions'
    ]
}));

// Compress responses
app.use(compression());

// 2) ROUTES
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/grades', gradeRouter);
app.use('/api/v1/courses', courseRouter);
app.use('/api/v1/lessons', lessonRouter);

app.use((req, res, next) => {
    next(new ApiError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

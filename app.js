import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import {config} from 'dotenv';
import userRoutes from './routes/user.routes.js';
import errorMiddleware from './middlewares/error.middleware.js';
import courseRoutes from './routes/course.routes.js';
import miscRoutes from './routes/miscellaneous.routes.js'
import paymentRoutes from './routes/payment.routes.js'

config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// app.use(cors({
//     origin:[process.env.FRONTEND_URL],
//     credentials:true
// }));

app.use(cors({
    origin: "https://lms-frontend-phi-lemon.vercel.app/",
    credentials: true
}));

app.get('/ping',(_req,res)=>{
    res.send('pong');
});

app.use('/api/v1/user',userRoutes);

app.use('/api/v1/course',courseRoutes);

app.use('/api/v1/payments',paymentRoutes);

app.use('/api/v1', miscRoutes);

app.all('*',(_req,res)=>{
    res.status(404).send('OOPS!! Page Not Found');
});

app.use(errorMiddleware);

export default app;



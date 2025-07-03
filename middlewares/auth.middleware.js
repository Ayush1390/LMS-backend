import AppError from "../utils/error.util.js";
import jwt from 'jsonwebtoken';
// import { isBlacklisted } from './blacklist.js';

// export const isLoggedIn = async (req,res,next)=>{
//     const token =  req.cookies.token;
//     console.log(token);

//     if(!token){
//         return next(new AppError('unauthorized access!! login again',401));
//     }

//     // if (isBlacklisted(token)) {
//     //     return next(new AppError('Token is blacklisted. Unauthorized access!! Login again', 401));
//     //   }

//     const userDetails = await jwt.verify(token, process.env.JWT_SECRET);
//     if(!userDetails){
//         return next(new AppError('unauthorized',400));
//     }
//     req.user = userDetails;
//     next();
// }


export const isLoggedIn = async (req, res, next) => {
    const token = req.cookies && req.cookies.token;
    if (!token) {
        return next(new AppError('Unauthorized access! Please login again.', 401));
    }

    try {
        const userDetails = await jwt.verify(token, process.env.JWT_SECRET);
        if (!userDetails) {
            return next(new AppError('Unauthorized access!Please login again', 401));
        }
        req.user = userDetails;
        next();
    } catch (error) {
        return next(new AppError('Unauthorized access!Please login again', 401));
    }
};


export const authorizedRoles = (...roles)=>(req,res,next)=>{
    const currentUserRole = req.user.role;
    if(!roles.includes(currentUserRole)){
        return next(new AppError('Unauthorized access! You are not allowed to access this route',403));
    }
    next();

}


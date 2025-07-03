import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";
import cloudinary from 'cloudinary';
import fs from 'fs/promises';
import sendEmail from '../utils/sendEmail.js'; 
import crypto from 'crypto';
import Course from "../models/course.model.js";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
// import { addToBlacklist } from '../middlewares/blacklist.js';


const cookieOptions={
    maxAge:7*24*60*60*1000,
    httpOnly:true,
    secure:true
};

export const login = async (req,res,next)=>{
    try {
        const {email,password} = req.body;
        if(!email || !password){
            return next(new AppError('all feilds are mandatory',400));
        }
        const user = await User.findOne({email}).select('+password');
        if (!(user && (await user.comparePassword(password)))) {
    	        return next(
      	            new AppError('Email or Password do not match or user does not exist', 401)
    	        );
  	    };

        const token = await user.generateJwtToken();
	    user.password=undefined;
        res.cookie('token',token,cookieOptions);

        res.status(200).json({
            sucess:true,
            message:'logged in sucessfully',
            user
        });
    } catch (error) {
        return next(new AppError(`${error.message}`,400));
    };
    
};


//while testing in thunder client -> in header -> header is Cookie and value is token=....token(token is copied from login response header) 
export const logout = (req,res)=>{

    const token = req.cookies.token;
    if(token){
        // addToBlacklist(token);
        console.log(token);
        res.cookie('token',null,{
            maxAge:0,
            httpOnly:true,
            secure:true
        });
        res.status(200).json({
            sucess:true,
            message:'user logged out'
        });
    }
    else{
        res.status(400).json({
            sucess:false,
            message:'token expired or not provided'
        });
    }
};




export const register = async (req,res,next)=>{
    const {fullName,email,password} = await req.body;
    if(!fullName || !email || !password){
        return next(new AppError('all feilds are mandatory',400));
    }
    const userExist = await User.findOne({email});
    if(userExist){
        return next(new AppError('email already exists',400));
    }
    const user = await User.create({
        fullName,
        email,
        password,
        avatar:{
            public_id:email,
            secure_url:'secureurl'
        },
        subscription:{
            id:'',
            status:'Inactive'
        }
    });
    if(!user){
        return next(new AppError('user registration failed',400));
    }

    if(req.file){

        console.log(req.file);

        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder:'lms',
                width:250,
                height:250,
                gravity:'faces',
                crop:'fill'
            })

            if(result){
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url;

                fs.rm(`uploads/${req.file.filename}`);

            }
        } catch (error) {
            return next(new AppError(error || 'file upload failed',500));
        }
    }

    await user.save();

    const token = await user.generateJwtToken();
    user.password=undefined;
    res.cookie('token',token,cookieOptions);

    res.status(200).json({
        sucess:true,
        message:'registration sucessfull',
        user
    });
};


//while testing in thunder client -> in header -> header is Cookie and value is token=....token(token is copied from login response header) 
export const profile = async (req,res,next)=>{
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            sucess:true,
            message:'user details',
            user
        })   
    } catch (error) {
        return next(new AppError('failed to fetch user detail',500));
    }

};



export const forgotPassword = async (req,res,next)=>{
    const {email} = req.body;
    if(!email){
        return next(new AppError('email is required',400));
    }
    const user = await User.findOne({email});
    if(!user){
        return next(new AppError('email not registered',400));
    }
    const resetToken = await user.generatePasswordResetToken();
    
    await user.save();

    const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    console.log(resetToken);

    const subject = 'Reset Password';
    const message = `You can reset your password by clicking <a href=${resetPasswordURL} target="_blank">Reset your password</a>\n If the above link does not work for some reason then copy paste this link in new tab ${resetPasswordURL}.\n If you have not requested this, kindly ignore.`;

    try {
        await sendEmail(email,subject,message);
        res.status(200).json({
            success:true,
            message:`reset password token has been sent to ${email} sucessfully`
        })
    } catch (error) {
        user.forgetPasswordExpiry=undefined;
        user.forgetPasswordToken=undefined;
        return next(new AppError(`${error.message}`,400));
    }

}



export const resetPassword = async (req,res,next)=>{
    const {resetToken} = req.params;
    const {password} = req.body;

    const forgetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');


    const user = await User.findOne({
        forgetPasswordToken,
        forgetPasswordExpiry:{$gt : Date.now()}
    })

    if(!user){
        return next(new AppError('token is invalid or expired',400));
    }

    user.password=password;
    user.forgetPasswordExpiry=undefined;
    user.forgetPasswordToken=undefined;

    await user.save();

    res.status(200).json({
        success:true,
        message:'password changed sucessfully'
    })

}



export const changePassword = async (req,res,next)=>{
    const {oldPassword,newPassword} = req.body;
    const {id} = req.user;

    if(!oldPassword || !newPassword){
        return next(new AppError('all feilds are mandatory',400));
    }

    const user = await User.findById(id).select('+password');

    if(!user){
        return next(new AppError('user does not exist',400));
    }

    const isPasswordValid = await user.comparePassword(oldPassword);

    if(!isPasswordValid){
        return next(new AppError('password is wrong',400));
    }

    user.password = newPassword;

    await user.save();

    user.password=undefined;

    res.status(200).json({
        success:true,
        message:'password changed sucessfully'
    })

}



export const updateUser = async (req,res,next)=>{
    const {fullName} = req.body;
    const {id} = req.user;

    const user = await User.findById(id);

    if(!user){
        return next(new AppError('user not found',400))
    }

    if(req.fullName){
        user.fullName=fullName;
    }

    if(req.file){
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);

        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder:'lms',
                height:250,
                width:250,
                gravity:'faces',
                crop:'fill'
            })

            if(result){
                user.avatar.public_id=result.public_id;
                user.avatar.secure_url=result.secure_url;

                fs.rm(`uploads/${req.file.filename}`);
            }

        } catch (error) {
            return next(new AppError('failed to change profile pic',400));            
        }
    }
    await user.save();

    res.status(200).json({
        sucess:true,
        message:'deatils updated sucessfully',
        user
    })
}


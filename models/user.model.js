import {Schema,model} from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'


const userSchema = new Schema({
    fullName:{
        type:String,
        required:[true,'name is required'],
        lowercase:true,
        trim:true
    },
    email:{
        type:String,
        unique:[true,'already exists'],
        required:[true,'email is required'],
        trim:true,
        lowercase:true,
        match:[/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,'email is not in valid format']
    },
    password:{
        type:String,
        required:[true,'password is required'],
        // minLength:[5,'min 5 chars required'],
        // maxLength:[15,'max 15 chars required'],
        select:false
    },
    subscription:{
        id:String,
        status:String
    },
    avatar:{
        public_id:{
            type:String
        },
        secure_url:{
            type:String
        }
    },
    role:{
        type:String,
        enum:['USER','ADMIN'],
        default:'USER'
    },
    forgetPasswordToken:String,
    forgetPasswordExpiry:Date,
},{
    timestamps:true
})

userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        return next();
    }
    this.password = await bcrypt.hash(this.password,10);
})


userSchema.methods.generateJwtToken = async function(){
    return await jwt.sign(
        {id:this._id,subscription:this.subscription,role:this.role},
        process.env.JWT_SECRET,
        {
            expiresIn:process.env.JWT_EXPIRY
        }
    );
}


userSchema.methods.comparePassword = async function(plainPass){
    return await bcrypt.compare(plainPass,this.password);   
}

userSchema.methods.generatePasswordResetToken = async function(){
    const resetToken = await crypto.randomBytes(20).toString('hex');

    this.forgetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.forgetPasswordExpiry=Date.now() + 15*60*1000;

    return resetToken;
}

const User = model('User',userSchema);
// model('modelName',schemaName,'collectionName')
// modelName -> first letter capital
// if collectionName not specified then collectionName -> plural modelName and firtsletter small
// eg modelName -> User collectionName-> users 
export default User;
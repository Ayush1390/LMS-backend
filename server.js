import app from './app.js';
import connectToDB from './config/dbConnection.js';
import { v2 } from "cloudinary";
import Razorpay from 'razorpay';

const PORT = process.env.PORT || 5000;

v2.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

const razorpay = new Razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_SECRET
})

export default razorpay;


app.listen(PORT,async ()=>{
    await connectToDB();
    console.log(`server running at http://localhost:${PORT}`);      
});

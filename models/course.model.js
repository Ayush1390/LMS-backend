import {model,Schema} from 'mongoose';

const courseSchema = new Schema({
    title:{
        type:String,
        required:[true,'title is required'],
        minLength:[5,'too small'],
        maxLength:[200,'too large'],
        trim:true
    },
    description:{
        type:String,
        required:[true,'title is required'],
        minLength:[10,'too small'],
        maxLength:[2000,'too large'],
    },
    category:{
        type:String
    },
    thumbnail:{
        public_id:{
            type:String
        },
        secure_url:{
            type:String
        },
    },
    lectures:[
        {
            title:String,
            description:String,  
            lecture:{
                public_id:{
                    type:String
                },
                secure_url:{
                    type:String
                }
            }
        },
    ],
    numberOfLectures:{
        type:Number,
        default:0
    },
    createdBy:{
        type:String
    }
},{
    timestamps:true
})

const Course = model('Course',courseSchema);
// model('modelName',schemaName,'collectionName')
// modelName -> first letter capital
// if collectionName not specified then collectionName -> plural modelName and firtsletter small
// eg modelName -> Course collectionName-> courses 
export default Course;


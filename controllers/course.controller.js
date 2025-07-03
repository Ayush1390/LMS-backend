import Course from "../models/course.model.js"
import AppError from "../utils/error.util.js";
import cloudinary from 'cloudinary';
import fs from 'fs/promises';
import path from 'path'

export const getAllCourses = async (req,res,next)=>{
   try {
        const courses = await Course.find({}).select('-lectures');
        // console.log(courses);

        res.status(200).json({
            sucess:true,
            message:'all courses',
            courses
        })
   } catch (error) {
        return next(new AppError(`${error.message}`,400));
   }
}

export const getLecturesByCourseId = async (req,res,next)=>{
    const {id} = req.params;
    if(!id){
        return next(new AppError('id is not provided',400))
    }
    const course = await Course.findById(id);
    if(!course){
        return next(new AppError('course does not exist',400))
    }
    const lectures = course.lectures
    if(lectures.length==0){
        return next(new AppError('no lectures are present in this course',400))
    }
    res.status(200).json({
        sucess:true,
        message:'course lectures',
        lectures
    })
}


export const createCourse = async (req,res,next)=>{
    const {title,description,category,createdBy} = req.body;

    if(!title || !description || !category || !createdBy){
        return next(new AppError('all feilds are mandatory',400));
    }

    const course = await Course.create({
        title,
        description,
        category,
        createdBy,
        thumbnail:{
            public_id:'publicid',
            secure_url:'secureurl'
        }
    })

    if(!course){
        return next(new AppError('failed to create course',400));
    }

    if(req.file){
      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path,{
            folder:'lms',
            height:250,
            width:250,
            crop:'fill'
          })
    
          if(result){
            course.thumbnail.public_id = result.public_id;
            course.thumbnail.secure_url = result.secure_url;
          }

          fs.rm(`uploads/${req.file.filename}`);

      } catch (error) {
        return next(new AppError(`${error.message}`,400));
      }

    }

    await course.save();
    res.status(200).json({
        sucess:true,
        message:'course created',
        course
    })

}


export const updateCourse = async (req,res,next)=>{
    try {
        const {id} = req.params;
        // for findByIdAndUpdate()
        // first parameter -> id
        // second parameter -> {} -> meaning whatever(key val pair) is given in body update those keys vals only  
        // third parameter -> {} -> runValidator :- validate the the incoming data for updation by mongoose model/schema   new :- so that the course returend is with updated informaion insted of original(previous) information. even if we not use this then too info will be updated in db but we will be able to see prev info when the function returns course info
        const course = await Course.findByIdAndUpdate(
            id,
            {
                $set:req.body
            },
            {
                runValidators:true,
                new:true
            }
        );

        if(!course){
            return next(new AppError('course does not exist',400));
        }

        res.status(200).json({
            sucess:true,
            message:'course updated',
            course
        })


    } catch (error) {
        return next(new AppError('failed to update course',400));
    }

}


export const removeCourse = async (req,res,next)=>{
    try {
        const {id} = req.params;
        const course = await Course.findById(id);

        if(!course){
            return next(new AppError('course not found',400));
        }

        await Course.findByIdAndDelete(id);

        res.status(200).json({
            success:true,
            message:'course removed'
        })

    } catch (error) {
        return next(new AppError('failed to remove course',400));
    }

}


// export const addLecturesToCourseById = async (req,res,next)=>{
//     const {title,description} = req.body;

//     const {id} = req.params;

//     if(!title || !description){
//         return next(new AppError('please provide title and description',400));
//     }

//     const course = await Course.findById(id);

//     if(!course){
//         return next(new AppError('course not found',400));
//     }

//     const lectureData = {
//         title,
//         description,
//         lecture:{
//             public_id:'publicid',
//             secure_url:'secureurl'
//         }
//     }

//     if(req.file){
//         try {
//             const result = await cloudinary.v2.uploader.upload(req.file.path,{
//                 folder:'lms',
//                 chunk_size: 50000000, // 50 mb size
//                 resource_type: 'video'
//               })
        
//               if(result){
//                 lectureData.lecture.public_id = result.public_id;
//                 lectureData.lecture.secure_url = result.secure_url;
//               }
    
//               fs.rm(`uploads/${req.file.filename}`);
    
//           } catch (error) {
//             return next(new AppError(`${error.message}`,400));
//           }
//     }

//     course.lectures.push(lectureData);

//     course.numberOfLectures = course.lectures.length;

//     await course.save();

//     res.status(200).json({
//         sucess:true,
//         message:'lecture added to course',
//         course
//     })
// }

export const addLecturesToCourseById = async (req, res, next) => {
    const { title, description } = req.body;
    const { id } = req.params;
  
    let lectureData = {};
  
    if (!title || !description) {
      return next(new AppError('Title and Description are required', 400));
    }
  
    const course = await Course.findById(id);
  
    if (!course) {
      return next(new AppError('Invalid course id or course not found.', 400));
    }
  
    // Run only if user sends a file
    if (req.file) {
      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: 'lms', // Save files in a folder named lms
          chunk_size: 500000000, // 50 mb size
          resource_type: 'video',
        });
  
        // If success
        if (result) {
          // Set the public_id and secure_url in array
          lectureData.public_id = result.public_id;
          lectureData.secure_url = result.secure_url;
        }
  
        // After successful upload remove the file from local storage
        fs.rm(`uploads/${req.file.filename}`);
      } catch (error) {
        // Empty the uploads directory without deleting the uploads directory
        for (const file of await fs.readdir('uploads/')) {
          await fs.unlink(path.join('uploads/', file));
        }
  
        // Send the error message
        return next(
          new AppError(
            JSON.stringify(error) || 'File not uploaded, please try again',
            400
          )
        );
      }
    }
  
    course.lectures.push({
      title,
      description,
      lecture: lectureData,
    });
  
    course.numberOfLectures = course.lectures.length;
  
    // Save the course object
    await course.save();
  
    res.status(200).json({
      success: true,
      message: 'Course lecture added successfully',
      course,
    });
  };


export const removeLectureFromCourse = async (req, res, next) => {
    // Grabbing the courseId and lectureId from req.query
    // const { courseId, lectureId } = req.query;
    const courseId = req.params.courseId;
    const lectureId = req.params.lectureId
  
    console.log(courseId);
  
    // Checking if both courseId and lectureId are present
    if (!courseId) {
      return next(new AppError('Course ID is required', 400));
    }
  
    if (!lectureId) {
      return next(new AppError('Lecture ID is required', 400));
    }
  
    // Find the course uding the courseId
    const course = await Course.findById(courseId);
  
    // If no course send custom message
    if (!course) {
      return next(new AppError('Invalid ID or Course does not exist.', 404));
    }
  
    // Find the index of the lecture using the lectureId
    const lectureIndex = course.lectures.findIndex(
      (lecture) => lecture._id.toString() === lectureId.toString()
    );
  
    // If returned index is -1 then send error as mentioned below
    if (lectureIndex === -1) {
      return next(new AppError('Lecture does not exist.', 404));
    }
  
    // Delete the lecture from cloudinary
    await cloudinary.v2.uploader.destroy(
      course.lectures[lectureIndex].lecture.public_id,
      {
        resource_type: 'video',
      }
    );
  
    // Remove the lecture from the array
    course.lectures.splice(lectureIndex, 1);
  
    // update the number of lectures based on lectres array length
    course.numberOfLectures = course.lectures.length;
  
    // Save the course object
    await course.save();
  
    // Return response
    res.status(200).json({
      success: true,
      message: 'Course lecture removed successfully',
    });
  };
  

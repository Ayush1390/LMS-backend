import {Router} from 'express';
import { addLecturesToCourseById, createCourse, getAllCourses, getLecturesByCourseId, removeCourse, removeLectureFromCourse, updateCourse } from '../controllers/course.controller.js';
import { authorizedRoles, isLoggedIn } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';

const router = Router();

router.get('/',getAllCourses);
router.post('/',isLoggedIn,authorizedRoles('ADMIN'),upload.single('thumbnail'),createCourse);
router.delete('/:courseId/:lectureId',isLoggedIn,authorizedRoles('ADMIN'),removeLectureFromCourse)


router.get('/:id',isLoggedIn,getLecturesByCourseId);
router.put('/:id',isLoggedIn,authorizedRoles('ADMIN'),updateCourse);
router.delete('/:id',isLoggedIn,authorizedRoles('ADMIN'),removeCourse);
router.post('/:id',isLoggedIn,authorizedRoles('ADMIN'),upload.single('lecture'),addLecturesToCourseById);

// router.delete('/:courseId/lecture/:lectureId',removeLectureFromCourse)

export default router;


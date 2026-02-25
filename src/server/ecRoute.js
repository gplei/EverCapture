import express from 'express';
import * as ecController from './ecController.js';

const router = express.Router();

router.get('/authUser', ecController.authUser);
router.get('/register', ecController.register);
router.post('/register', ecController.processRegister);
router.get('/login', ecController.login);
router.post('/login', ecController.processLogin);
router.get('/reset', ecController.reset);
router.post('/reset', ecController.processReset);
router.get('/logout', ecController.logout);

router.get('/sqlResult/:sql', ecController.getSqlResult);
router.get('/user', ecController.getAllUsers);
router.get('/popularTag/:userId', ecController.getPopularTag);
router.get('/crumbPinned/:userId', ecController.getCrumbPinned);
router.get('/crumbTag/:userId', ecController.getCrumb);
router.get('/crumbTagDeleted/:userId', ecController.getDeletedCrumb);
router.get('/imageCrumbTag/:userId', ecController.getImageCrumbTag);
router.get('/crumbByTag/:tagName/user/:userId', ecController.getCrumbByTag);
router.get('/crumbNoTag/:userId', ecController.getCrumbNoTag);
router.get('/crumbByDate/:date/user/:userId', ecController.getCrumbByDate);
router.get('/searchCrumb/:searchText', ecController.getSearchCrumb);
router.get('/crumbById/:id', ecController.getCrumbById);
router.get('/allTag', ecController.getAllTag);
router.get('/tag/:userId', ecController.getTagByUserId);
router.post('/crumb', ecController.addCrumb);
router.put('/crumb', ecController.updateCrumb);
router.put('/crumbPin', ecController.updatePin);
router.delete('/crumb/:id', ecController.deleteCrumb);
router.put(`/tag`, ecController.updateTag);
router.post(`/image`, ecController.addImage);
router.get('/image/:crumbId', ecController.getCrumbImage);
router.delete('/image/:id', ecController.deleteCrumbImage);
/**
 *  image upload
 */
import multer from 'multer';
// Configure multer for file storage
const storage = multer.diskStorage({
    destination: `./public/${ecController.media_dir}/`, // ./ is where the script is running which is the root dir of project
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Unique filename
    }
});
const upload = multer({ storage: storage });
router.post('/upload_media', upload.array('upload', 10), ecController.uploadMedia);

export default router; 

import * as dbExec from './db/dbExec.js';
import { logger } from './logger.js';
import bcrypt from 'bcrypt';

/**
 * In this controller module, process the fetch parameters and pass down to dbExec
 * 
 * Handle res.json on this level only
 */
const catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export const authUser = catchAsync((req, res) => {
    logger.logTrace(`Session.id: ${req.session.id}`);
    logger.logTrace(`Session.userId: ${req.session.userId}`);
    res.json({ userId: req.session.userId, userName: req.session.userName });
})
export const register = catchAsync(async (req, res) => {
    res.redirect('/?a=register');
})
export const processRegister = catchAsync(async (req, res) => {
    const { username, password } = req.body;
    await dbExec.register(username, password);
    res.redirect('/');
})
export const login = catchAsync(async (req, res) => {
    res.redirect('/');
})
export const processLogin = catchAsync(async (req, res) => {
    const { username, password, redirectUrl } = req.body;
    const results = await dbExec.login(username);
    const user = results.length > 0 ? results[0] : null;
    const hasHash = user?.password?.startsWith('$2'); // bcrypt hash
    const isValid = user ? (hasHash ? await bcrypt.compare(password, user.password) : password === user.password) : false;
    if (isValid) {
        req.session.userId = user.id;
        req.session.userName = username;
        req.session.save();
        res.redirect(!redirectUrl ? '/' : redirectUrl);
    } else {
        // res.send('Invalid username or password. <a href="/login">Try again</a>');
        res.redirect('/?a=invalidLogin');
    }
})
export const reset = catchAsync(async (req, res) => {
    res.redirect('/?a=reset');
})
export const processReset = catchAsync(async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
    const result = await dbExec.resetPassword(username, oldPassword, newPassword);
    if (!result.error) {
        res.redirect('/login');
    } else {
        res.redirect(`/?a=${result.error}`);
    }

})
export const logout = catchAsync(async (req, res) => {
    req.session.destroy()
    res.redirect('/');
})

export const getSqlResult = catchAsync(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Forbidden', message: 'sqlResult is disabled in production' });
    }
    const { sql } = req.params;
    const results = await dbExec.getSqlResult(sql);
    res.status(200).json(results);
})

export const getAllUsers = catchAsync(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Forbidden', message: 'user list is disabled in production' });
    }
    const users = await dbExec.getAllUsers();
    res.status(200).json(users);
})
export const getPopularTag = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const results = await dbExec.getPopularTag(userId);
    return res.json(results);
})
export const getCrumbPinned = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const results = await dbExec.getCrumbPinned(userId);
    return res.json(results);
})
export const getCrumb = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const results = await dbExec.getCrumb(userId);
    return res.json(results);
})
export const getDeletedCrumb = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const results = await dbExec.getDeletedCrumb(userId);
    return res.json(results);
})
export const getImageCrumbTag = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const results = await dbExec.getImageCrumbTag(userId);
    return res.json(results);
})
export const getCrumbByTag = catchAsync(async (req, res) => {
    const { userId, tagName } = req.params;
    const results = await dbExec.getCrumbByTag(userId, tagName);
    return res.json(results);
})
export const getCrumbNoTag = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const results = await dbExec.getCrumbNoTag(userId);
    return res.json(results);
})
export const getCrumbByDate = catchAsync(async (req, res) => {
    const { userId, date } = req.params;
    const results = await dbExec.getCrumbByDate(userId, date);
    return res.json(results);
})
export const getSearchCrumb = catchAsync(async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.redirect('/');
    }
    const { searchText } = req.params;
    const results = await dbExec.getSearchCrumb(userId, searchText);
    return res.json(results);
})
export const getCrumbById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const results = await dbExec.getCrumbById(id);
    if (results.length > 0 && results[0].user_id === req.session.userId) {
        return res.json(results);
    } else {
        return res.status(400).json({ error: 'Item not found.', message: 'Make sure the id is correct.' });
    }
})
export const getAllTag = catchAsync(async (req, res) => {
    const results = await dbExec.getAllTag();
    return res.json(results);
})
export const getTagByUserId = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const results = await dbExec.getTagByUserId(userId);
    return res.json(results);
})
export const addCrumb = catchAsync(async (req, res) => {
    const { userId, title, url, crumbDate, description, color, tags } = req.body;
    await dbExec.addCrumb(userId, title, url, crumbDate, description, color, tags);
    return res.json({ message: `crumb ${title} is added` });
    // let r = await dbExec.addCrumb(userId, title, url, crumbDate, description, tags);
    // res.json(r);
})
export const updateCrumb = catchAsync(async (req, res) => {
    const { id, title, url, crumbDate, description, color, tags } = req.body;
    const results = await dbExec.updateCrumb(id, title, url, crumbDate, description, color, tags);
    return res.json(`crumb ${id} is updated`);
})
export const updatePin = catchAsync(async (req, res) => {
    const { id, pin } = req.body;
    const results = await dbExec.updatePin(id, pin);

    return res.json(`Crumb pin updated to ${pin} for ${id}`);
})
export const deleteCrumb = catchAsync(async (req, res) => {
    const { id } = req.params;
    const results = await dbExec.deleteCrumb(id);
    return res.json(`crumb ${id} is deleted`);
})
export const media_dir = 'upload_media';
export const uploadMedia = catchAsync((req, res) => {
    // Process the file, e.g., move it to a public folder or upload to a cloud storage
    const imgUrls = req.files.map(file => `${file.filename}`); // imgUrls = result.files.map(file => file.filename);
    res.json({
        media_dir,
        files: imgUrls
    });
})
export const updateTag = catchAsync(async (req, res) => {
    const { newName, oldName } = req.body;
    const result = await dbExec.updateTag(newName, oldName);
    return res.json({ message: `tag name is updated to ${newName} from ${oldName}` });
});
export const addImage = catchAsync(async (req, res) => {
    const { crumbId, imgUrls } = req.body;
    logger.logInfo(req.body);
    await dbExec.addImage(crumbId, imgUrls);
    return res.json({ message: `Image ${crumbId} is added for crumb ${crumbId}` });
})
export const getCrumbImage = catchAsync(async (req, res) => {
    const { crumbId } = req.params;
    const results = await dbExec.getCrumbImage(crumbId);
    return res.json({media_dir, imgUrls: results});
})
export const deleteCrumbImage = catchAsync(async (req, res) => {
    const { id } = req.params;
    await dbExec.deleteCrumbImage(id);
    return res.json(`Image ${id} is deleted`);
})

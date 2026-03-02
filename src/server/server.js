import dotenv from "dotenv";
dotenv.config();
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express, { json, urlencoded } from 'express';
import session from 'express-session';
// import pkg from 'body-parser';
import cors from 'cors';
import { logger } from './logger.js';

const serverHost = process.env.SERVER_HOST || 'localhost';//'pingmac.local';
const serverOrigin = serverHost.startsWith('http://') || serverHost.startsWith('https://')
    ? serverHost
    : `http://${serverHost}`;
const PORT = 3000;

const app = express();
// const { json: _json } = pkg;
// app.use(_json());

app.use(express.json());


app.use(
    session({
        secret: process.env.SESSION_SECRET || 'dev-only-change-me',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true, // Helps prevent XSS attacks
            secure: false, // Set to true if using HTTPS
            sameSite: 'lax', // Adjust based on your needs
            maxAge: 2592000000, // 30 days 60000, // Session lifetime (1 minute in this example)
        },
    })
);
// host front end in different url
app.use(cors({
    origin: serverOrigin, // Frontend origin
    credentials: true, // Allow cookies to be sent
}));
app.options('*', cors()); // Allow preflight requests for all routes
// Middleware
app.use(json());
app.use(urlencoded({ extended: true })); // to recieve login/register form data
logger.logAlways(`host: ${join(dirname(fileURLToPath(import.meta.url)))}`);
app.use(express.static(join(dirname(fileURLToPath(import.meta.url)), '../../dist')));

import ecRoute from './ecRoute.js';
app.use('/', ecRoute);

import hayDayRout from './apps/hayDay/ecRoute.js';
app.use('/', hayDayRout);
import fintechRoute from './apps/fintech/ecRoute.js';
app.use('/', fintechRoute);

app.use((err, req, res, next) => {
    logger.logError('🔥 🔥 🔥 🔥 🔥  Error:', err.message);
    logger.logError(err.stack);
    if (err.code) {
        res.status(400).json({ error: 'Database Error', message: err.message });
    } else {
        res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
});

// app.listen(PORT, () => {
app.listen(PORT, '0.0.0.0', () => {
    logger.logAlways(`🚀 Server running on ${serverOrigin}:${PORT}`);
});

/**
 * image server
 */
import multer from "multer";
import path from "path";
import fs from "fs";
import corsImg from "cors";
// import heicConvert from "heic-convert";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appImg = express();
const PORTImg = 8000;
appImg.use(corsImg());

// Create upload directory if not exist
const media_dir = path.join(__dirname, "../../upload_media");

if (!fs.existsSync(media_dir)) {
    fs.mkdirSync(media_dir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, media_dir),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

const upload = multer({ storage });

// Serve uploaded files statically
logger.logAlways(`media_dir: ${media_dir}`);
// appImg.use("/upload_media", express.static(media_dir));
appImg.use("/upload_media", express.static(media_dir));
// Example route``
appImg.get("/", (req, res) => {
    res.send("<h1>Image Server Running 🖼️</h1><p>Try /images/cat.jpg</p>");
});

// ✅ Multiple file upload (max 10 files)
appImg.post("/media", upload.array("upload", 10), async (req, res) => {
    if (!req.files || req.files.length === 0)
        return res.status(400).json({ error: "No files uploaded" });

    const imgUrls = req.files.map((file) => (file.filename));
    res.json({ media_dir: `/`, files: imgUrls });
});

const convertHEICFiles = async (req) => {
    const convertedFiles = [];

    for (const file of req.files) {
        const ext = path.extname(file.originalname).toLowerCase();

        if (ext === ".heic") {
            const inputBuffer = fs.readFile(file.path);
            const outputBuffer = await heicConvert({
                buffer: inputBuffer,
                format: "JPEG",
                quality: 0.9,
            });

            const newFilename = file.filename.replace(/\.heic$/i, ".jpg");
            const newPath = path.join(path.dirname(file.path), newFilename);
            fs.writeFile(newPath, outputBuffer);

            // Optionally delete original HEIC
            //   await fs.unlink(file.path);

            convertedFiles.push({
                filename: newFilename,
                url: `/upload_media/${newFilename}`,
            });
        } else {
            convertedFiles.push({
                filename: file.filename,
                url: `/upload_media/${file.filename}`,
            });
        }
    }
    return convertedFiles;
}

// appImg.listen(PORTImg, () => {
appImg.listen(PORTImg, '0.0.0.0', () => {
    console.log(`✅ Media server running at ${serverOrigin}:${PORTImg}`);
});

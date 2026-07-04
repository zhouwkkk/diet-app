/**
 * 文件上传路由
 */
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config/index.js';
import { success, fail, serverError } from '../utils/response.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(__dirname, '../../uploads'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('仅支持图片格式: jpg, png, gif, webp'));
    }
  },
});

const router = Router();

// 上传图片
router.post('/', requireAuth, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return fail(res, `文件大小不能超过 ${config.upload.maxFileSize / 1024 / 1024}MB`);
      }
      return fail(res, err.message);
    }
    if (!req.file) {
      return fail(res, '请选择文件');
    }
    const url = `/uploads/${req.file.filename}`;
    return success(res, { url, filename: req.file.filename }, '上传成功');
  });
});

export default router;

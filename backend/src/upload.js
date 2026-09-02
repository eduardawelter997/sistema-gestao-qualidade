/**
 * Configuração do multer para upload de fotos/documentos anexados a um registro.
 * Os arquivos ficam salvos em backend/uploads/ e são servidos como estáticos
 * pelo server.js (rota /uploads/...).
 */
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const extensao = path.extname(file.originalname);
    const nomeUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extensao}`;
    cb(null, nomeUnico);
  },
});

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (TIPOS_PERMITIDOS.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Envie uma imagem (JPG/PNG/WEBP) ou PDF.'));
    }
  },
});

module.exports = { upload, uploadsDir };

import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Backend tier root (works both in src/ via tsx and dist/ via node). */
export const ROOT_DIR = path.resolve(__dirname, '..')

/** Temporary upload directory (multer). */
export const TMP_DIR = path.join(ROOT_DIR, 'tmp')

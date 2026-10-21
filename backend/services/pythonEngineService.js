import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRIPT_PATH = path.resolve(__dirname, '../ml_engine/identity_guardian_cv.py');

/**
 * Runs the Python computer vision engine on two input images.
 * @param {'id_photo_verification' | 'ai_photo_verification'} mode 
 * @param {string} image1Path 
 * @param {string} image2Path 
 * @param {number} timeoutMs 
 * @returns {Promise<object>}
 */
export async function runPythonCvEngine(mode, image1Path, image2Path, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const pythonExecutable = process.env.PYTHON_PATH || 'python';
    const args = [SCRIPT_PATH, mode, image1Path, image2Path];

    const child = spawn(pythonExecutable, args);

    let stdoutData = '';
    let stderrData = '';
    let isFinished = false;

    const timer = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        child.kill();
        reject(new Error(`Python CV engine timed out after ${timeoutMs}ms.`));
      }
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    child.on('error', (err) => {
      if (!isFinished) {
        isFinished = true;
        clearTimeout(timer);
        reject(new Error(`Failed to launch Python CV engine: ${err.message}`));
      }
    });

    child.on('close', (code) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timer);

      if (code !== 0 && !stdoutData.trim()) {
        return reject(new Error(`Python CV engine exited with code ${code}. Stderr: ${stderrData.trim()}`));
      }

      try {
        const parsed = JSON.parse(stdoutData.trim());
        resolve(parsed);
      } catch (parseError) {
        reject(new Error(`Failed to parse Python CV engine output: ${stdoutData.slice(0, 300)}`));
      }
    });
  });
}

export default { runPythonCvEngine };

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRIPT_PATH = path.resolve(__dirname, '../ml_engine/identity_guardian_cv.py');

/**
 * Attempts verification via remote Python FastAPI AI service if configured.
 * @param {string} fastapiUrl 
 * @param {'id_photo_verification' | 'ai_photo_verification'} mode 
 * @param {string} image1Path 
 * @param {string} image2Path 
 * @returns {Promise<object|null>}
 */
async function callRemoteFastAiService(fastapiUrl, mode, image1Path, image2Path) {
  try {
    const cleanUrl = fastapiUrl.replace(/\/$/, '');
    const img1Buffer = await fs.promises.readFile(image1Path);
    const img2Buffer = await fs.promises.readFile(image2Path);

    const formData = new FormData();
    formData.append('mode', mode);
    formData.append('image1', new Blob([img1Buffer]), path.basename(image1Path));
    formData.append('image2', new Blob([img2Buffer]), path.basename(image2Path));

    const response = await fetch(`${cleanUrl}/api/v1/verify`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      console.warn(`[FastAPI Service] Returned status ${response.status}. Falling back to local engine.`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.warn(`[FastAPI Service] Could not connect to remote AI service (${err.message}). Falling back to local engine.`);
    return null;
  }
}

/**
 * Runs the Python computer vision engine on two input images.
 * Supports remote FastAPI AI service if AI_SERVICE_URL or FASTAPI_AI_URL is provided,
 * with seamless fallback to local SOTA YuNet/SFace neural models.
 * 
 * @param {'id_photo_verification' | 'ai_photo_verification'} mode 
 * @param {string} image1Path 
 * @param {string} image2Path 
 * @param {number} timeoutMs 
 * @returns {Promise<object>}
 */
export async function runPythonCvEngine(mode, image1Path, image2Path, timeoutMs = 25000) {
  // 1. Check for remote FastAPI AI Microservice
  const remoteAiUrl = process.env.FASTAPI_AI_URL || process.env.AI_SERVICE_URL;
  if (remoteAiUrl && !remoteAiUrl.includes('replace_with')) {
    const remoteResult = await callRemoteFastAiService(remoteAiUrl, mode, image1Path, image2Path);
    if (remoteResult && remoteResult.success) {
      return remoteResult;
    }
  }

  // 2. Execute local Computer Vision & Deep Learning engine
  return new Promise((resolve, reject) => {
    // Choose appropriate python binary (python3 on Linux/Render, python on Windows)
    const pythonExecutable =
      process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');
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
        reject(new Error(`Failed to launch Python CV engine (${pythonExecutable}): ${err.message}`));
      }
    });

    child.on('close', (code) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timer);

      if (code !== 0 && !stdoutData.trim()) {
        return reject(
          new Error(`Python CV engine exited with code ${code}. Stderr: ${stderrData.trim()}`),
        );
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

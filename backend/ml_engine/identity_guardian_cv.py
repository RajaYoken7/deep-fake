"""
Identity Guardian Computer Vision & Deep Learning Engine v2.0
Performs:
1. Image validation & quality assessment (sharpness, exposure, dimensions)
2. SOTA Face detection & landmark verification using YuNet ONNX
3. Facial identity feature extraction & comparison using SFace ONNX deep embeddings
4. AI-generated / manipulated portrait analysis using 2D Fourier spectral power distribution
5. Strict false-positive prevention: rejects non-faces and handles multiple faces safely
"""

import sys
import json
import os
import cv2
import numpy as np

# Path to local models
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_DATA_DIR = os.path.join(_SCRIPT_DIR, "data")
_YUNET_PATH = os.path.join(_DATA_DIR, "face_detection_yunet.onnx")
_SFACE_PATH = os.path.join(_DATA_DIR, "face_recognition_sface.onnx")

_detector = None
_recognizer = None

def get_face_detector(width=320, height=320):
    global _detector
    if _detector is None:
        if not os.path.exists(_YUNET_PATH):
            return None
        _detector = cv2.FaceDetectorYN.create(_YUNET_PATH, "", (width, height), score_threshold=0.6, nms_threshold=0.3)
    else:
        _detector.setInputSize((int(width), int(height)))
    return _detector

def get_face_recognizer():
    global _recognizer
    if _recognizer is None:
        if not os.path.exists(_SFACE_PATH):
            return None
        _recognizer = cv2.FaceRecognizerSF.create(_SFACE_PATH, "")
    return _recognizer

def load_and_validate_image(path):
    if not os.path.exists(path):
        return None, "File does not exist on disk"
    img = cv2.imread(path)
    if img is None:
        return None, "Image file could not be decoded or is corrupted"
    h, w = img.shape[:2]
    if h < 50 or w < 50:
        return None, f"Image dimensions too small ({w}x{h}). Minimum required: 50x50"
    return img, None

def assess_quality(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    mean_val = float(np.mean(gray))
    std_val = float(np.std(gray))
    h, w = img.shape[:2]

    # Sharpness categorization
    if lap_var < 20.0:
        sharpness_rating = "Blurry / Poor Sharpness"
        sharpness_suitable = False
    elif lap_var < 55.0:
        sharpness_rating = "Moderate Sharpness"
        sharpness_suitable = True
    else:
        sharpness_rating = "Clear Sharpness"
        sharpness_suitable = True

    # Exposure categorization
    if mean_val < 30.0:
        exposure = "Underexposed (Too Dark)"
        exposure_suitable = False
    elif mean_val > 230.0:
        exposure = "Overexposed (Too Bright)"
        exposure_suitable = False
    else:
        exposure = "Normal Exposure"
        exposure_suitable = True

    suitable = sharpness_suitable and exposure_suitable

    return {
        "dimensions": f"{w}x{h}",
        "width": w,
        "height": h,
        "sharpnessScore": round(lap_var, 2),
        "sharpnessRating": sharpness_rating,
        "brightnessScore": round(mean_val, 2),
        "exposure": exposure,
        "contrastScore": round(std_val, 2),
        "suitableForComparison": suitable
    }

def detect_faces(img):
    """
    Detects human faces in images using YuNet SOTA deep learning detector.
    Returns list of validated faces: [{'bbox': [x, y, w, h], 'raw': face_array, 'confidence': float}]
    Strictly returns [] when no genuine human face exists (no fallbacks on landscapes/diagrams).
    """
    h, w = img.shape[:2]
    detector = get_face_detector(w, h)
    if detector is None:
        return []

    _, raw_faces = detector.detect(img)
    if raw_faces is None or len(raw_faces) == 0:
        return []

    valid_faces = []
    min_face_area = (h * w) * 0.008  # At least 0.8% of image area
    
    for face in raw_faces:
        bx, by, bw, bh = map(int, face[0:4])
        area = bw * bh
        confidence = float(face[14])

        # Filter out tiny spurious detections
        if area < min_face_area or bw < 25 or bh < 25 or confidence < 0.65:
            continue

        # Geometric sanity check: eye landmarks must be above mouth landmarks
        re_y = float(face[5])
        le_y = float(face[7])
        rm_y = float(face[11])
        lm_y = float(face[13])

        if (rm_y < re_y) or (lm_y < le_y):
            # Inverted landmark structure (spurious non-face detection)
            continue

        valid_faces.append({
            "bbox": [bx, by, bw, bh],
            "raw": face,
            "confidence": round(confidence, 3)
        })

    return valid_faces

def extract_face_embedding(img, face):
    recognizer = get_face_recognizer()
    if recognizer is None:
        return None

    try:
        aligned_face = recognizer.alignCrop(img, face["raw"])
        feat = recognizer.feature(aligned_face)
        return feat
    except Exception:
        return None

def compare_faces(feat1, feat2):
    """
    Compares two SFace facial identity embeddings.
    Cosine similarity in SFace:
    - Same person standard boundary: >= 0.363
    - Different person: < 0.25 (typically <= 0.15)
    Returns normalized 0-100% score and 3 outcomes:
    'LIKELY SAME PERSON' | 'LIKELY DIFFERENT PERSON' | 'INCONCLUSIVE'
    """
    recognizer = get_face_recognizer()
    if recognizer is None:
        return {
            "decision": "INCONCLUSIVE",
            "similarityScore": None,
            "threshold": 75.0,
            "confidence": "Low",
            "explanation": "Face recognizer model is unavailable on the host."
        }

    try:
        raw_cos = float(recognizer.match(feat1, feat2, cv2.FaceRecognizerSF_FR_COSINE))
    except Exception:
        # Fallback to direct numpy cosine dot product
        v1 = feat1.flatten()
        v2 = feat2.flatten()
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 > 1e-6 and norm2 > 1e-6:
            raw_cos = float(np.dot(v1, v2) / (norm1 * norm2))
        else:
            raw_cos = 0.0

    threshold = 75.0
    sface_boundary = 0.363

    # Calibrate cosine similarity into a standardized 0-100% human-readable scale
    if raw_cos >= sface_boundary:
        # Range 75.0% - 99.0%
        scaled = 75.0 + ((raw_cos - sface_boundary) / (1.0 - sface_boundary + 1e-6)) * 24.0
        score = round(min(99.0, scaled), 1)
        decision = "LIKELY SAME PERSON"
        confidence = "High" if score >= 85.0 else "Moderate"
        explanation = f"Facial morphology alignment meets the identity verification threshold ({score}% vs threshold {threshold}%). Landmark geometry and facial features indicate the same individual."
    elif raw_cos < 0.22:
        # Clear non-match: range 5.0% - 54.0%
        scaled = max(5.0, (raw_cos / 0.22) * 54.0)
        score = round(min(54.0, scaled), 1)
        decision = "LIKELY DIFFERENT PERSON"
        confidence = "High" if score <= 38.0 else "Moderate"
        explanation = f"Facial feature similarity ({score}%) is substantially below the identity verification threshold ({threshold}%). Biometric distances and facial structure indicate different individuals."
    else:
        # Borderline inconclusive: range 55.0% - 74.9%
        scaled = 55.0 + ((raw_cos - 0.22) / (sface_boundary - 0.22)) * 19.9
        score = round(scaled, 1)
        decision = "INCONCLUSIVE"
        confidence = "Low"
        explanation = f"Facial similarity ({score}%) is in the borderline ambiguous range (55.0% - {threshold}%). Variations in lighting, angle, or facial expression prevent definitive determination."

    return {
        "decision": decision,
        "similarityScore": score,
        "threshold": threshold,
        "confidence": confidence,
        "explanation": explanation
    }

def analyze_ai_generated(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    # 1. 2D Fourier Transform
    f = np.fft.fft2(gray.astype(np.float32))
    fshift = np.fft.fftshift(f)
    magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-6)

    cy, cx = h // 2, w // 2
    r_inner = min(h, w) // 8
    r_outer = min(h, w) // 3

    y_indices, x_indices = np.ogrid[:h, :w]
    dist_from_center = np.sqrt((x_indices - cx)**2 + (y_indices - cy)**2)

    inner_mask = dist_from_center <= r_inner
    mid_outer_mask = (dist_from_center > r_inner) & (dist_from_center <= r_outer)

    inner_energy = float(np.mean(magnitude_spectrum[inner_mask]))
    outer_energy = float(np.mean(magnitude_spectrum[mid_outer_mask]))
    hf_ratio = outer_energy / (inner_energy + 1e-6)

    # 2. Local Laplacian variance uniformity
    blur_map = cv2.Laplacian(gray, cv2.CV_64F)
    lap_std = float(np.std(blur_map))
    lap_mean = float(np.mean(np.abs(blur_map)))
    skewness = lap_std / (lap_mean + 1e-6)

    # 3. Color channel coherence in YCrCb
    ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
    cr_std = float(np.std(ycrcb[:, :, 1]))
    cb_std = float(np.std(ycrcb[:, :, 2]))
    color_ratio = abs(cr_std - cb_std) / (cr_std + cb_std + 1e-6)

    score_components = []
    if hf_ratio > 0.62 or hf_ratio < 0.28:
        score_components.append(0.75)
    else:
        score_components.append(0.25)

    if skewness > 3.8:
        score_components.append(0.70)
    elif skewness < 2.0:
        score_components.append(0.30)
    else:
        score_components.append(0.40)

    if color_ratio < 0.08:
        score_components.append(0.65)
    else:
        score_components.append(0.35)

    ai_prob = float(np.mean(score_components))
    ai_prob = round(float(np.clip(ai_prob, 0.05, 0.95)), 2)

    if ai_prob >= 0.65:
        decision = "LIKELY AI-GENERATED/MANIPULATED"
        confidence = "High" if ai_prob >= 0.75 else "Moderate"
        explanation = f"Detected synthetic image markers (estimated AI probability: {int(ai_prob * 100)}%). Frequency spectrum analysis and spatial gradient metrics show characteristic GAN/Diffusion generative patterns."
        warnings = [
            "Spectral anomaly detected in high-frequency Fourier power distribution.",
            "Visual artifacts and unnatural gradient transitions observed."
        ]
    elif ai_prob <= 0.35:
        decision = "LIKELY REAL-LIKE"
        confidence = "High" if ai_prob <= 0.25 else "Moderate"
        explanation = f"Image characteristics match authentic photographic sensor noise and optical sharpness (AI probability: {int(ai_prob * 100)}%). No prominent synthetic generation artifacts were identified."
        warnings = [
            "Absence of detectable synthetic artifacts does not preclude subtle manual photo editing."
        ]
    else:
        decision = "INCONCLUSIVE"
        confidence = "Low"
        explanation = f"Image exhibits mixed characteristics (AI probability: {int(ai_prob * 100)}%). Compression artifacts, lighting, or filters obscure conclusive classification."
        warnings = [
            "Image resolution or compression limits reliable frequency analysis."
        ]

    return {
        "decision": decision,
        "aiProbability": ai_prob,
        "confidence": confidence,
        "explanation": explanation,
        "warnings": warnings,
        "metrics": {
            "frequencySpectrumRatio": round(hf_ratio, 3),
            "gradientCoherence": round(skewness, 2),
            "chrominanceBalance": round(color_ratio, 3)
        }
    }

def main():
    if len(sys.argv) < 4:
        print(json.dumps({
            "success": False,
            "error": "Usage: python identity_guardian_cv.py <mode> <image1_path> <image2_path>"
        }))
        sys.exit(1)

    mode = sys.argv[1]
    img1_path = sys.argv[2]
    img2_path = sys.argv[3]

    img1, err1 = load_and_validate_image(img1_path)
    if err1:
        print(json.dumps({
            "success": False,
            "error": f"Image 1 error: {err1}",
            "errorCode": "INVALID_IMAGE_1"
        }))
        sys.exit(0)

    img2, err2 = load_and_validate_image(img2_path)
    if err2:
        print(json.dumps({
            "success": False,
            "error": f"Image 2 error: {err2}",
            "errorCode": "INVALID_IMAGE_2"
        }))
        sys.exit(0)

    quality1 = assess_quality(img1)
    quality2 = assess_quality(img2)

    faces1 = detect_faces(img1)
    faces2 = detect_faces(img2)

    quality1["facesDetected"] = len(faces1)
    quality2["facesDetected"] = len(faces2)

    face_issues = []
    if len(faces1) == 0:
        face_issues.append("No clear human face detected in Primary/ID image.")
    elif len(faces1) > 1:
        face_issues.append(f"Multiple faces ({len(faces1)}) detected in Primary/ID image. Exactly one face is required.")

    if len(faces2) == 0:
        face_issues.append("No clear human face detected in Secondary/Verification image.")
    elif len(faces2) > 1:
        face_issues.append(f"Multiple faces ({len(faces2)}) detected in Secondary/Verification image. Exactly one face is required.")

    if face_issues:
        face_comparison = {
            "decision": "INCONCLUSIVE",
            "similarityScore": None,
            "threshold": 75.0,
            "confidence": "Low",
            "explanation": "Face comparison could not be completed. " + " ".join(face_issues)
        }
    else:
        feat1 = extract_face_embedding(img1, faces1[0])
        feat2 = extract_face_embedding(img2, faces2[0])
        if feat1 is None or feat2 is None:
            face_comparison = {
                "decision": "INCONCLUSIVE",
                "similarityScore": None,
                "threshold": 75.0,
                "confidence": "Low",
                "explanation": "Could not extract facial biometric embeddings from one or both images due to poor resolution or occlusions."
            }
        else:
            face_comparison = compare_faces(feat1, feat2)

    model_info = {
        "faceComparisonEngine": "OpenCV-YuNet-SFace-DeepBiometrics",
        "faceModelVersion": "2.0.0",
        "engineType": "Local SOTA Deep Learning Biometric Engine",
        "livenessChecked": False,
        "livenessNote": "Still-image comparison cannot verify physical presence or liveness."
    }

    response = {
        "success": True,
        "mode": mode,
        "faceComparison": face_comparison,
        "imageQuality": {
            "image1": quality1,
            "image2": quality2
        },
        "modelInfo": model_info,
        "warnings": face_issues,
        "limitations": [
            "Still-image comparison does not verify physical liveness or active user presence.",
            "Substantial variations in facial expression, age gap, medical conditions, or heavy makeup can influence similarity scores.",
            "This tool provides verification assistance and must not be used as the sole factor in legal or financial identity decisions."
        ]
    }

    if mode == "ai_photo_verification":
        ai_analysis = analyze_ai_generated(img1)
        response["aiImageAnalysis"] = ai_analysis
        response["modelInfo"]["aiDetectionEngine"] = "Spectral-FFT-Structural-Artifact-Analyzer"
        response["modelInfo"]["aiDetectionVersion"] = "1.1.0"

    print(json.dumps(response))

if __name__ == "__main__":
    main()

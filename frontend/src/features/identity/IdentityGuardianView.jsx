import { useState, useRef } from 'react';
import {
  ShieldCheck,
  Fingerprint,
  ScanSearch,
  LockKeyhole,
  FileImage,
  ArrowRight,
  Upload,
  X,
  AlertTriangle,
  Printer,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye
} from 'lucide-react';
import { Button, GlassCard, SectionHead } from '../../components/UI';
import { verifyIdPhotoApi, verifyAiPhotoApi } from '../../services/identityGuardianService';
import './identity-guardian.css';

export function IdentityGuardianView({ notify }) {
  const [activeTab, setActiveTab] = useState('id_photo'); // 'id_photo' | 'ai_photo'

  // Section A state
  const [idPhoto, setIdPhoto] = useState(null);
  const [selfie, setSelfie] = useState(null);

  // Section B state
  const [suspectedPhoto, setSuspectedPhoto] = useState(null);
  const [referencePhoto, setReferencePhoto] = useState(null);

  // Async submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [reportData, setReportData] = useState(null);

  // File pick helper with client-side validation
  const validateAndSelectFile = (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Invalid file format. Please upload a JPEG, PNG, or WebP image.');
      if (notify) notify('Please upload a supported image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds 10MB limit. Please select a smaller image.');
      if (notify) notify('Image file must be under 10MB.');
      return;
    }

    setErrorMessage('');
    setter({
      file,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      previewUrl: URL.createObjectURL(file)
    });
  };

  const handleVerifySectionA = async () => {
    if (!idPhoto || !selfie) {
      setErrorMessage('Please upload both an ID Card Photo and a Current Selfie.');
      if (notify) notify('Upload both required images before verification.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await verifyIdPhotoApi(idPhoto.file, selfie.file);
      setReportData({
        ...result,
        inputPreviews: {
          image1: { url: idPhoto.previewUrl, label: 'Official ID Card Portrait' },
          image2: { url: selfie.previewUrl, label: 'Current Verification Selfie' }
        }
      });
      if (notify) notify('ID photo verification completed successfully.');
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Verification failed. Please check backend connection.');
      if (notify) notify(err.message || 'Verification request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySectionB = async () => {
    if (!suspectedPhoto || !referencePhoto) {
      setErrorMessage('Please upload both the Suspected Portrait and the Reference Image.');
      if (notify) notify('Upload both required images before verification.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await verifyAiPhotoApi(suspectedPhoto.file, referencePhoto.file);
      setReportData({
        ...result,
        inputPreviews: {
          image1: { url: suspectedPhoto.previewUrl, label: 'Suspected AI-Generated Portrait' },
          image2: { url: referencePhoto.previewUrl, label: 'Authentic Reference Image' }
        }
      });
      if (notify) notify('AI-generated photo analysis completed successfully.');
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'AI analysis failed. Please check backend connection.');
      if (notify) notify(err.message || 'AI analysis request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetVerification = () => {
    setReportData(null);
    setErrorMessage('');
  };

  return (
    <div className="identity-guardian-wrapper">
      <SectionHead
        eyebrow="BIOMETRIC & SYNTHETIC TRUST VERIFICATION"
        title="Identity Guardian"
        copy="Protect digital identity integrity through non-destructive facial comparison and AI-generated image artifact detection."
      />

      {/* If a report has been generated, render the complete verification report */}
      {reportData ? (
        <ReportView report={reportData} onReset={resetVerification} />
      ) : (
        <>
          {/* Section Switcher Tabs */}
          <div className="identity-tabs" role="tablist">
            <button
              className={`identity-tab-btn ${activeTab === 'id_photo' ? 'active' : ''}`}
              onClick={() => { setActiveTab('id_photo'); setErrorMessage(''); }}
              role="tab"
              aria-selected={activeTab === 'id_photo'}
            >
              <Fingerprint size={18} />
              <span>Section A: ID Photo Verification</span>
            </button>
            <button
              className={`identity-tab-btn purple-tab ${activeTab === 'ai_photo' ? 'active purple-tab' : ''}`}
              onClick={() => { setActiveTab('ai_photo'); setErrorMessage(''); }}
              role="tab"
              aria-selected={activeTab === 'ai_photo'}
            >
              <Sparkles size={18} />
              <span>Section B: AI-Generated Photo Verification</span>
            </button>
          </div>

          {/* Error Alert Banner */}
          {errorMessage && (
            <div className="error-alert-banner" role="alert">
              <AlertTriangle size={20} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section A: ID Photo Verification */}
          {activeTab === 'id_photo' && (
            <div className="identity-grid">
              <UploadColumn
                icon={Fingerprint}
                colorClass=""
                title="1. ID Card Photo"
                description="Upload an official ID card, passport, or driver's license containing a clear facial portrait."
                fileData={idPhoto}
                onSelect={(e) => validateAndSelectFile(e, setIdPhoto)}
                onRemove={() => setIdPhoto(null)}
                label="Choose ID Document Portrait"
                helper="JPEG, PNG or WebP · Max 10MB"
              />

              <UploadColumn
                icon={ShieldCheck}
                colorClass=""
                title="2. Current Verification Selfie"
                description="Upload a recent, front-facing selfie taken under even lighting without heavy occlusions."
                fileData={selfie}
                onSelect={(e) => validateAndSelectFile(e, setSelfie)}
                onRemove={() => setSelfie(null)}
                label="Choose Verification Selfie"
                helper="JPEG, PNG or WebP · Max 10MB"
              />
            </div>
          )}

          {/* Section B: AI-Generated Photo Verification */}
          {activeTab === 'ai_photo' && (
            <div className="identity-grid">
              <UploadColumn
                icon={Sparkles}
                colorClass="purple"
                title="1. Suspected AI Portrait"
                description="Upload the portrait suspected of being AI-generated, synthetic, face-swapped, or manipulated."
                fileData={suspectedPhoto}
                onSelect={(e) => validateAndSelectFile(e, setSuspectedPhoto)}
                onRemove={() => setSuspectedPhoto(null)}
                label="Choose Suspected Portrait"
                helper="JPEG, PNG or WebP · Max 10MB"
              />

              <UploadColumn
                icon={ScanSearch}
                colorClass="purple"
                title="2. Authentic Reference Portrait"
                description="Upload a known genuine, unmanipulated photograph or selfie of the person for facial baseline comparison."
                fileData={referencePhoto}
                onSelect={(e) => validateAndSelectFile(e, setReferencePhoto)}
                onRemove={() => setReferencePhoto(null)}
                label="Choose Reference Photo"
                helper="JPEG, PNG or WebP · Max 10MB"
              />
            </div>
          )}

          {/* Privacy & Scope Notice */}
          <div className="privacy-notice-box">
            <LockKeyhole className="privacy-icon" size={22} />
            <div>
              <strong>Strict Privacy & Data Protection Guarantee:</strong>
              <p style={{ margin: '4px 0 0 0' }}>
                Uploaded images are processed in transient runtime memory for non-destructive facial comparison and spectral artifact evaluation.
                Raw ID photos, selfies, and biometric face templates are <strong>never stored</strong> in MongoDB or retained on our systems.
                This feature provides still-image facial comparison and is <strong>not a physical liveness check</strong>.
              </p>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="submit-action-row">
            {activeTab === 'id_photo' ? (
              <button
                className="verify-cta-btn"
                disabled={isSubmitting || !idPhoto || !selfie}
                onClick={handleVerifySectionA}
              >
                {isSubmitting ? (
                  <><i className="spinner" /> Analyzing Biometric Features...</>
                ) : (
                  <>Verify ID & Selfie Portrait <ArrowRight size={18} /></>
                )}
              </button>
            ) : (
              <button
                className="verify-cta-btn purple-cta"
                disabled={isSubmitting || !suspectedPhoto || !referencePhoto}
                onClick={handleVerifySectionB}
              >
                {isSubmitting ? (
                  <><i className="spinner" /> Running Dual AI & Face Analysis...</>
                ) : (
                  <>Analyze AI Portrait & Compare Face <Sparkles size={18} /></>
                )}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Reusable Upload Column Card with preview, replace, and clear
 */
function UploadColumn({
  icon: Icon,
  colorClass,
  title,
  description,
  fileData,
  onSelect,
  onRemove,
  label,
  helper
}) {
  const fileInputRef = useRef(null);

  return (
    <div className="upload-column-card">
      <div className="upload-col-header">
        <div className={`upload-col-icon ${colorClass}`}>
          <Icon size={22} />
        </div>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={onSelect}
      />

      {fileData ? (
        <div className="guardian-dropzone has-preview">
          <div className="preview-container">
            <img src={fileData.previewUrl} alt={title} className="preview-img" />
            <div className="preview-actions">
              <span>{fileData.name} ({fileData.size})</span>
              <div className="preview-btn-group">
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Replace image"
                >
                  <RotateCcw size={13} /> Replace
                </button>
                <button
                  type="button"
                  className="action-btn danger"
                  onClick={onRemove}
                  title="Remove image"
                >
                  <X size={13} /> Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="guardian-dropzone"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <div className="upload-col-icon" style={{ marginBottom: 12 }}>
            <Upload size={22} />
          </div>
          <strong style={{ color: '#f1f5f9', fontSize: '0.95rem' }}>{label}</strong>
          <span style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: 4 }}>
            Click to browse or drag & drop file
          </span>
          <small style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 8 }}>{helper}</small>
        </div>
      )}
    </div>
  );
}

/**
 * Full Comprehensive Report View
 */
function ReportView({ report, onReset }) {
  const isSectionB = report.verificationType === 'ai_photo_verification';
  const faceDec = report.faceComparison?.decision;
  const aiDec = report.aiImageAnalysis?.decision;

  // Decision class mappings
  const getFaceVerdictClass = (dec) => {
    if (dec === 'SAME PERSON') return 'match';
    if (dec === 'DIFFERENT PERSON') return 'diff';
    return 'inconclusive';
  };

  const getAiVerdictClass = (dec) => {
    if (dec === 'LIKELY AI-GENERATED/MANIPULATED') return 'ai-detected';
    if (dec === 'LIKELY REAL-LIKE') return 'match';
    return 'inconclusive';
  };

  return (
    <div className="guardian-report-card">
      {/* Header with ID and actions */}
      <div className="report-header">
        <div className="report-header-left">
          <div className="report-type-badge">
            <ShieldCheck size={14} />
            <span>{isSectionB ? 'AI Photo & Identity Analysis' : 'ID Photo Verification'}</span>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#f8fafc' }}>
              Verification Report: {report.reportId}
            </h2>
            <div className="report-meta-text">
              Generated: {new Date(report.timestamp).toLocaleString()} · Status: <strong>{report.status?.toUpperCase()}</strong>
            </div>
          </div>
        </div>

        <div className="report-actions">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print / Export PDF
          </Button>
          <Button onClick={onReset}>
            <RotateCcw size={16} /> New Verification
          </Button>
        </div>
      </div>

      {/* Input Previews */}
      <div className="report-images-row">
        <div className="report-image-box">
          <img src={report.inputPreviews?.image1?.url} alt="Image 1" />
          <span>{report.inputPreviews?.image1?.label}</span>
        </div>
        <div className="report-image-box">
          <img src={report.inputPreviews?.image2?.url} alt="Image 2" />
          <span>{report.inputPreviews?.image2?.label}</span>
        </div>
      </div>

      {/* SECTION 1: Face Comparison Verdict */}
      <div className={`verdict-banner ${getFaceVerdictClass(faceDec)}`}>
        <div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
            Facial Identity Decision
          </span>
          <div className="verdict-badge">
            {faceDec === 'SAME PERSON' && <CheckCircle2 size={26} />}
            {faceDec === 'DIFFERENT PERSON' && <XCircle size={26} />}
            {faceDec === 'INCONCLUSIVE' && <HelpCircle size={26} />}
            <span>{faceDec}</span>
          </div>
          <p className="explanation-paragraph" style={{ marginTop: 8 }}>
            {report.faceComparison?.explanation}
          </p>
        </div>

        {report.faceComparison?.similarityScore !== null && (
          <div className="verdict-score-display">
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>
              Similarity Score
            </span>
            <span className="score-num">
              {report.faceComparison?.similarityScore}%
            </span>
            <span className="threshold-label">
              Verification Threshold: {report.faceComparison?.threshold}%
            </span>
          </div>
        )}
      </div>

      {/* SECTION 2 (If Section B): AI-Generated Image Verdict */}
      {isSectionB && (
        <div className={`verdict-banner ${getAiVerdictClass(aiDec)}`}>
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>
              AI Generation & Manipulation Analysis
            </span>
            <div className="verdict-badge">
              <Sparkles size={26} />
              <span>{aiDec}</span>
            </div>
            <p className="explanation-paragraph" style={{ marginTop: 8 }}>
              {report.aiImageAnalysis?.explanation}
            </p>
          </div>

          {report.aiImageAnalysis?.aiProbability !== null && (
            <div className="verdict-score-display">
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                Synthetic Probability
              </span>
              <span className="score-num" style={{ color: '#c084fc' }}>
                {Math.round(report.aiImageAnalysis.aiProbability * 100)}%
              </span>
              <span className="threshold-label">
                Confidence: {report.aiImageAnalysis?.confidence}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Image Quality Checks */}
      <div>
        <h4 style={{ margin: '0 0 12px 0', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eye size={18} /> Image Quality & Suitability Assessment
        </h4>
        <div className="report-details-grid">
          <div className="detail-metric-card">
            <span className="label">Primary Image Sharpness</span>
            <strong className="val">{report.imageQuality?.image1?.sharpnessRating || 'Evaluated'}</strong>
            <small className="sub">Variance: {report.imageQuality?.image1?.sharpnessScore ?? 'N/A'}</small>
          </div>
          <div className="detail-metric-card">
            <span className="label">Primary Image Exposure</span>
            <strong className="val">{report.imageQuality?.image1?.exposure || 'Normal'}</strong>
            <small className="sub">Luminance: {report.imageQuality?.image1?.brightnessScore ?? 'N/A'}</small>
          </div>
          <div className="detail-metric-card">
            <span className="label">Secondary Image Sharpness</span>
            <strong className="val">{report.imageQuality?.image2?.sharpnessRating || 'Evaluated'}</strong>
            <small className="sub">Variance: {report.imageQuality?.image2?.sharpnessScore ?? 'N/A'}</small>
          </div>
          <div className="detail-metric-card">
            <span className="label">Secondary Image Exposure</span>
            <strong className="val">{report.imageQuality?.image2?.exposure || 'Normal'}</strong>
            <small className="sub">Luminance: {report.imageQuality?.image2?.brightnessScore ?? 'N/A'}</small>
          </div>
        </div>
      </div>

      {/* Model & Service Info */}
      <div className="detail-metric-card" style={{ background: 'rgba(2, 6, 23, 0.5)' }}>
        <span className="label">Active Vision Models & Engines</span>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 4, fontSize: '0.88rem', color: '#cbd5e1' }}>
          <div><strong>Face Engine:</strong> {report.modelInfo?.faceComparisonEngine} (v{report.modelInfo?.faceModelVersion})</div>
          {isSectionB && (
            <div><strong>AI Detector:</strong> {report.modelInfo?.aiDetectionEngine} (v{report.modelInfo?.aiDetectionVersion})</div>
          )}
          {report.modelInfo?.cloudDetectionProvider && (
            <div><strong>Cloud Provider:</strong> {report.modelInfo.cloudDetectionProvider}</div>
          )}
        </div>
      </div>

      {/* Warnings & Limitations */}
      <div className="report-disclaimers">
        <h4><Info size={16} /> Disclaimers, Limitations & Recommendations</h4>
        <ul>
          {report.warnings?.map((w, i) => (
            <li key={i} style={{ color: '#fbbf24' }}><strong>Warning:</strong> {w}</li>
          ))}
          {report.limitations?.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
          <li>
            <strong>Liveness Notice:</strong> A pair of 2D still images cannot establish that a living person was physically present during image acquisition.
          </li>
          <li>
            <strong>Legal Notice:</strong> This software is an authenticity and identity verification aid. Critical authorization decisions must incorporate multi-factor authentication and official identity registry lookups.
          </li>
        </ul>
      </div>
    </div>
  );
}

export default IdentityGuardianView;

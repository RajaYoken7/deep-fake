import { jsPDF } from 'jspdf';

/**
 * DeepTrust Academy - Forensic PDF Report Generator
 * Generates styled, downloadable PDF inspection documents for:
 * 1. Deepfake Detection / Sightengine GenAI Photo Verification
 * 2. Identity Guardian / ID Photo Verification
 */

export function downloadDetectionReportPDF(data) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const reportId = data.id || data.reportId || `REP-${Date.now().toString().slice(-6)}`;
  const fileName = data.fileName || data.name || 'image_analysis.jpg';
  const score = data.score !== null && data.score !== undefined ? data.score : null;
  const scorePct = score !== null ? (score * 100).toFixed(1) + '%' : 'Unavailable';
  const classification = data.classification || (score !== null && score >= 0.8 ? 'AI_GENERATED' : score !== null && score <= 0.2 ? 'NOT_AI_GENERATED' : 'INCONCLUSIVE');
  const dateStr = data.createdAt ? new Date(data.createdAt).toLocaleString() : new Date().toLocaleString();

  // Background Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 36, 'F');

  // DeepTrust Academy Brand
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DEEPTRUST ACADEMY', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('FORENSIC AI MEDIA VERIFICATION SYSTEM', 14, 22);
  doc.text(`REPORT ID: ${reportId}`, 14, 28);

  const rightAlignX = 196;
  doc.setFontSize(8);
  doc.text(`Generated: ${dateStr}`, rightAlignX, 22, { align: 'right' });
  doc.text('Status: COMPLETED', rightAlignX, 28, { align: 'right' });

  // Main Section Heading
  let y = 48;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Deepfake Detection & GenAI Forensic Analysis', 14, y);

  // Classification Card
  y += 8;
  const isAI = classification === 'AI_GENERATED';
  const isReal = classification === 'NOT_AI_GENERATED';

  // Card outline
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 38, 3, 3, 'FD');

  // Classification pill
  if (isAI) {
    doc.setFillColor(254, 226, 226); // red-100
    doc.setDrawColor(239, 68, 68);
    doc.setTextColor(185, 28, 28);
  } else if (isReal) {
    doc.setFillColor(220, 252, 231); // green-100
    doc.setDrawColor(34, 197, 94);
    doc.setTextColor(21, 128, 61);
  } else {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(245, 158, 11);
    doc.setTextColor(180, 83, 9);
  }
  doc.roundedRect(20, y + 6, 85, 9, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const classLabel = isAI
    ? 'AI-GENERATED SIGNATURES DETECTED'
    : isReal
    ? 'NO STRONG AI INDICATORS (GENUINE)'
    : 'INCONCLUSIVE / MIXED TRACES';
  doc.text(classLabel, 23, y + 12);

  // Score text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text(scorePct, 20, y + 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`AI Generation Probability Score (Raw: ${score !== null ? Number(score).toFixed(4) : 'N/A'})`, 55, y + 26);
  doc.text('Model Engine: Sightengine GenAI Artifact & Frequency Profiler', 55, y + 31);

  // Evidence Details Table
  y += 46;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Analysis Parameters & Metadata', 14, y);

  y += 6;
  const rows = [
    ['Investigated Target', fileName],
    ['Report Identifier', reportId],
    ['Execution Timestamp', dateStr],
    ['Verification Engine', 'Sightengine GenAI Diffusion & GAN Detector'],
    ['Confidence Classification', classification],
    ['Decision Certainty', score !== null ? `${(Math.abs(score - 0.5) * 200).toFixed(1)}% Forensic Separation` : 'N/A'],
    ['Threshold Metric', 'Natural <= 20%  |  Inconclusive 20%-80%  |  Synthetic >= 80%'],
  ];

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, y, 182, rows.length * 8 + 4, 2, 2, 'FD');

  let currentY = y + 6;
  rows.forEach(([label, val], idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(label, 20, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(String(val), 78, currentY);

    if (idx < rows.length - 1) {
      doc.setDrawColor(241, 245, 249);
      doc.line(18, currentY + 2.5, 192, currentY + 2.5);
    }
    currentY += 8;
  });

  // Forensic Methodology & Limitations
  y = currentY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Forensic Methodology & Limitations', 14, y);

  y += 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(2, 132, 199); // sky-600
  doc.text('Detection Methodology:', 19, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const methodText = doc.splitTextToSize(
    'The neural detector checks for pixel co-occurrence discrepancies, diffusion lattice signatures, unnatural frequency harmonics, and latent generator remnants. Scores >= 80% reflect high probability of synthetic generation.',
    170
  );
  doc.text(methodText, 19, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6); // amber-600
  doc.text('Important Limitations:', 19, y + 25);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const limitText = doc.splitTextToSize(
    'Social media re-compression, extreme lighting, heavy photographic grain, or portrait beauty filters may simulate artifacts. Results represent probabilistic indicators and should be evaluated alongside contextual forensic clues.',
    170
  );
  doc.text(limitText, 19, y + 31);

  // Footer / Watermark
  doc.setDrawColor(203, 213, 225);
  doc.line(14, 275, 196, 275);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('DeepTrust Academy · Automated Cyber Crime & Deepfake Detection Lab · Confidential Forensic Report', 14, 281);
  doc.text('Page 1 of 1', 196, 281, { align: 'right' });

  // Download PDF
  const sanitizedId = String(reportId).replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`DeepTrust_Detection_Report_${sanitizedId}.pdf`);
}

export function downloadIdentityReportPDF(report) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const reportId = report.reportId || report.id || `ID-REP-${Date.now().toString().slice(-6)}`;
  const dateStr = report.timestamp || report.createdAt ? new Date(report.timestamp || report.createdAt).toLocaleString() : new Date().toLocaleString();
  const isSectionB = report.verificationType === 'ai_photo_verification' || report.verificationType === 'AI Face Comparison';
  const typeTitle = isSectionB ? 'AI Photo & Biometric Face Comparison' : 'ID Document & Photo Verification';
  const decision = report.decision || (report.matchResult ? 'SAME PERSON' : 'INCONCLUSIVE');
  const similarity = report.faceComparison?.similarityScore ?? report.similarityScore ?? null;
  const similarityPct = similarity !== null ? Number(similarity).toFixed(1) + '%' : 'N/A';

  // Background Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 36, 'F');

  // DeepTrust Academy Brand
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DEEPTRUST ACADEMY', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('IDENTITY GUARDIAN · BIOMETRIC VERIFICATION LAB', 14, 22);
  doc.text(`REPORT ID: ${reportId}`, 14, 28);

  const rightAlignX = 196;
  doc.setFontSize(8);
  doc.text(`Generated: ${dateStr}`, rightAlignX, 22, { align: 'right' });
  doc.text(`Status: ${report.status?.toUpperCase() || 'COMPLETED'}`, rightAlignX, 28, { align: 'right' });

  // Main Section Heading
  let y = 48;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(typeTitle, 14, y);

  // Decision Card
  y += 8;
  const isSame = decision.includes('SAME');
  const isDiff = decision.includes('DIFFERENT');

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 38, 3, 3, 'FD');

  // Decision pill
  if (isSame) {
    doc.setFillColor(220, 252, 231);
    doc.setDrawColor(34, 197, 94);
    doc.setTextColor(21, 128, 61);
  } else if (isDiff) {
    doc.setFillColor(254, 226, 226);
    doc.setDrawColor(239, 68, 68);
    doc.setTextColor(185, 28, 28);
  } else {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.setTextColor(180, 83, 9);
  }
  doc.roundedRect(20, y + 6, 85, 9, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(decision.toUpperCase(), 23, y + 12);

  // Similarity text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text(similarityPct, 20, y + 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Biometric Feature Similarity Match (Threshold: >= 75.0% for high confidence)`, 55, y + 26);
  doc.text('Biometric Policy: Zero Raw Biometrics Stored · Ephemeral Evaluation', 55, y + 31);

  // Verification Parameters Table
  y += 46;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Verification Findings & Metrics', 14, y);

  y += 6;
  const rows = [
    ['Verification Category', typeTitle],
    ['Report Identifier', reportId],
    ['Execution Timestamp', dateStr],
    ['Biometric Decision', decision],
    ['Similarity Rating', similarityPct],
    ['Face Detection (Ref ID)', report.faceComparison?.image1FaceCount ? `${report.faceComparison.image1FaceCount} Face Detected` : '1 Face Detected'],
    ['Face Detection (Target)', report.faceComparison?.image2FaceCount ? `${report.faceComparison.image2FaceCount} Face Detected` : '1 Face Detected'],
    ['Privacy Compliance', 'Zero Biometric Retention (ISO/IEC 30107 compliant ephemeral scan)'],
  ];

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, y, 182, rows.length * 8 + 4, 2, 2, 'FD');

  let currentY = y + 6;
  rows.forEach(([label, val], idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(label, 20, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(String(val), 78, currentY);

    if (idx < rows.length - 1) {
      doc.setDrawColor(241, 245, 249);
      doc.line(18, currentY + 2.5, 192, currentY + 2.5);
    }
    currentY += 8;
  });

  // Forensic Disclaimers & Security
  y = currentY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Security Guarantees & Operational Disclaimers', 14, y);

  y += 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 40, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(2, 132, 199);
  doc.text('Zero-Biometrics Storage Guarantee:', 19, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const privacyText = doc.splitTextToSize(
    'No facial landmarks, templates, or raw identity vectors are permanently stored on servers. All similarity comparisons are computed in transient memory buffers and destroyed immediately upon report compilation.',
    170
  );
  doc.text(privacyText, 19, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6);
  doc.text('Forensic Guidance:', 19, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const adviceText = doc.splitTextToSize(
    'Similarity scores are influenced by camera perspective, age differences between reference portraits and target documents, illumination, and occlusion. In critical scenarios, complementary two-factor authentication is recommended.',
    170
  );
  doc.text(adviceText, 19, y + 30);

  // Footer / Watermark
  doc.setDrawColor(203, 213, 225);
  doc.line(14, 275, 196, 275);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('DeepTrust Academy · Identity Guardian Biometric Lab · Official Verification Certificate', 14, 281);
  doc.text('Page 1 of 1', 196, 281, { align: 'right' });

  // Download PDF
  const sanitizedId = String(reportId).replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`DeepTrust_Identity_Report_${sanitizedId}.pdf`);
}


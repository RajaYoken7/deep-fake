import { CyberCrimeRound } from '../models/CyberCrimeRound.js';
import { CyberCrimeQuestion } from '../models/CyberCrimeQuestion.js';
import { User } from '../models/User.js';

export async function seedCyberCrimeRounds() {
  const roundCount = await CyberCrimeRound.countDocuments();
  if (roundCount > 0) {
    return;
  }

  const admin = await User.findOne({ role: 'ADMIN' });
  const adminId = admin ? admin._id : null;

  console.log('[CyberCrime Seed] Pre-seeding default published investigation rounds and questions...');

  const defaultRounds = [
    {
      roundId: 'ROUND-01',
      roundNumber: 1,
      roundTitle: 'The Phishing Trap',
      caseDossierTitle: 'Case Evidence Dossier',
      evidenceCategory: 'Email Security & Suspicious Link',
      incidentDescription:
        'An employee receives an unexpected email warning that their work account will be locked within 30 minutes unless they click a link to verify their password.',
      interceptedCommunication:
        'From: IT Support Desk <support@novatech-security.com>\nSubject: Urgent: Your Company Account Will Be Locked!\nDestination: http://novatech-account-verify.net/login',
      forensicClues:
        '1. Artificial Urgency: The message demands verification within 30 minutes to induce panic.\n2. Suspicious Domain: The sender (@novatech-security.com) differs from the authentic company domain (novatech.com).\n3. Insecure Protocol: The destination link uses unencrypted http:// rather than https://.',
      difficulty: 'Easy',
      publicationStatus: 'PUBLISHED',
      status: 'PUBLISHED',
      isActive: true,
      createdBy: adminId,
    },
    {
      roundId: 'ROUND-02',
      roundNumber: 2,
      roundTitle: 'The Fake Identity',
      caseDossierTitle: 'Executive Impersonation Dossier',
      evidenceCategory: 'Social Engineering & Executive Fraud',
      incidentDescription:
        'An urgent, confidential message arrives purportedly from company leadership demanding immediate emergency gift cards or vendor payment while bypassing normal finance authorizations.',
      interceptedCommunication:
        'From: Executive Mobile Office <exec-urgent-dispatch@gmail-temp.com>\nSubject: Confidential - Immediate $4,500 vendor remittance required before 11 AM.',
      forensicClues:
        '1. Free Webmail Domain: Sender using external disposable gmail address.\n2. Internal Control Bypass: Requesting payment without standard purchase order or dual approvals.',
      difficulty: 'Medium',
      publicationStatus: 'PUBLISHED',
      status: 'PUBLISHED',
      isActive: true,
      createdBy: adminId,
    },
    {
      roundId: 'ROUND-03',
      roundNumber: 3,
      roundTitle: 'The Suspicious Transaction',
      caseDossierTitle: 'Banking Fraud & OTP Hijacking Dossier',
      evidenceCategory: 'Financial Fraud & Vishing Attack',
      incidentDescription:
        'A mobile user receives a panic-inducing SMS reporting an unauthorized $1,280 charge with an urgent phone callback number asking for their one-time passcode.',
      interceptedCommunication:
        'SMS Alert: $1,280.00 charged to your account. If unauthorized, call 1-800-BANK-FRAUD now and provide the 6-digit verification code sent to your phone.',
      forensicClues:
        '1. Credential Harvesting: Legitimate banks never solicit secret OTP or PIN numbers.\n2. Vishing Call Center: Phone number routes to a fraudulent spoofed call center.',
      difficulty: 'Hard',
      publicationStatus: 'PUBLISHED',
      status: 'PUBLISHED',
      isActive: true,
      createdBy: adminId,
    },
  ];

  await CyberCrimeRound.insertMany(defaultRounds);

  const defaultQuestions = [
    // Round 1 Questions
    {
      questionId: 'CCQ-001',
      roundId: 'ROUND-01',
      questionOrder: 1,
      questionText:
        'What is the most obvious warning sign that this email is a phishing attempt?',
      options: {
        a: 'The message creates intense artificial urgency with a 30-minute deadline.',
        b: 'The email arrived during regular office hours.',
        c: 'The email mentions the company name in the signature.',
        d: 'The email was addressed to the employee.',
      },
      correctAnswer: 'A',
      explanation:
        'Scammers create artificial deadlines like 30 minutes to make you panic and click before checking if the message is genuine.',
      difficulty: 'Easy',
      xpReward: 10,
      publicationStatus: 'PUBLISHED',
      status: 'PUBLISHED',
      isActive: true,
      createdBy: adminId,
    },
    {
      questionId: 'CCQ-002',
      roundId: 'ROUND-01',
      questionOrder: 2,
      questionText:
        'What makes the sender address and web link suspicious?',
      options: {
        a: 'The sender address contains the word support.',
        b: 'Both addresses use lookalike domains that do not match the real company website.',
        c: 'The link requires an internet connection.',
        d: 'The message was sent from a web server.',
      },
      correctAnswer: 'B',
      explanation:
        'Scammers register similar-sounding website names (like novatech-security.com) to impersonate real organizations. Always inspect domain names carefully.',
      difficulty: 'Easy',
      xpReward: 10,
      publicationStatus: 'PUBLISHED',
      status: 'PUBLISHED',
      isActive: true,
      createdBy: adminId,
    },
    {
      questionId: 'CCQ-003',
      roundId: 'ROUND-01',
      questionOrder: 3,
      questionText:
        'What is the safest action to take when receiving this unexpected email?',
      options: {
        a: 'Click the link to check if the login screen looks official.',
        b: 'Reply to the sender asking if they really need your password.',
        c: 'Do not click the link, and report the email to your official IT support team.',
        d: 'Forward the email to coworkers so they can test their links.',
      },
      correctAnswer: 'C',
      explanation:
        'Never click links or reply to suspicious emails. Always report unexpected security alerts directly to your official IT department.',
      difficulty: 'Easy',
      xpReward: 10,
      publicationStatus: 'PUBLISHED',
      status: 'PUBLISHED',
      isActive: true,
      createdBy: adminId,
    },

    // Round 2 Questions
    {
      questionId: 'CCQ-004',
      roundId: 'ROUND-02',
      questionOrder: 1,
      questionText:
        'Why should an employee be suspicious of an executive requesting an urgent wire transfer via an external email address?',
      options: {
        a: 'Executives never send emails before noon.',
        b: 'Executive impersonation attacks frequently use external email services to bypass corporate financial authorization processes.',
        c: 'Wire transfers are not permitted in modern business.',
        d: 'External email accounts are illegal for corporate executives.',
      },
      correctAnswer: 'B',
      explanation:
        'Business Email Compromise (BEC) attackers impersonate high-level executives to rush employees into bypassing established approval protocols.',
      difficulty: 'Medium',
      xpReward: 10,
      publicationStatus: 'PUBLISHED',
      status: 'PUBLISHED',
      isActive: true,
      createdBy: adminId,
    },
    {
      questionId: 'CCQ-005',
      roundId: 'ROUND-02',
      questionOrder: 2,
      questionText:
        'What protocol should an employee follow before executing an unexpected high-value payment request?',
      options: {
        a: 'Immediately wire the money to avoid executive displeasure.',
        b: 'Perform out-of-band verification using a known, verified phone number or in-person confirmation.',
        c: 'Post about the request on public social media.',
        d: 'Ask the sender to send an email from a second external address.',
      },
      correctAnswer: 'B',
      explanation:
        'Out-of-band verification via a known authentic phone channel confirms whether the request originated from the authentic executive.',
      difficulty: 'Medium',
      xpReward: 10,
      publicationStatus: 'PUBLISHED',
      status: 'PUBLISHED',
      isActive: true,
      createdBy: adminId,
    },

    // Round 3 Questions
    {
      questionId: 'CCQ-006',
      roundId: 'ROUND-03',
      questionOrder: 1,
      questionText:
        'A text message asks you to call an urgent phone number and share a 6-digit OTP code to reverse a bank charge. What should you do?',
      options: {
        a: 'Call the number immediately and provide the code to protect your account.',
        b: 'Recognize this as a vishing and OTP harvesting attack; banks never ask for your one-time password.',
        c: 'Text back your account password instead.',
        d: 'Forward the OTP code to your friends.',
      },
      correctAnswer: 'B',
      explanation:
        'One-Time Passcodes (OTPs) grant immediate access to authenticate transactions. Legitimate financial institutions will never ask customers to disclose them.',
      difficulty: 'Hard',
      xpReward: 10,
      publicationStatus: 'PUBLISHED',
      status: 'PUBLISHED',
      isActive: true,
      createdBy: adminId,
    },
  ];

  await CyberCrimeQuestion.insertMany(defaultQuestions);
  console.log(`[CyberCrime Seed] Seeded ${defaultRounds.length} rounds and ${defaultQuestions.length} questions.`);
}


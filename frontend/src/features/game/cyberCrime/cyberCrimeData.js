/**
 * Cyber Crime Investigation — Game Scenarios, Questions & Missions Data
 * Follow the evidence. Uncover the attack. Protect the digital world.
 *
 * Beginner-to-Intermediate Educational Difficulty
 * All scenarios, companies, usernames, and addresses are entirely fictional.
 */

export const GAME_TITLE = 'Cyber Crime Investigation';
export const GAME_SUBTITLE = 'Follow the evidence. Uncover the attack. Protect the digital world.';

// Investigation Rounds Configuration
export const INVESTIGATION_ROUNDS = [
  {
    id: 'round-1',
    roundNumber: 1,
    title: 'The Phishing Trap',
    subtitle: 'Suspicious Emails & Link Safety',
    category: 'Email Security',
    badgeColor: 'purple',
    overview:
      'An employee receives an unexpected email warning that their account will be locked unless they verify their password within 30 minutes.',
    evidenceData: {
      emailHeader: {
        fromName: 'IT Support Desk',
        fromEmail: 'support@novatech-security.com',
        legitimateDomain: 'novatech.com',
        toEmail: 'alex.morgan@novatech.com',
        replyTo: 'verify-login@external-support-desk.com',
        date: 'Today, 09:14 AM',
        subject: 'Urgent: Your Company Account Will Be Locked!',
        priority: 'High (Immediate Action Required)',
      },
      emailBody: `Hello Alex,

We noticed unusual sign-in activity on your company account. To prevent temporary suspension, verify your account credentials within 30 minutes using the link below:

http://novatech-account-verify.net/login

Failure to verify will result in your account being locked.

Sincerely,
IT Support Team
NovaTech Corporation`,
      suspiciousLink: {
        displayText: 'http://novatech-account-verify.net/login',
        destinationUrl: 'http://novatech-account-verify.net/login',
        protocol: 'Insecure web link (http:// instead of https://)',
        domainRegistered: 'Website created only 3 days ago',
      },
      forensicClues: [
        {
          id: 'clue-1',
          label: 'Artificial Urgency',
          detail: 'The message demands verification within 30 minutes to make you panic and click without thinking.',
          type: 'warning',
        },
        {
          id: 'clue-2',
          label: 'Suspicious Sender & Reply-To',
          detail: 'The sender address (@novatech-security.com) and reply-to address differ from the real company website (novatech.com).',
          type: 'danger',
        },
        {
          id: 'clue-3',
          label: 'Unusual Link Address',
          detail: 'The link points to an external .net website registered 3 days ago over an unencrypted http:// connection.',
          type: 'danger',
        },
      ],
    },
    questions: [
      {
        id: 'r1-q1',
        roundId: 'round-1',
        questionNumber: 1,
        question: 'What is the most obvious warning sign that this email could be a phishing attempt?',
        options: [
          {
            id: 'a',
            text: 'The email was sent to an employee during normal morning office hours.',
          },
          {
            id: 'b',
            text: 'The email creates intense urgency by threatening to lock the account within 30 minutes.',
          },
          {
            id: 'c',
            text: 'The email addresses the employee by their first name Alex.',
          },
          {
            id: 'd',
            text: 'The email mentions NovaTech in the closing signature.',
          },
        ],
        correctOptionId: 'b',
        explanation:
          'Phishing messages often manufacture fake urgency, such as a 30-minute deadline, to pressure you into acting quickly before checking if the email is legitimate.',
      },
      {
        id: 'r1-q2',
        roundId: 'round-1',
        questionNumber: 2,
        question: 'When checking the sender address and link details, what makes them suspicious?',
        options: [
          {
            id: 'a',
            text: 'Both the sender and link use external addresses that do not match the real company website.',
          },
          {
            id: 'b',
            text: 'The sender address includes the word "support".',
          },
          {
            id: 'c',
            text: 'The link requires an active internet connection to open.',
          },
          {
            id: 'd',
            text: 'The email was sent from a desktop computer instead of a phone.',
          },
        ],
        correctOptionId: 'a',
        explanation:
          'Scammers often register lookalike domain names like "novatech-security.com" or "novatech-account-verify.net" to mimic real companies. Always inspect the exact web address.',
      },
      {
        id: 'r1-q3',
        roundId: 'round-1',
        questionNumber: 3,
        question: 'What is the safest action Alex should take after receiving this email?',
        options: [
          {
            id: 'a',
            text: 'Click the link quickly to see if the login page looks like the real portal.',
          },
          {
            id: 'b',
            text: 'Reply directly to the email and ask if they really need the password.',
          },
          {
            id: 'c',
            text: 'Forward the email to coworkers so they can test their links too.',
          },
          {
            id: 'd',
            text: 'Do not click the link, and report the message to the official IT support team.',
          },
        ],
        correctOptionId: 'd',
        explanation:
          'Never click links or submit credentials from unexpected warning emails. Verify through official internal channels or by contacting IT support directly.',
      },
    ],
  },
  {
    id: 'round-2',
    roundNumber: 2,
    title: 'The Fake Identity',
    subtitle: 'Impersonation & Social Engineering',
    category: 'Identity Security',
    badgeColor: 'blue',
    overview:
      'A message from a newly created profile claims to be Chief Operations Officer Sarah Chen, asking for an urgent money transfer for a vendor lunch.',
    evidenceData: {
      profileInfo: {
        displayName: 'Sarah Chen — Operations Lead',
        handle: '@sarah_chen_official',
        officialRealHandle: '@sarahchen',
        avatarNote: 'Public corporate headshot copied from website',
        accountCreated: '2 days ago',
        followersCount: '4 accounts (all newly created)',
        mutualConnections: 0,
        departmentLabel: 'Operations & Planning',
      },
      chatMessages: [
        {
          sender: 'Sarah Chen [COO]',
          time: '11:42 AM',
          text: 'Hi David! Are you at your desk? I am attending an offsite meeting and my company credit card is temporarily declined.',
        },
        {
          sender: 'David Kim',
          time: '11:44 AM',
          text: 'Hi Sarah, yes I am at my desk. Is everything alright?',
        },
        {
          sender: 'Sarah Chen [COO]',
          time: '11:45 AM',
          text: 'Can you urgently buy two $100 gift cards or send $200 so I can pay the caterer? Please keep this private for now—I will repay you this evening.',
        },
      ],
      discrepancyChecks: [
        {
          id: 'disc-1',
          item: 'Username Variation',
          finding: 'Account handle is @sarah_chen_official instead of Sarah\'s real account @sarahchen.',
        },
        {
          id: 'disc-2',
          item: 'New Account',
          finding: 'Profile was created only 2 days ago with zero mutual team connections.',
        },
        {
          id: 'disc-3',
          item: 'Urgent Secrecy & Gift Cards',
          finding: 'Requester asks for gift cards or quick transfers and demands keeping it confidential.',
        },
      ],
    },
    questions: [
      {
        id: 'r2-q1',
        roundId: 'round-2',
        questionNumber: 4,
        question: 'Which clue in Sarah\'s profile strongly indicates that this account is an imposter?',
        options: [
          {
            id: 'a',
            text: 'The profile was created 2 days ago and has a slightly different username handle.',
          },
          {
            id: 'b',
            text: 'The display name mentions that Sarah is the Operations Lead.',
          },
          {
            id: 'c',
            text: 'The profile photo matches Sarah\'s public company picture.',
          },
          {
            id: 'd',
            text: 'The message was sent during normal morning working hours.',
          },
        ],
        correctOptionId: 'a',
        explanation:
          'Scammers easily copy public photos and names, but cannot fake account history. A newly created account with an altered username is a clear sign of impersonation.',
      },
      {
        id: 'r2-q2',
        roundId: 'round-2',
        questionNumber: 5,
        question: 'Why does the sender ask for gift cards and insist on keeping the conversation confidential?',
        options: [
          {
            id: 'a',
            text: 'Gift cards offer lower payment processing fees for corporate expenses.',
          },
          {
            id: 'b',
            text: 'Gift cards cannot be refunded, and secrecy prevents you from asking others.',
          },
          {
            id: 'c',
            text: 'Company travel policies prefer gift cards over corporate credit cards.',
          },
          {
            id: 'd',
            text: 'The sender wants to surprise coworkers with a gift later.',
          },
        ],
        correctOptionId: 'b',
        explanation:
          'Scammers ask for secrecy so you will not double-check with colleagues, and they request gift cards or instant transfers because those funds cannot be recovered or traced.',
      },
      {
        id: 'r2-q3',
        roundId: 'round-2',
        questionNumber: 6,
        question: 'What is the safest way for David to verify this request?',
        options: [
          {
            id: 'a',
            text: 'Send $50 first to test if the recipient is real before sending the rest.',
          },
          {
            id: 'b',
            text: 'Ask the sender personal questions inside the same chat window.',
          },
          {
            id: 'c',
            text: 'Call Sarah using her verified phone number or reach out via official company email.',
          },
          {
            id: 'd',
            text: 'Buy the gift cards but take a photo of the receipt for reimbursement.',
          },
        ],
        correctOptionId: 'c',
        explanation:
          'Always verify unexpected money or gift card requests through a trusted secondary channel, such as calling the person on their known phone number or speaking in person.',
      },
    ],
  },
  {
    id: 'round-3',
    roundNumber: 3,
    title: 'The Suspicious Transaction',
    subtitle: 'Account Alerts & Transaction Safety',
    category: 'Financial Cybersecurity',
    badgeColor: 'cyan',
    overview:
      'A user receives a text alert about an unexpected ₹8,500 bank transfer, followed by an unknown caller offering to cancel the payment.',
    evidenceData: {
      timeline: [
        {
          time: '14:10',
          event: 'Received SMS: "[BANK ALERT]: ₹8,500 transferred from your account. If this was not you, cancel immediately at: http://bank-cancel-support.com"',
          type: 'alert',
        },
        {
          time: '14:15',
          event: 'Phone call from an unknown number claiming to be "Bank Fraud Support", asking for the 6-digit OTP sent to your phone to reverse the charge.',
          type: 'warning',
        },
        {
          time: '14:20',
          event: 'User opens their official mobile banking app and observes an unrecognized transaction is currently pending.',
          type: 'danger',
        },
      ],
      bankNotice: {
        accountName: 'Savings Account (****4192)',
        currentBalance: '₹14,250.00 (Previous: ₹22,750.00)',
        disputedAmount: '₹8,500.00',
        beneficiary: 'Unfamiliar Payee: John Doe',
        flaggedSuspicion: 'Transaction initiated from an unrecognized device.',
      },
      auditTakeaways: [
        {
          title: 'Never Share One-Time Passcodes (OTP)',
          description: 'Legitimate banks will never call or message asking you to read back your OTP or secret PIN.',
        },
        {
          title: 'Use Official Contact Channels',
          description: 'Always contact your bank through the phone number printed on the back of your card or inside the official app.',
        },
      ],
    },
    questions: [
      {
        id: 'r3-q1',
        roundId: 'round-3',
        questionNumber: 7,
        question: 'What is the biggest danger of clicking the "cancel payment" link in the SMS?',
        options: [
          {
            id: 'a',
            text: 'The link leads to a fake website designed to steal your banking login details.',
          },
          {
            id: 'b',
            text: 'Clicking the link will automatically change your phone wallpaper.',
          },
          {
            id: 'c',
            text: 'The link will immediately drain your phone battery to zero.',
          },
          {
            id: 'd',
            text: 'The link will unsubscribe you from all future banking text messages.',
          },
        ],
        correctOptionId: 'a',
        explanation:
          'Scam messages often contain fake cancellation links. Clicking them takes you to an imposter site that steals your username, password, or card number.',
      },
      {
        id: 'r3-q2',
        roundId: 'round-3',
        questionNumber: 8,
        question: 'The caller claiming to be from the bank asks for your 6-digit OTP to reverse the charge. What should you do?',
        options: [
          {
            id: 'a',
            text: 'Share the OTP immediately so the caller can stop the transfer.',
          },
          {
            id: 'b',
            text: 'Read only the first three digits of the OTP to test the caller.',
          },
          {
            id: 'c',
            text: 'Never share the OTP, hang up, and call the bank using the number on your card.',
          },
          {
            id: 'd',
            text: 'Send the OTP in a text message to the number that called you.',
          },
        ],
        correctOptionId: 'c',
        explanation:
          'Real banks will never ask for your one-time passcode (OTP). Sharing your OTP allows the scammer to approve the fraudulent transfer from your account.',
      },
      {
        id: 'r3-q3',
        roundId: 'round-3',
        questionNumber: 9,
        question: 'After hanging up, what are the best immediate steps to protect your account?',
        options: [
          {
            id: 'a',
            text: 'Wait for your next monthly account statement to see if the money returns.',
          },
          {
            id: 'b',
            text: 'Freeze your card in the official app, contact the bank directly, and change your password.',
          },
          {
            id: 'c',
            text: 'Reply to the text message asking the caller why they wanted your OTP.',
          },
          {
            id: 'd',
            text: 'Turn off your phone for 24 hours so no new charges can occur.',
          },
        ],
        correctOptionId: 'b',
        explanation:
          'Immediately freeze your account or card using the official banking app, call your bank using the phone number on your card to report fraud, and update your passwords from a secure device.',
      },
    ],
  },
];

// Flat list of all 9 campaign questions
export const ALL_CAMPAIGN_QUESTIONS = INVESTIGATION_ROUNDS.flatMap((r) => r.questions);

// Predefined Pool of Daily Missions (Beginner to Intermediate)
export const DAILY_MISSIONS_POOL = [
  {
    id: 'dm-phish-spotter',
    title: 'Spot the Phishing Email',
    category: 'Phishing',
    difficulty: 'Beginner',
    rewardXP: 25,
    description: 'Inspect an urgent package delivery notification and identify the suspicious warning sign.',
    objectives: [
      'Examine the sender address for lookalike domain names',
      'Spot artificial 24-hour urgency tactics',
      'Choose the safe response without clicking unknown links',
    ],
    taskScenario: {
      headline: 'Subject: Delivery Failed — Update Address Within 24 Hours',
      sender: 'notification@fast-parcel-delivery-service.com',
      body: 'Your package could not be delivered due to an incomplete address. Verify your delivery address within 24 hours to prevent your package from being returned to the sender.',
      link: 'http://fast-parcel-update.com/address',
    },
    question: {
      prompt: 'What makes this package delivery email suspicious?',
      options: [
        { id: 'a', text: 'The email arrived on a weekday morning.' },
        { id: 'b', text: 'It creates a 24-hour deadline and points to an unofficial web link.' },
        { id: 'c', text: 'The email was sent to your inbox.' },
        { id: 'd', text: 'The subject line mentions a delivery.' },
      ],
      correctOptionId: 'b',
      explanation:
        'Scammers use fake delivery alerts with tight deadlines to trick people into clicking unverified links and typing personal details.',
    },
  },
  {
    id: 'dm-identity-verifier',
    title: 'Verify the Identity',
    category: 'Impersonation',
    difficulty: 'Intermediate',
    rewardXP: 30,
    description: 'Evaluate an unexpected message from a stranger claiming to be a friend who lost their phone.',
    objectives: [
      'Spot unverified requests for emergency money',
      'Identify independent out-of-band verification methods',
      'Prevent financial loss from impersonation scams',
    ],
    taskScenario: {
      headline: 'Text Message from Unknown Number (+1-555-0199)',
      sender: 'Unknown Sender',
      body: 'Hey! This is Mark. I dropped my phone in water and borrowed this phone from a stranger. Can you quickly send $50 for a cab ride home? I will pay you back tomorrow morning.',
      link: 'Requested transfer via peer-to-peer cash app',
    },
    question: {
      prompt: 'What is the safest way to verify if your friend really sent this message?',
      options: [
        { id: 'a', text: 'Send the money right away since Mark is your friend.' },
        { id: 'b', text: 'Call Mark on his known phone number or contact a mutual friend to confirm.' },
        { id: 'c', text: 'Ask the sender to give you their current GPS coordinates.' },
        { id: 'd', text: 'Send half the requested amount to be safe.' },
      ],
      correctOptionId: 'b',
      explanation:
        'When an unknown number claims to be a friend in trouble, always call their known phone number or check with mutual friends before sending any money.',
    },
  },
  {
    id: 'dm-tx-investigator',
    title: 'Investigate the Transaction',
    category: 'Fraud Analysis',
    difficulty: 'Intermediate',
    rewardXP: 35,
    description: 'Analyze an unexpected notification showing a charge from an unfamiliar device in another country.',
    objectives: [
      'Identify signs of account compromise',
      'Protect account funds before further debits occur',
      'Follow proper bank dispute procedures',
    ],
    taskScenario: {
      headline: 'Bank Alert: $150 Charge from Electronics Store in Another Country',
      sender: 'Official Banking Notification',
      body: 'Your card ending in 4192 was charged $150.00 at an overseas electronics retailer. Your physical card is still safely in your wallet.',
      link: 'Location mismatch detected',
    },
    question: {
      prompt: 'How could this unauthorized charge have occurred while your card was still in your wallet?',
      options: [
        { id: 'a', text: 'Your card details were compromised online through a data breach or phishing site.' },
        { id: 'b', text: 'The store accidentally sent you a free promotional coupon.' },
        { id: 'c', text: 'The bank charges random fees to all accounts every month.' },
        { id: 'd', text: 'Your physical wallet stopped blocking wireless signals.' },
      ],
      correctOptionId: 'a',
      explanation:
        'Card information can be stolen online through phishing websites or data breaches without anyone physically touching your payment card.',
    },
  },
  {
    id: 'dm-safe-action',
    title: 'Choose the Safe Action',
    category: 'Incident Response',
    difficulty: 'Beginner',
    rewardXP: 25,
    description: 'Learn how to handle a scary web browser pop-up claiming your computer has multiple viruses.',
    objectives: [
      'Recognize fake security alert warnings',
      'Avoid calling fraudulent tech support hotlines',
      'Use genuine installed antivirus protection',
    ],
    taskScenario: {
      headline: 'Browser Pop-Up: "CRITICAL ALERT: 5 Viruses Detected!"',
      sender: 'Unsolicited Browser Window',
      body: 'Your screen is locked with loud beeping and a warning message: "Call 1-800-TECH-HELP immediately to clean your computer. Do not close this window."',
      link: 'Fake Support Number: 1-800-TECH-HELP',
    },
    question: {
      prompt: 'What is the safest way to handle this virus pop-up?',
      options: [
        { id: 'a', text: 'Call the phone number displayed on the screen to get help.' },
        { id: 'b', text: 'Close the browser window and run a scan with your trusted antivirus program.' },
        { id: 'c', text: 'Download the file recommended inside the pop-up window.' },
        { id: 'd', text: 'Leave the window open for several hours so it cleans itself.' },
      ],
      correctOptionId: 'b',
      explanation:
        'Fake virus pop-ups use scare tactics to trick you into calling scammers or installing malware. Close the window and run your genuine antivirus software.',
    },
  },
  {
    id: 'dm-evidence-detective',
    title: 'Evidence Detective',
    category: 'Forensics',
    difficulty: 'Intermediate',
    rewardXP: 30,
    description: 'Identify the catch behind a free smartphone giveaway offer that asks for a small shipping fee.',
    objectives: [
      'Distinguish legitimate promotions from fee-harvesting traps',
      'Protect credit card numbers and CVV codes from scams',
      'Identify common giveaway deception cues',
    ],
    taskScenario: {
      headline: 'Online Ad: "Congratulations! You Won a Free Smartphone!"',
      sender: 'Sponsored Web Banner',
      body: 'The page claims you were selected as the lucky winner of a $900 smartphone. To claim your prize, you only need to enter your credit card number to pay a $1 shipping fee.',
      link: 'Web form requesting: Card Number, Expiration Date, CVV',
    },
    question: {
      prompt: 'Why is entering your credit card details for this "free" prize dangerous?',
      options: [
        { id: 'a', text: 'Smartphones cannot be shipped through the postal service.' },
        { id: 'b', text: 'The small fee is a trap to steal your full credit card number and CVV.' },
        { id: 'c', text: 'Online giveaways always require an in-person passport check.' },
        { id: 'd', text: 'The smartphone will only work in another country.' },
      ],
      correctOptionId: 'b',
      explanation:
        'Scammers use fake giveaways with nominal shipping fees to trick victims into handing over their credit card numbers, expiration dates, and security codes.',
    },
  },
  {
    id: 'dm-social-eng-defense',
    title: 'Social Engineering Defense',
    category: 'Vishing & Pretexting',
    difficulty: 'Intermediate',
    rewardXP: 30,
    description: 'Respond safely to a phone caller claiming to be an internet technician asking for your password.',
    objectives: [
      'Recognize unsolicited credential requests over the phone',
      'Enforce password privacy guidelines',
      'Verify service calls through official directory numbers',
    ],
    taskScenario: {
      headline: 'Phone Call from "Internet Provider Maintenance Desk"',
      sender: 'Unsolicited Inbound Caller',
      body: 'The caller states: "We are upgrading neighborhood fiber internet speeds. Please read me your Wi-Fi password so we can boost your router connection remotely."',
      link: 'Unsolicited phone request',
    },
    question: {
      prompt: 'What should you do when a caller asks for your password over the phone?',
      options: [
        { id: 'a', text: 'Share the password because they work for the internet company.' },
        { id: 'b', text: 'Decline to share it, hang up, because real providers never ask for your password.' },
        { id: 'c', text: 'Give them an old password that you stopped using last year.' },
        { id: 'd', text: 'Ask them to call back late at night instead.' },
      ],
      correctOptionId: 'b',
      explanation:
        'Legitimate internet service providers manage connections from their end and will never ask for your private Wi-Fi password or account credentials over the phone.',
    },
  },
];

// Calculation Helpers
export function calculateAccuracy(correctCount, evaluatedCount) {
  if (!evaluatedCount || evaluatedCount <= 0) {
    return null; // Empty state indicator
  }
  const ratio = (correctCount / evaluatedCount) * 100;
  return Number(ratio.toFixed(2));
}

export function getPerformanceTier(accuracyPercentage) {
  if (accuracyPercentage === null || accuracyPercentage === undefined) {
    return {
      tier: 'Not Evaluated',
      badgeClass: 'badge-muted',
      message: 'Complete investigation questions to assess your performance.',
      color: 'gray',
    };
  }

  if (accuracyPercentage >= 90) {
    return {
      tier: 'Excellent Cyber Detective',
      badgeClass: 'badge-green',
      message: 'Outstanding investigative acumen! You spotted deceptive warning signs with great accuracy.',
      color: 'green',
    };
  }

  if (accuracyPercentage >= 75) {
    return {
      tier: 'Skilled Investigator',
      badgeClass: 'badge-cyan',
      message: 'Great observation skills! You identified key deception tactics and selected safe actions.',
      color: 'cyan',
    };
  }

  if (accuracyPercentage >= 50) {
    return {
      tier: 'Junior Investigator',
      badgeClass: 'badge-purple',
      message: 'Good progress! Review the evidence clues to sharpen your threat detection skills.',
      color: 'purple',
    };
  }

  return {
    tier: 'Keep Practising',
    badgeClass: 'badge-amber',
    message: 'Cyber awareness improves with practice. Review the explanations and try again!',
    color: 'amber',
  };
}

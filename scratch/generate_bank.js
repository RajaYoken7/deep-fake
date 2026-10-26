import fs from 'node:fs';
import path from 'node:path';

// Generate 30 questions for each of the 3 rounds (90 total)
const r1Questions = [
  {
    id: 'r1-01',
    roundId: 'round-1',
    topic: 'Urgent Account Lock Notice',
    scenario: 'An employee receives an email warning that their work account will be locked within 30 minutes unless they click a link to verify their password.',
    question: 'What is the most obvious warning sign that this email is a phishing attempt?',
    options: [
      { id: 'a', text: 'The email arrived during regular office hours.' },
      { id: 'b', text: 'The message creates intense artificial urgency with a 30-minute deadline.' },
      { id: 'c', text: 'The email mentions the company name in the signature.' },
      { id: 'd', text: 'The email was addressed to the employee.' }
    ],
    correctOptionId: 'b',
    explanation: 'Scammers create artificial deadlines like 30 minutes to make you panic and click before checking if the message is genuine.'
  },
  {
    id: 'r1-02',
    roundId: 'round-1',
    topic: 'Lookalike Domain',
    scenario: 'An email from "support@novatech-security.com" asks you to log into "http://novatech-account-verify.net/login". The real company website is "novatech.com".',
    question: 'What makes the sender address and web link suspicious?',
    options: [
      { id: 'a', text: 'Both addresses use lookalike domains that do not match the real company website.' },
      { id: 'b', text: 'The sender address contains the word support.' },
      { id: 'c', text: 'The link requires an internet connection.' },
      { id: 'd', text: 'The message was sent from a web server.' }
    ],
    correctOptionId: 'a',
    explanation: 'Scammers register similar-sounding website names (like novatech-security.com) to impersonate real organizations. Always inspect domain names carefully.'
  },
  {
    id: 'r1-03',
    roundId: 'round-1',
    topic: 'Safe Reporting Protocol',
    scenario: 'You received an unexpected email asking you to verify your company password through an external web link.',
    question: 'What is the safest action to take?',
    options: [
      { id: 'a', text: 'Click the link to check if the login screen looks official.' },
      { id: 'b', text: 'Reply to the sender asking if they really need your password.' },
      { id: 'c', text: 'Forward the email to coworkers so they can test their links.' },
      { id: 'd', text: 'Do not click the link, and report the email to your official IT support team.' }
    ],
    correctOptionId: 'd',
    explanation: 'Never click links or reply to suspicious emails. Always report unexpected security alerts directly to your official IT department.'
  },
  {
    id: 'r1-04',
    roundId: 'round-1',
    topic: 'Failed Package Delivery',
    scenario: 'You receive an email claiming a package cannot be delivered due to an incorrect address, directing you to click a link to reschedule.',
    question: 'Before clicking the tracking link, what is the safest way to check the delivery status?',
    options: [
      { id: 'a', text: 'Go directly to the courier official website and enter your original tracking number.' },
      { id: 'b', text: 'Click the link and fill out your credit card number for redelivery fees.' },
      { id: 'c', text: 'Reply with your home address and phone number.' },
      { id: 'd', text: 'Send the email to your friends to see if they are waiting for a package.' }
    ],
    correctOptionId: 'a',
    explanation: 'Always verify deliveries by visiting the courier official website directly rather than clicking links inside unexpected messages.'
  },
  {
    id: 'r1-05',
    roundId: 'round-1',
    topic: 'Mismatched Reply-To Address',
    scenario: 'An email displays "From: CEO John Smith <john@company.com>", but the reply-to field shows "exec-reply99@freemail-service.net".',
    question: 'Why does the difference between the sender and reply-to addresses matter?',
    options: [
      { id: 'a', text: 'It means the CEO was using a different internet browser.' },
      { id: 'b', text: 'It indicates spoofing, where replies will be routed to the scammer external inbox.' },
      { id: 'c', text: 'It shows the company email server is working faster than usual.' },
      { id: 'd', text: 'It is a standard technique used for corporate newsletters.' }
    ],
    correctOptionId: 'b',
    explanation: 'Attackers often spoof the visible sender name but configure the reply-to header to direct your response to their private mailbox.'
  },
  {
    id: 'r1-06',
    roundId: 'round-1',
    topic: 'Suspicious Email Attachment',
    scenario: 'An unexpected email with the subject "Overdue Invoice Q3" arrives with an attachment named "Invoice_Summary.pdf.exe".',
    question: 'Why is the file name "Invoice_Summary.pdf.exe" extremely dangerous?',
    options: [
      { id: 'a', text: 'It is actually an executable program (.exe) disguised as a PDF document.' },
      { id: 'b', text: 'It takes up too much space on your hard drive.' },
      { id: 'c', text: 'It will automatically print twenty blank pages.' },
      { id: 'd', text: 'It can only be opened on a tablet computer.' }
    ],
    correctOptionId: 'a',
    explanation: 'Scammers use double extensions like .pdf.exe to trick you into running malware that looks like a normal document.'
  },
  {
    id: 'r1-07',
    roundId: 'round-1',
    topic: 'Unencrypted Login Link',
    scenario: 'A warning email directs you to a login page at "http://login-corporate.net" instead of "https://corporate.com".',
    question: 'What is a major technical warning sign in this web link?',
    options: [
      { id: 'a', text: 'The link contains hyphenated words.' },
      { id: 'b', text: 'The link uses insecure HTTP without encryption and points to an external domain.' },
      { id: 'c', text: 'The link opens in a web browser window.' },
      { id: 'd', text: 'The link ends with the letters .net.' }
    ],
    correctOptionId: 'b',
    explanation: 'Legitimate corporate and banking portals always use secure HTTPS encryption and official domain names, never plain HTTP.'
  },
  {
    id: 'r1-08',
    roundId: 'round-1',
    topic: 'Streaming Subscription Alert',
    scenario: 'You receive an email claiming: "Your movie streaming subscription was suspended due to billing failure. Update payment in 24 hours."',
    question: 'What should you do to safely resolve your billing status?',
    options: [
      { id: 'a', text: 'Open your streaming app or website independently and check your account settings.' },
      { id: 'b', text: 'Click the link in the email and type your credit card details immediately.' },
      { id: 'c', text: 'Reply to the message with a picture of your debit card.' },
      { id: 'd', text: 'Share your streaming password with customer service in an email reply.' }
    ],
    correctOptionId: 'a',
    explanation: 'Never enter payment information from links in billing alert emails. Check your account directly through the official app or website.'
  },
  {
    id: 'r1-09',
    roundId: 'round-1',
    topic: 'Password Expiration Warning',
    scenario: 'An email says: "Your network password expires today. Click here to keep your current password without changing it."',
    question: 'Why is this offer to "keep your current password" suspicious?',
    options: [
      { id: 'a', text: 'Legitimate password expiration policies require creating a new password, not verifying the old one on an external link.' },
      { id: 'b', text: 'Computers do not allow passwords to be updated on weekdays.' },
      { id: 'c', text: 'Network passwords never expire in any organization.' },
      { id: 'd', text: 'Passwords must always be sent through text messages.' }
    ],
    correctOptionId: 'a',
    explanation: 'Scammers lure victims with the convenience of keeping their password, aiming to steal their current credentials.'
  },
  {
    id: 'r1-10',
    roundId: 'round-1',
    topic: 'Shared Cloud Document Link',
    scenario: 'You get an email stating "You have been shared a confidential file: Bonus_Plan.docx" from an unknown sender on a free email service.',
    question: 'What is the safest way to treat this shared file notice?',
    options: [
      { id: 'a', text: 'Click the link immediately to see if you received a bonus.' },
      { id: 'b', text: 'Do not click the link or log in; verify with HR through known internal channels.' },
      { id: 'c', text: 'Download the file and save it to your desktop before opening it.' },
      { id: 'd', text: 'Reply asking the unknown sender what the file is about.' }
    ],
    correctOptionId: 'b',
    explanation: 'Scammers use enticing file names like "Bonus Plan" to trigger curiosity. Verify unexpected document shares with your HR department.'
  },
  {
    id: 'r1-11',
    roundId: 'round-1',
    topic: 'Mandatory HR Survey Asking for Personal ID',
    scenario: 'An email claiming to be an "All-Staff Engagement Survey" asks employees to enter their National ID / Social Security number to verify participation.',
    question: 'Why is asking for personal identification numbers in a survey suspicious?',
    options: [
      { id: 'a', text: 'Real employee surveys do not require sensitive national identification numbers to record feedback.' },
      { id: 'b', text: 'Surveys can only be taken using paper forms.' },
      { id: 'c', text: 'Employees are not allowed to participate in surveys during work hours.' },
      { id: 'd', text: 'Surveys never have questions about job satisfaction.' }
    ],
    correctOptionId: 'a',
    explanation: 'Legitimate surveys never require sensitive identity numbers. Scammers use fake surveys for identity theft.'
  },
  {
    id: 'r1-12',
    roundId: 'round-1',
    topic: 'Tax Refund Notification',
    scenario: 'An email claiming to be from the tax authorities announces you have an unclaimed refund of $480 waiting, with a link to claim it.',
    question: 'How do tax government authorities typically communicate about real tax matters?',
    options: [
      { id: 'a', text: 'They send urgent emails with links requesting your debit card PIN.' },
      { id: 'b', text: 'They communicate through official postal mail and secure government web portals, never unexpected email claim links.' },
      { id: 'c', text: 'They message you through social media chat apps.' },
      { id: 'd', text: 'They ask you to pay a claim fee using store gift cards.' }
    ],
    correctOptionId: 'b',
    explanation: 'Government revenue agencies do not send surprise refund claim links via email. Always use official government web portals.'
  },
  {
    id: 'r1-13',
    roundId: 'round-1',
    topic: 'Fake Virtual Meeting Invitation',
    scenario: 'You receive a calendar meeting notification from an unfamiliar email address with a link saying "Click here to install meeting audio plugin.exe".',
    question: 'What is the risk of downloading software from an unverified meeting invite?',
    options: [
      { id: 'a', text: 'The download may install spyware or malware onto your computer.' },
      { id: 'b', text: 'The software will make your computer microphone louder.' },
      { id: 'c', text: 'The calendar meeting will take longer to start.' },
      { id: 'd', text: 'Your computer will automatically shut down at 5 PM.' }
    ],
    correctOptionId: 'a',
    explanation: 'Never install unexpected plugins or programs from calendar invites. Legitimate platforms run directly in the browser or official desktop apps.'
  },
  {
    id: 'r1-14',
    roundId: 'round-1',
    topic: 'Urgent Wire Transfer from Boss',
    scenario: 'An email looking like it came from your department director says: "I am in an urgent meeting with clients. Wire $4,000 to this vendor account right now."',
    question: 'What should you do before transferring any company funds?',
    options: [
      { id: 'a', text: 'Follow established company accounting procedures and verbally verify the request with the director.' },
      { id: 'b', text: 'Transfer the funds immediately so the director is not upset.' },
      { id: 'c', text: 'Send half the money now and the rest tomorrow.' },
      { id: 'd', text: 'Reply to the email asking for the vendor phone number.' }
    ],
    correctOptionId: 'a',
    explanation: 'CEO and executive fraud relies on pressure and hierarchy. Standard policy requires verbal or face-to-face confirmation for financial transfers.'
  },
  {
    id: 'r1-15',
    roundId: 'round-1',
    topic: 'Mailbox Storage Full Warning',
    scenario: 'An email says your mailbox is 99% full and warns that incoming emails are being blocked unless you click a link to expand your mailbox.',
    question: 'What makes this mailbox warning suspicious?',
    options: [
      { id: 'a', text: 'It directs you to a generic external webpage instead of your corporate email settings.' },
      { id: 'b', text: 'Mailboxes are physically incapable of reaching 99% capacity.' },
      { id: 'c', text: 'Email providers only send storage warnings through text messages.' },
      { id: 'd', text: 'Corporate emails never have storage limits.' }
    ],
    correctOptionId: 'a',
    explanation: 'Quota warning scams direct you to fake login forms to capture your webmail username and password.'
  },
  {
    id: 'r1-16',
    roundId: 'round-1',
    topic: 'Unrecognized E-commerce Order',
    scenario: 'You receive an order confirmation email for a $1,200 television you never ordered, with a phone number to call if you did not authorize it.',
    question: 'Why do scammers include a "customer service" phone number in fake order receipts?',
    options: [
      { id: 'a', text: 'To trick you into calling their fake call center so they can talk you into installing remote access software or giving card numbers.' },
      { id: 'b', text: 'Because email receipts legally require a telephone number.' },
      { id: 'c', text: 'To help you find the television tracking code.' },
      { id: 'd', text: 'To ensure your delivery arrives on the correct day.' }
    ],
    correctOptionId: 'a',
    explanation: 'Fake invoice scams bait panicked victims into calling fraudulent support lines that steal banking credentials or install remote access tools.'
  },
  {
    id: 'r1-17',
    roundId: 'round-1',
    topic: 'Mobile Carrier SIM Upgrade',
    scenario: 'A text message says: "Your mobile network SIM card will be deactivated tonight. Click here to confirm your identity and prevent disconnection."',
    question: 'What is the primary danger of following the link in this message?',
    options: [
      { id: 'a', text: 'It can lead to a SIM swapping scam where the attacker takes control of your mobile number and receives your 2FA codes.' },
      { id: 'b', text: 'It will decrease your phone screen brightness.' },
      { id: 'c', text: 'It will change your saved phone contacts.' },
      { id: 'd', text: 'It will turn off your phone bluetooth antenna.' }
    ],
    correctOptionId: 'a',
    explanation: 'SIM-swap phishing seeks your personal details to transfer your phone number to a criminal device, intercepting your security codes.'
  },
  {
    id: 'r1-18',
    roundId: 'round-1',
    topic: 'Holiday Gift Card Lottery',
    scenario: 'An email congratulates you on winning a $250 holiday gift card, asking you to click a link and pay a $2 claim processing fee.',
    question: 'Why should you be skeptical of a prize that asks for a processing fee?',
    options: [
      { id: 'a', text: 'Genuine gift cards and prizes never require winners to pay money or provide credit card numbers to claim them.' },
      { id: 'b', text: 'Holiday gift cards are illegal in most countries.' },
      { id: 'c', text: 'Lotteries only give away physical cash, never gift cards.' },
      { id: 'd', text: 'Gift cards can only be claimed on Christmas Day.' }
    ],
    correctOptionId: 'a',
    explanation: 'Any prize requiring an upfront fee or credit card entry is a scam designed to harvest financial information.'
  },
  {
    id: 'r1-19',
    roundId: 'round-1',
    topic: 'Antivirus Renewal Charge',
    scenario: 'You receive an email invoice stating that $399 has been automatically debited for an annual antivirus subscription you do not have.',
    question: 'What is the best way to verify if any money was actually charged?',
    options: [
      { id: 'a', text: 'Check your official bank or credit card statement directly through your bank app.' },
      { id: 'b', text: 'Call the phone number listed on the invoice immediately.' },
      { id: 'c', text: 'Click the cancel button inside the email attachment.' },
      { id: 'd', text: 'Reply to the sender demanding an explanation.' }
    ],
    correctOptionId: 'a',
    explanation: 'Never call numbers on unsolicited invoices. Check your real bank app or credit card statement to confirm whether a charge actually exists.'
  },
  {
    id: 'r1-20',
    roundId: 'round-1',
    topic: 'Security Alert with Suspicious Button',
    scenario: 'An email alert says: "Unrecognized login from Russia detected on your account! Click Disconnect Session immediately."',
    question: 'What is the danger of clicking the "Disconnect Session" button in an unverified email?',
    options: [
      { id: 'a', text: 'The button likely leads to a fake login portal designed to steal your real password when you attempt to log in.' },
      { id: 'b', text: 'The button will delete your internet browser history.' },
      { id: 'c', text: 'The button will reset your home Wi-Fi network.' },
      { id: 'd', text: 'The button will automatically turn off your computer.' }
    ],
    correctOptionId: 'a',
    explanation: 'Fake security alerts exploit fear to trick you into entering your login details on an attacker controlled phishing page.'
  },
  {
    id: 'r1-21',
    roundId: 'round-1',
    topic: 'Office Printer Scan Document',
    scenario: 'An email with the subject "Scanned document from Xerox_WorkCentre_5330" contains a link to download "Scan_00491.htm".',
    question: 'Why is an HTML (.htm) file link from a supposed office printer suspicious?',
    options: [
      { id: 'a', text: 'Office printers generate PDF or image files, not executable HTML pages designed to capture credentials.' },
      { id: 'b', text: 'Printers can only scan documents in black and white.' },
      { id: 'c', text: 'Printers cannot connect to corporate networks.' },
      { id: 'd', text: 'Scanned files must always be delivered on a thumb drive.' }
    ],
    correctOptionId: 'a',
    explanation: 'Printers produce PDF or TIFF scans. An HTML attachment pretending to be a scan is a phishing page designed to steal credentials.'
  },
  {
    id: 'r1-22',
    roundId: 'round-1',
    topic: 'Charity Relief Donation Scam',
    scenario: 'Following a major earthquake, an urgent email asks for donations to a relief fund, requesting contributions via cryptocurrency or store gift cards.',
    question: 'What makes this charity donation request a major red flag?',
    options: [
      { id: 'a', text: 'Legitimate charities accept standard payment methods and do not demand untraceable cryptocurrency or gift cards.' },
      { id: 'b', text: 'Charities are not allowed to send email newsletters.' },
      { id: 'c', text: 'Natural disaster relief is always funded entirely by local governments.' },
      { id: 'd', text: 'Donations can only be made in person at a bank branch.' }
    ],
    correctOptionId: 'a',
    explanation: 'Scammers exploit disasters to solicit untraceable payments. Legitimate charities accept transparent, standard payment options.'
  },
  {
    id: 'r1-23',
    roundId: 'round-1',
    topic: 'Cloud Storage Upgrade Expiration',
    scenario: 'An email says your cloud storage was upgraded to 2TB for free but will expire today unless you verify your credit card number.',
    question: 'What is the goal of this promotional expiration message?',
    options: [
      { id: 'a', text: 'To trick you into entering valid credit card details on a fraudulent form.' },
      { id: 'b', text: 'To clean up unnecessary files stored on your computer.' },
      { id: 'c', text: 'To increase the speed of your internet connection.' },
      { id: 'd', text: 'To remind you to organize your photos into albums.' }
    ],
    correctOptionId: 'a',
    explanation: 'Scammers invent free upgrades and expiration deadlines to trick victims into submitting credit card numbers.'
  },
  {
    id: 'r1-24',
    roundId: 'round-1',
    topic: 'Voicemail Notification Attachment',
    scenario: 'You receive an email saying: "You missed an urgent 42-second voicemail from your manager. Listen: Voicemail_Audio.html".',
    question: 'What happens when a victim opens a .html file attached to a fake voicemail email?',
    options: [
      { id: 'a', text: 'It opens a deceptive web page imitating a login screen to steal email credentials.' },
      { id: 'b', text: 'It plays the voicemail through your computer speakers.' },
      { id: 'c', text: 'It forwards the message to your voicemail inbox.' },
      { id: 'd', text: 'It sends a text message to your manager phone.' }
    ],
    correctOptionId: 'a',
    explanation: 'Voicemail phishing attachments open local HTML files that present fake login screens to capture your email account password.'
  },
  {
    id: 'r1-25',
    roundId: 'round-1',
    topic: 'Generic Greeting Red Flag',
    scenario: 'An email claiming to be from your primary bank begins with: "Dear Valued Customer" rather than addressing you by your name.',
    question: 'Why is a generic greeting often a sign of mass phishing?',
    options: [
      { id: 'a', text: 'Mass phishing emails are blasted to thousands of unknown targets without knowing individual names.' },
      { id: 'b', text: 'Banks are legally prohibited from using customer names in emails.' },
      { id: 'c', text: 'Personal greetings make email messages load more slowly.' },
      { id: 'd', text: 'Generic greetings are required by international email standards.' }
    ],
    correctOptionId: 'a',
    explanation: 'Legitimate banks address you by your verified name. Vague greetings like "Dear Customer" indicate mass automated phishing.'
  },
  {
    id: 'r1-26',
    roundId: 'round-1',
    topic: 'Spelling and Grammar Errors',
    scenario: 'A formal notification from a supposed corporate security desk contains multiple grammatical errors and misspelled words like "Securty" and "Immediatly".',
    question: 'What do frequent spelling errors in an official corporate notification suggest?',
    options: [
      { id: 'a', text: 'The email was likely generated by external scammers rather than an official communications department.' },
      { id: 'b', text: 'The IT department keyboard was not working properly.' },
      { id: 'c', text: 'Spelling errors are an intentional security code used by IT teams.' },
      { id: 'd', text: 'The email was translated into English by speech recognition.' }
    ],
    correctOptionId: 'a',
    explanation: 'Major organizations review formal communications carefully. Noticeable spelling and grammar errors are common red flags in phishing lures.'
  },
  {
    id: 'r1-27',
    roundId: 'round-1',
    topic: 'Unexpected Multi-Factor Code Email',
    scenario: 'You receive an email containing a multi-factor authentication code that you did not request, followed by an email asking you to verify your identity.',
    question: 'What does receiving an unprompted authentication code indicate?',
    options: [
      { id: 'a', text: 'Someone may have your password and is trying to log into your account.' },
      { id: 'b', text: 'Your account is being automatically backed up by the server.' },
      { id: 'c', text: 'The company email server is restarting for routine maintenance.' },
      { id: 'd', text: 'Your computer needs a software update.' }
    ],
    correctOptionId: 'a',
    explanation: 'An unexpected MFA prompt means someone has your password and is attempting to access your account. Change your password immediately.'
  },
  {
    id: 'r1-28',
    roundId: 'round-1',
    topic: 'Shortened URL Danger',
    scenario: 'A company wide security notice contains a shortened link (like bit.ly/3xY9z) instead of the full official company domain URL.',
    question: 'Why are shortened links dangerous in security communications?',
    options: [
      { id: 'a', text: 'Shortened links hide the true destination website, making it difficult to verify if the site is safe before clicking.' },
      { id: 'b', text: 'Shortened links expire within five minutes.' },
      { id: 'c', text: 'Shortened links cannot be opened on mobile devices.' },
      { id: 'd', text: 'Shortened links increase your internet service bill.' }
    ],
    correctOptionId: 'a',
    explanation: 'URL shorteners mask the actual web address, preventing you from inspecting whether the destination domain is trustworthy.'
  },
  {
    id: 'r1-29',
    roundId: 'round-1',
    topic: 'Employee Benefits Enrollment Phishing',
    scenario: 'During annual benefits enrollment, an email says: "Open enrollment has been shortened. Click here immediately to keep your health coverage."',
    question: 'How should you verify changes to your employee benefits schedule?',
    options: [
      { id: 'a', text: 'Visit your company official employee portal directly or contact HR in person.' },
      { id: 'b', text: 'Click the link and re-enter your health insurance card details.' },
      { id: 'c', text: 'Reply to the email with a copy of your driver license.' },
      { id: 'd', text: 'Assume your benefits are cancelled if you do not click the link.' }
    ],
    correctOptionId: 'a',
    explanation: 'Scammers target seasonal events like benefits enrollment. Always navigate directly to official HR portals.'
  },
  {
    id: 'r1-30',
    roundId: 'round-1',
    topic: 'Embedded Login Form in Email',
    scenario: 'An email contains an interactive form directly inside the message body asking you to enter your username and password to confirm your account.',
    question: 'Why should you never enter credentials into a form embedded inside an email?',
    options: [
      { id: 'a', text: 'Legitimate services never ask you to submit passwords inside an email body; form data is sent directly to the attacker.' },
      { id: 'b', text: 'Embedded forms cause the email message to be permanently deleted.' },
      { id: 'c', text: 'Email forms only work if you are connected to public Wi-Fi.' },
      { id: 'd', text: 'Form buttons in emails are physically incapable of sending text.' }
    ],
    correctOptionId: 'a',
    explanation: 'Legitimate identity providers never embed password submission forms inside email bodies. Submitting credentials gives them straight to scammers.'
  }
];

console.log('R1 count:', r1Questions.length);
fs.writeFileSync('r1_count.txt', String(r1Questions.length));

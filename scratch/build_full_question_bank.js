import fs from 'node:fs';

const round1Questions = [
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
    question: 'Why is the file name "Invoice_Summary.pdf.exe" dangerous?',
    options: [
      { id: 'a', text: 'It is an executable program (.exe) disguised as a PDF document.' },
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

const round2Questions = [
  {
    id: 'r2-01',
    roundId: 'round-2',
    topic: 'Altered Username and Stolen Photo',
    scenario: 'A message from profile "@sarah_chen_official" with Sarah Chen company photo asks you to transfer $200 for a vendor lunch. Her real handle is "@sarahchen".',
    question: 'Which clue strongly indicates this profile is an imposter?',
    options: [
      { id: 'a', text: 'The account was created recently and uses an altered username handle.' },
      { id: 'b', text: 'The profile picture is in color.' },
      { id: 'c', text: 'The message was sent in the morning.' },
      { id: 'd', text: 'The display name includes her real job title.' }
    ],
    correctOptionId: 'a',
    explanation: 'Scammers copy real names and photos but must create new accounts with slight username variations.'
  },
  {
    id: 'r2-02',
    roundId: 'round-2',
    topic: 'Gift Cards and Secrecy',
    scenario: 'A message from a supposed coworker asks you to buy two $100 gift cards for a client presentation and insists you keep it confidential.',
    question: 'Why does the sender ask for gift cards and secrecy?',
    options: [
      { id: 'a', text: 'Gift cards have lower transaction fees.' },
      { id: 'b', text: 'Gift cards are non-refundable and secrecy prevents you from asking other coworkers.' },
      { id: 'c', text: 'Company policy requires gift cards for client gifts.' },
      { id: 'd', text: 'The coworker wants to surprise the manager later.' }
    ],
    correctOptionId: 'b',
    explanation: 'Scammers demand secrecy so you do not consult others, and they ask for gift cards because they cannot be reversed or refunded.'
  },
  {
    id: 'r2-03',
    roundId: 'round-2',
    topic: 'Out-of-Band Verification',
    scenario: 'You receive an urgent text from a number claiming to be your manager asking you to purchase items for a meeting.',
    question: 'What is the safest way to verify if the request is genuine?',
    options: [
      { id: 'a', text: 'Reply to the text asking if they are really your manager.' },
      { id: 'b', text: 'Send half the requested amount first.' },
      { id: 'c', text: 'Call your manager using their known phone number from the official company directory.' },
      { id: 'd', text: 'Ask the sender to send a selfie holding a coffee cup.' }
    ],
    correctOptionId: 'c',
    explanation: 'Always verify unexpected requests by calling the person directly using their verified number from an official directory.'
  },
  {
    id: 'r2-04',
    roundId: 'round-2',
    topic: 'Friend in Distress via Unknown Number',
    scenario: 'A message from an unknown number says: "Hey, this is Mark! I dropped my phone in water and borrowed this phone. Can you quickly send $50 for a cab?"',
    question: 'How should you safely verify this message before sending any money?',
    options: [
      { id: 'a', text: 'Call Mark known original phone number or reach out to mutual friends to confirm.' },
      { id: 'b', text: 'Send $50 immediately to help your friend.' },
      { id: 'c', text: 'Ask the stranger to text you Mark home address.' },
      { id: 'd', text: 'Send $25 so you only lose half if it is a scam.' }
    ],
    correctOptionId: 'a',
    explanation: 'When someone claims to be a friend in trouble from a new number, always call their original number or verify through mutual friends.'
  },
  {
    id: 'r2-05',
    roundId: 'round-2',
    topic: 'Fake Social Media Customer Support',
    scenario: 'After posting a question on Twitter about an airline delay, an account named "@Airline_HelpDesk_99" DMs you asking for your booking reference and password.',
    question: 'Why should you never share your account password with social media support accounts?',
    options: [
      { id: 'a', text: 'Legitimate customer support representatives will never ask for your account password.' },
      { id: 'b', text: 'Social media messages can only be read during business hours.' },
      { id: 'c', text: 'Airplanes do not have customer service departments.' },
      { id: 'd', text: 'Booking references are only valid at the airport counter.' }
    ],
    correctOptionId: 'a',
    explanation: 'Scammers monitor public social media complaints to impersonate support teams. Real support never requests your password.'
  },
  {
    id: 'r2-06',
    roundId: 'round-2',
    topic: 'Remote Desktop Support Call',
    scenario: 'A caller claims to be from IT and says: "We detected high latency on your PC. Download AnyDesk so I can clean your files."',
    question: 'What is the correct response to an unsolicited call asking for remote computer access?',
    options: [
      { id: 'a', text: 'Decline, hang up, and call the official IT Help Desk number listed on your company intranet.' },
      { id: 'b', text: 'Grant access but watch closely as they move the mouse cursor.' },
      { id: 'c', text: 'Ask the caller for their employee badge number and then give access.' },
      { id: 'd', text: 'Leave the call on speaker while they connect.' }
    ],
    correctOptionId: 'a',
    explanation: 'Never grant remote desktop control to unsolicited callers. Hang up and contact your official IT support team directly.'
  },
  {
    id: 'r2-07',
    roundId: 'round-2',
    topic: 'Payroll Direct Deposit Update',
    scenario: 'An email appearing to come from an employee asks HR to immediately change their direct deposit bank account to an external online wallet.',
    question: 'What security policy should HR enforce before updating direct deposit details?',
    options: [
      { id: 'a', text: 'Require verbal confirmation via phone or in-person verification with two-factor authorization.' },
      { id: 'b', text: 'Change the direct deposit account right away to avoid missing payday.' },
      { id: 'c', text: 'Send an email confirmation back to the same address.' },
      { id: 'd', text: 'Update the account but only send half the salary there.' }
    ],
    correctOptionId: 'a',
    explanation: 'Payroll diversion scams rely on unverified emails. HR policies must require verbal or in-person verification before altering banking details.'
  },
  {
    id: 'r2-08',
    roundId: 'round-2',
    topic: 'High-Paying Remote Job Offer',
    scenario: 'A recruiter messages you on WhatsApp offering a $120,000 remote job with no interview, but says you must send $300 for home office equipment setup.',
    question: 'What is the primary indicator that this job offer is fraudulent?',
    options: [
      { id: 'a', text: 'Legitimate employers never ask candidates to send money upfront for equipment or hiring fees.' },
      { id: 'b', text: 'Remote jobs cannot pay more than $50,000 per year.' },
      { id: 'c', text: 'WhatsApp cannot be used for business discussions.' },
      { id: 'd', text: 'Interviews are only conducted on Saturdays.' }
    ],
    correctOptionId: 'a',
    explanation: 'Real employers never require job candidates to pay money upfront for equipment, training, or application processing.'
  },
  {
    id: 'r2-09',
    roundId: 'round-2',
    topic: 'Colleague Asking for Confidential Client List',
    scenario: 'A supposed coworker emails you from a personal Gmail address asking for the master customer contact list for a weekend project.',
    question: 'How should you respond to requests for company data sent from personal email accounts?',
    options: [
      { id: 'a', text: 'Decline to send company data to personal email addresses and contact your supervisor.' },
      { id: 'b', text: 'Send the list as long as they promise to delete it on Monday.' },
      { id: 'c', text: 'Remove phone numbers but send all customer email addresses.' },
      { id: 'd', text: 'Forward the list to your own personal email first.' }
    ],
    correctOptionId: 'a',
    explanation: 'Confidential company data should never be sent to personal email accounts. Always adhere to data protection policies.'
  },
  {
    id: 'r2-10',
    roundId: 'round-2',
    topic: 'Celebrity Social Media Charity Request',
    scenario: 'A social media account looking like a famous singer DMs you saying you were chosen to participate in a secret private charity giveaway.',
    question: 'What is the most likely truth behind this message?',
    options: [
      { id: 'a', text: 'It is a fake imposter account created to scam fans out of money or gift cards.' },
      { id: 'b', text: 'Celebrities regularly select fans at random for private cash transfers.' },
      { id: 'c', text: 'The singer is testing your loyalty as a fan.' },
      { id: 'd', text: 'The message was sent automatically by the social platform.' }
    ],
    correctOptionId: 'a',
    explanation: 'Celebrities do not send private DMs asking fans for money or offering secret giveaways. These are always scam accounts.'
  },
  {
    id: 'r2-11',
    roundId: 'round-2',
    topic: 'University Professor Book Voucher Request',
    scenario: 'A student receives an email from "prof.adams.department@gmail.com" asking them to buy three Amazon vouchers for upcoming class prizes.',
    question: 'What makes this email request suspicious?',
    options: [
      { id: 'a', text: 'The email uses a free Gmail address instead of the official university domain and asks a student for vouchers.' },
      { id: 'b', text: 'Professors are not allowed to buy books.' },
      { id: 'c', text: 'Prizes cannot be given away in college classes.' },
      { id: 'd', text: 'Students are prohibited from reading emails on campus.' }
    ],
    correctOptionId: 'a',
    explanation: 'Professors use official university email addresses and official procurement budgets, never asking students to buy vouchers.'
  },
  {
    id: 'r2-12',
    roundId: 'round-2',
    topic: 'Hospital Emergency Fee Call',
    scenario: 'A caller claims your cousin was in a minor accident and says you must wire $500 immediately for emergency admission before treatment can start.',
    question: 'What is the safest immediate action?',
    options: [
      { id: 'a', text: 'Stay calm, call your cousin directly or call their immediate family to verify the situation.' },
      { id: 'b', text: 'Wire the money right away to prevent treatment delays.' },
      { id: 'c', text: 'Send your credit card number over text message.' },
      { id: 'd', text: 'Give the caller your home address.' }
    ],
    correctOptionId: 'a',
    explanation: 'Emergency family impersonation scams rely on panic and urgency. Always contact the relative or immediate family directly to verify.'
  },
  {
    id: 'r2-13',
    roundId: 'round-2',
    topic: 'Two-Factor Authentication Code Request',
    scenario: 'A colleague texts: "Hey, I accidentally sent my 2FA login code to your phone number! Can you text it back to me so I can log in?"',
    question: 'Why should you never share a 2FA code sent to your phone?',
    options: [
      { id: 'a', text: 'The code is for your account; the attacker is trying to log into your account using your phone code.' },
      { id: 'b', text: 'Sharing codes will reduce your phone monthly data plan.' },
      { id: 'c', text: 'The colleague phone will lock permanently.' },
      { id: 'd', text: 'Two-factor codes can only be entered on desktop computers.' }
    ],
    correctOptionId: 'a',
    explanation: 'Codes sent to your phone protect YOUR accounts. Never share verification codes with anyone, even someone claiming it was a mistake.'
  },
  {
    id: 'r2-14',
    roundId: 'round-2',
    topic: 'Online Apartment Deposit Scam',
    scenario: 'An online landlord says: "I am currently out of town, but if you wire a $600 deposit via wire transfer, I will mail you the apartment keys."',
    question: 'Why is wiring money before seeing a rental property in person dangerous?',
    options: [
      { id: 'a', text: 'It is a common rental scam where the imposter does not own the property and steals the deposit.' },
      { id: 'b', text: 'Apartment keys cannot be sent through postal mail.' },
      { id: 'c', text: 'Rental deposits must always be paid in gold coins.' },
      { id: 'd', text: 'Landlords are legally barred from traveling out of town.' }
    ],
    correctOptionId: 'a',
    explanation: 'Never wire money or pay deposits for rental homes without inspecting the property and meeting the verified landlord or agent.'
  },
  {
    id: 'r2-15',
    roundId: 'round-2',
    topic: 'Off-Platform Marketplace Payment',
    scenario: 'A buyer on an online marketplace offers to pay you extra if you agree to take the transaction off the platform and use an untraceable cash app.',
    question: 'Why do sellers and buyers need to keep transactions on official platforms?',
    options: [
      { id: 'a', text: 'Official platforms offer buyer and seller protections; off-platform payments leave you completely unprotected against fraud.' },
      { id: 'b', text: 'Off-platform payments cause your internet browser to freeze.' },
      { id: 'c', text: 'Online marketplaces charge double if you use a mobile device.' },
      { id: 'd', text: 'Items sold outside platforms take twice as long to ship.' }
    ],
    correctOptionId: 'a',
    explanation: 'Scammers take victims off-platform to bypass fraud detection and seller protection systems, leaving you with no recourse.'
  },
  {
    id: 'r2-16',
    roundId: 'round-2',
    topic: 'Borrowing Workplace Password',
    scenario: 'A teammate says: "My account is locked and I need to finish a client deck. Can you lend me your password for an hour?"',
    question: 'Why should you never share your workplace password with a colleague?',
    options: [
      { id: 'a', text: 'You are personally responsible for all actions taken under your credentials, and password sharing violates security policies.' },
      { id: 'b', text: 'Sharing passwords slows down the corporate network.' },
      { id: 'c', text: 'Passwords can only be entered on one monitor at a time.' },
      { id: 'd', text: 'Your teammate will be unable to log out.' }
    ],
    correctOptionId: 'a',
    explanation: 'Never share passwords. Teammates must contact IT support to unlock their own accounts, ensuring auditability and security.'
  },
  {
    id: 'r2-17',
    roundId: 'round-2',
    topic: 'Tax Police Threat Call',
    scenario: 'A caller claiming to be an officer from the federal tax agency threatens immediate arrest within 2 hours unless you buy gift cards to pay back taxes.',
    question: 'How can you instantly identify that this caller is an imposter?',
    options: [
      { id: 'a', text: 'Government agencies never threaten immediate arrest over the phone or accept gift cards as payment.' },
      { id: 'b', text: 'Tax officers only work on weekends.' },
      { id: 'c', text: 'Arrests can only be made by mail.' },
      { id: 'd', text: 'Taxes are only collected during the month of December.' }
    ],
    correctOptionId: 'a',
    explanation: 'Government bodies never demand payment via gift cards or threaten instant arrest on the phone. This is a classic extortion scam.'
  },
  {
    id: 'r2-18',
    roundId: 'round-2',
    topic: 'CEO Personal Email Scam',
    scenario: 'An email from "ceo.private.business99@gmail.com" asks an administrative assistant to purchase $500 in iTunes vouchers for client gifts.',
    question: 'What is the proper action for the assistant?',
    options: [
      { id: 'a', text: 'Do not purchase the vouchers; report the phishing attempt to IT security and confirm via corporate chat.' },
      { id: 'b', text: 'Purchase the cards quickly to impress the CEO.' },
      { id: 'c', text: 'Reply asking the CEO to call your personal cell phone.' },
      { id: 'd', text: 'Buy $250 worth of cards to meet halfway.' }
    ],
    correctOptionId: 'a',
    explanation: 'Scammers frequently create free email accounts pretending to be executives. Never process financial tasks from personal email addresses.'
  },
  {
    id: 'r2-19',
    roundId: 'round-2',
    topic: 'Romance Scam Travel Expense',
    scenario: 'Someone you met on a dating app two weeks ago says they desperately want to visit you but need you to wire $400 for plane tickets.',
    question: 'What is a major indicator of an online romance scam?',
    options: [
      { id: 'a', text: 'Professing strong affection quickly and asking for money before ever meeting in person.' },
      { id: 'b', text: 'Asking what your favorite hobby is.' },
      { id: 'c', text: 'Sending messages in the evening.' },
      { id: 'd', text: 'Using voice calls rather than video calls.' }
    ],
    correctOptionId: 'a',
    explanation: 'Romance scammers build quick emotional bonds to exploit victims financially. Never wire money to someone you have not met in person.'
  },
  {
    id: 'r2-20',
    roundId: 'round-2',
    topic: 'Approving Workplace Request on Behalf of Someone Else',
    scenario: 'A message on chat says: "Can you click approve on my system access request? I am locked out and need your approval signature."',
    question: 'Why should you never approve system access requests without direct verification?',
    options: [
      { id: 'a', text: 'You may be granting unauthorized system permissions to an attacker or unauthorized user.' },
      { id: 'b', text: 'Approvals take up too much memory on your computer.' },
      { id: 'c', text: 'System access can only be approved on Mondays.' },
      { id: 'd', text: 'Approving requests automatically logs you out.' }
    ],
    correctOptionId: 'a',
    explanation: 'Access approvals grant sensitive permissions. Always verify the identity of the requester and their business justification.'
  },
  {
    id: 'r2-21',
    roundId: 'round-2',
    topic: 'Utility Power Cutoff Threat',
    scenario: 'A caller claiming to be from your electric utility company says your power will be cut off in 45 minutes unless you pay $150 via prepaid card.',
    question: 'What is the best way to handle this urgent utility threat?',
    options: [
      { id: 'a', text: 'Hang up and call the customer service number printed on your official monthly utility bill.' },
      { id: 'b', text: 'Run to the store and purchase the prepaid card immediately.' },
      { id: 'c', text: 'Give the caller your credit card number to avoid the power outage.' },
      { id: 'd', text: 'Turn off all appliances in your home.' }
    ],
    correctOptionId: 'a',
    explanation: 'Utility scammers manufacture sudden disconnection deadlines. Real companies send written notices and do not demand prepaid cards.'
  },
  {
    id: 'r2-22',
    roundId: 'round-2',
    topic: 'Vendor Payment Redirection Notice',
    scenario: 'An existing supplier emails accounting stating: "We recently changed banks. Please send this month $12,000 invoice payment to our new account."',
    question: 'What procedure should the finance team follow before redirecting payment to a new bank account?',
    options: [
      { id: 'a', text: 'Call the vendor verified accounting contact using a previously known telephone number to confirm the change.' },
      { id: 'b', text: 'Update the bank account immediately and send the payment.' },
      { id: 'c', text: 'Reply to the email asking if the new bank account is correct.' },
      { id: 'd', text: 'Wait 30 days before paying the invoice.' }
    ],
    correctOptionId: 'a',
    explanation: 'Vendor email compromise involves attackers redirecting invoices. Always confirm bank account changes using verified out-of-band contacts.'
  },
  {
    id: 'r2-23',
    roundId: 'round-2',
    topic: 'Social Media Verification Badge Offer',
    scenario: 'A DM from an account claiming to be a "Verification Partner" promises you a verified blue badge on your profile if you provide your login details.',
    question: 'How do major social platforms actually award verification badges?',
    options: [
      { id: 'a', text: 'Through official in-app application settings, never via private messages asking for passwords.' },
      { id: 'b', text: 'By requiring users to text their password to a private number.' },
      { id: 'c', text: 'By sending gift cards to platform moderators.' },
      { id: 'd', text: 'Through random lottery drawings held every Friday.' }
    ],
    correctOptionId: 'a',
    explanation: 'Verification badge offers in DMs are credential-harvesting scams. Platforms verify accounts through official in-app forms.'
  },
  {
    id: 'r2-24',
    roundId: 'round-2',
    topic: 'Delivery Driver Asking for PIN',
    scenario: 'A supposed courier driver calls and says: "I am outside your building. Read me your delivery PIN code so I can mark the package delivered."',
    question: 'When should you provide a delivery verification PIN to a courier?',
    options: [
      { id: 'a', text: 'Only in person after you physically receive and inspect the package.' },
      { id: 'b', text: 'Over the phone before the driver arrives at your building.' },
      { id: 'c', text: 'In a text message early in the morning.' },
      { id: 'd', text: 'To anyone who claims to work for the delivery company.' }
    ],
    correctOptionId: 'a',
    explanation: 'Delivery PINs prove receipt of goods. Giving the PIN before receiving the package allows dishonest callers to steal your items.'
  },
  {
    id: 'r2-25',
    roundId: 'round-2',
    topic: 'Found USB Drive Handout',
    scenario: 'A person in the office lobby says: "I found this USB drive in the parking lot with the company logo. Can you plug it into your laptop to see who owns it?"',
    question: 'Why is plugging in an unknown USB drive extremely risky?',
    options: [
      { id: 'a', text: 'Unknown USB drives can execute malicious payloads, install ransomware, or steal keystrokes.' },
      { id: 'b', text: 'It will reset your computer clock to zero.' },
      { id: 'c', text: 'It will erase all files on the lobby printer.' },
      { id: 'd', text: 'It uses up too much electricity from your laptop battery.' }
    ],
    correctOptionId: 'a',
    explanation: 'USB drops are a common physical attack vector. Unknown thumb drives can install malware instantly; hand them over to IT security.'
  },
  {
    id: 'r2-26',
    roundId: 'round-2',
    topic: 'Urgent School Tuition Wire',
    scenario: 'A parent gets a message from an unfamiliar number claiming to be the school principal demanding an urgent $350 fee via cash app to avoid expulsion.',
    question: 'How should the parent verify this tuition demand?',
    options: [
      { id: 'a', text: 'Call the school main administrative office using the phone number listed on the official school website.' },
      { id: 'b', text: 'Send the money immediately so their child is not expelled.' },
      { id: 'c', text: 'Reply to the text asking the principal to send a copy of their diploma.' },
      { id: 'd', text: 'Post about the message on social media.' }
    ],
    correctOptionId: 'a',
    explanation: 'Schools have established, formal billing channels and never demand emergency peer-to-peer transfers over text messages.'
  },
  {
    id: 'r2-27',
    roundId: 'round-2',
    topic: 'Bank Loan Upfront Fee Scam',
    scenario: 'A loan broker on messaging says: "Your $25,000 personal loan is approved! Just send a $400 processing fee via gift card to release the funds."',
    question: 'What is a universal rule regarding legitimate personal loans?',
    options: [
      { id: 'a', text: 'Legitimate lenders deduct standard fees from the loan amount itself; they never demand upfront payments via gift cards.' },
      { id: 'b', text: 'Loans cannot be larger than $5,000.' },
      { id: 'c', text: 'Lenders always require payments in foreign currency.' },
      { id: 'd', text: 'Loan fees can only be paid on bank holidays.' }
    ],
    correctOptionId: 'a',
    explanation: 'Any lender demanding upfront fees via gift cards, wire transfer, or cryptocurrency before disbursing a loan is running an advance-fee fraud.'
  },
  {
    id: 'r2-28',
    roundId: 'round-2',
    topic: 'Fake IT Remote Patch Notice',
    scenario: 'A chat message says: "IT Department is installing an emergency security patch. Click this file to run the patch script on your machine."',
    question: 'How do corporate IT departments properly deploy software patches?',
    options: [
      { id: 'a', text: 'Through managed central deployment tools, not by sending raw script files via personal chat messages.' },
      { id: 'b', text: 'By asking employees to write code in notepad.' },
      { id: 'c', text: 'By emailing scripts to employees personal inboxes.' },
      { id: 'd', text: 'By requiring employees to download files from public file-sharing sites.' }
    ],
    correctOptionId: 'a',
    explanation: 'Enterprise IT teams use centralized device management systems to push updates. Be suspicious of ad-hoc script files sent in chat.'
  },
  {
    id: 'r2-29',
    roundId: 'round-2',
    topic: 'Impersonated Coworker Calendar Invite',
    scenario: 'A meeting invite titled "Performance Review & Salary Adjustment" arrives from an address differing by one letter from your colleague real address.',
    question: 'What is the attacker goal with this lookalike invite?',
    options: [
      { id: 'a', text: 'To exploit your curiosity and get you to click a malicious link or enter credentials on a fake sign-in page.' },
      { id: 'b', text: 'To help you schedule your calendar more efficiently.' },
      { id: 'c', text: 'To test if your calendar software is up to date.' },
      { id: 'd', text: 'To adjust your company compensation automatically.' }
    ],
    correctOptionId: 'a',
    explanation: 'Scammers use emotionally charged topics like salary adjustments from lookalike addresses to trick employees into surrendering credentials.'
  },
  {
    id: 'r2-30',
    roundId: 'round-2',
    topic: 'Unsolicited Technical Help Over Chat',
    scenario: 'A random profile in a public developer forum messages you offering free code to fix a bug, asking you to run an encoded terminal command.',
    question: 'Why should you never execute encoded or unfamiliar terminal commands from strangers?',
    options: [
      { id: 'a', text: 'The command could download a backdoor, wipe your drive, or steal your sensitive files.' },
      { id: 'b', text: 'It will change the desktop background image.' },
      { id: 'c', text: 'Terminal commands cannot be run while connected to the internet.' },
      { id: 'd', text: 'It will automatically turn on your computer webcam.' }
    ],
    correctOptionId: 'a',
    explanation: 'Obfuscated terminal commands are often malicious scripts designed to compromise your system or steal private keys and credentials.'
  }
];

const round3Questions = [
  {
    id: 'r3-01',
    roundId: 'round-3',
    topic: 'Fake SMS Cancel Payment Link',
    scenario: 'A text message says: "[BANK ALERT]: ₹8,500 transferred to John Doe. If this was not you, cancel immediately at: http://bank-cancel-support.com"',
    question: 'What is the biggest risk of clicking the cancel payment link in the SMS?',
    options: [
      { id: 'a', text: 'The link leads to a fake website designed to harvest your banking username and password.' },
      { id: 'b', text: 'Clicking the link will change your phone wallpaper.' },
      { id: 'c', text: 'The link will immediately drain your battery to zero.' },
      { id: 'd', text: 'The link will unsubscribe you from legitimate bank statements.' }
    ],
    correctOptionId: 'a',
    explanation: 'Scam messages contain fake cancellation links leading to phishing sites that steal your online banking credentials.'
  },
  {
    id: 'r3-02',
    roundId: 'round-3',
    topic: 'Caller Requesting OTP',
    scenario: 'A caller claiming to be from your bank fraud department asks for your 6-digit OTP to reverse an unauthorized transaction.',
    question: 'What should you do when a caller asks for your one-time passcode?',
    options: [
      { id: 'a', text: 'Give them the OTP so they can stop the fraudulent charge.' },
      { id: 'b', text: 'Read only the first three digits of the OTP.' },
      { id: 'c', text: 'Never share the OTP, hang up, and call the bank using the number on the back of your card.' },
      { id: 'd', text: 'Send the OTP in a text message to the caller.' }
    ],
    correctOptionId: 'c',
    explanation: 'Banks will never ask for your one-time passcode (OTP). Sharing it allows the scammer to authorize the fraudulent charge.'
  },
  {
    id: 'r3-03',
    roundId: 'round-3',
    topic: 'Immediate Account Lockdown',
    scenario: 'After noticing an unfamiliar transaction, you safely hang up on the suspicious caller.',
    question: 'What are the best immediate steps to protect your account?',
    options: [
      { id: 'a', text: 'Wait for the monthly statement to see if the money is returned.' },
      { id: 'b', text: 'Freeze your card in the official app, contact the bank directly, and change your password.' },
      { id: 'c', text: 'Reply to the text asking the scammer why they called.' },
      { id: 'd', text: 'Turn off your phone for 24 hours.' }
    ],
    correctOptionId: 'b',
    explanation: 'Immediately lock your card in the official app, contact your bank fraud line directly, and change your passwords from a secure device.'
  },
  {
    id: 'r3-04',
    roundId: 'round-3',
    topic: 'Unfamiliar Overseas Charge',
    scenario: 'You notice a $150 charge at an electronics retailer in another country, but your physical card is still in your wallet.',
    question: 'How could this unauthorized charge happen without physical theft of your card?',
    options: [
      { id: 'a', text: 'Your card details were compromised online through a data breach or phishing website.' },
      { id: 'b', text: 'The retailer gave you a free promotional coupon.' },
      { id: 'c', text: 'Your wallet stopped blocking sunlight.' },
      { id: 'd', text: 'The bank charges random fees to all customers.' }
    ],
    correctOptionId: 'a',
    explanation: 'Card details can be harvested online without physical access to your card. Report the fraud immediately to dispute the charge.'
  },
  {
    id: 'r3-05',
    roundId: 'round-3',
    topic: 'Micro-Transaction Testing',
    scenario: 'You spot three unfamiliar charges of $0.50, $0.99, and $1.00 on your account from an unknown online merchant.',
    question: 'Why do cybercriminals often make tiny charges first before large withdrawals?',
    options: [
      { id: 'a', text: 'They are testing whether your stolen card is active and has available credit before making larger purchases.' },
      { id: 'b', text: 'Online stores only allow purchases under one dollar.' },
      { id: 'c', text: 'To help you build your credit score.' },
      { id: 'd', text: 'To pay for paper receipts.' }
    ],
    correctOptionId: 'a',
    explanation: 'Small charges are card testing attempts by criminals. Freeze your card immediately if you see unrecognized micro-charges.'
  },
  {
    id: 'r3-06',
    roundId: 'round-3',
    topic: 'Unfamiliar Device Login Alert',
    scenario: 'Your bank app notifies you of a successful login from an unfamiliar Linux computer in Frankfurt, while you are at home in New York.',
    question: 'What does this notification indicate, and what should you do immediately?',
    options: [
      { id: 'a', text: 'Your account credentials have been compromised; change your password immediately and end all active sessions.' },
      { id: 'b', text: 'The bank is performing routine hardware diagnostics.' },
      { id: 'c', text: 'Your phone automatically synced with a European weather satellite.' },
      { id: 'd', text: 'Ignore the alert as long as your balance has not changed.' }
    ],
    correctOptionId: 'a',
    explanation: 'An impossible travel login alert means an attacker has accessed your account. Change your password and terminate all active sessions.'
  },
  {
    id: 'r3-07',
    roundId: 'round-3',
    topic: 'Fake Refund Screen Sharing Scam',
    scenario: 'A caller claiming you were accidentally overcharged $200 tells you to install TeamViewer so they can guide you through the refund process.',
    question: 'Why do scammers try to get you to install screen-sharing software during "refund" calls?',
    options: [
      { id: 'a', text: 'To gain remote control of your computer, access your online banking, or manipulate the page display to steal money.' },
      { id: 'b', text: 'To make your internet connection faster.' },
      { id: 'c', text: 'Because banks cannot send money without video streaming.' },
      { id: 'd', text: 'To test if your monitor display has accurate colors.' }
    ],
    correctOptionId: 'a',
    explanation: 'Refund scammers use remote access tools to manipulate browser displays and transfer money out of your accounts while you watch.'
  },
  {
    id: 'r3-08',
    roundId: 'round-3',
    topic: 'ATM Card Skimmer Detection',
    scenario: 'Before inserting your debit card into an ATM, you notice the card reader plastic housing feels loose, misaligned, and has glue marks around it.',
    question: 'What is the safest action when an ATM card slot looks loose or tampered with?',
    options: [
      { id: 'a', text: 'Do not insert your card; use another ATM and notify the bank or store staff.' },
      { id: 'b', text: 'Push your card in hard to make sure it reads.' },
      { id: 'c', text: 'Enter a fake PIN three times to test the machine.' },
      { id: 'd', text: 'Wipe the card slot with a paper napkin.' }
    ],
    correctOptionId: 'a',
    explanation: 'Loose card slots indicate skimming devices installed by criminals to copy card numbers and PINs. Walk away and report it.'
  },
  {
    id: 'r3-09',
    roundId: 'round-3',
    topic: 'Public Wi-Fi Banking Warning',
    scenario: 'While waiting at an airport on open public Wi-Fi, you need to check your banking balance.',
    question: 'What is the safest way to access your bank while on public Wi-Fi?',
    options: [
      { id: 'a', text: 'Disconnect from public Wi-Fi and use your phone cellular data connection or a trusted VPN.' },
      { id: 'b', text: 'Log in through the public Wi-Fi without any extra precautions.' },
      { id: 'c', text: 'Share your password with an airport security officer.' },
      { id: 'd', text: 'Write down your account number on a notepad.' }
    ],
    correctOptionId: 'a',
    explanation: 'Unencrypted public Wi-Fi networks can be monitored by attackers. Use cellular mobile data or a trusted VPN for sensitive banking.'
  },
  {
    id: 'r3-10',
    roundId: 'round-3',
    topic: 'Payment App Money Request',
    scenario: 'You receive an unexpected notification on a mobile payment app from an unfamiliar user requesting $300 with the note: "Accidentally sent you cash."',
    question: 'What is the scammer tactic in this situation?',
    options: [
      { id: 'a', text: 'They are trying to trick you into hitting "Pay" or "Confirm" without checking whether you actually received money.' },
      { id: 'b', text: 'They are trying to give you free credit.' },
      { id: 'c', text: 'The payment app is verifying your bank balance.' },
      { id: 'd', text: 'The user is adding you as a favorite contact.' }
    ],
    correctOptionId: 'a',
    explanation: 'Scammers send payment requests with notes claiming you owe them money, hoping you click Pay instead of Decline. Decline unknown requests.'
  },
  {
    id: 'r3-11',
    roundId: 'round-3',
    topic: 'Account Freeze Link in Text',
    scenario: 'A text says: "Your checking account has been frozen due to suspicious activity. Visit https://unfreeze-my-bank-portal.net to unfreeze."',
    question: 'How should you check whether your account is actually frozen?',
    options: [
      { id: 'a', text: 'Open your official banking app directly on your phone or call the bank using the number on your card.' },
      { id: 'b', text: 'Click the link in the text and enter your debit card PIN.' },
      { id: 'c', text: 'Text your account number back to the sender.' },
      { id: 'd', text: 'Wait 7 days to see if the freeze lifts automatically.' }
    ],
    correctOptionId: 'a',
    explanation: 'Scammers send fake "account frozen" texts to induce panic. Check your account status directly inside your verified banking app.'
  },
  {
    id: 'r3-12',
    roundId: 'round-3',
    topic: 'Unfamiliar Payee Added Alert',
    scenario: 'You receive an official email from your bank: "New Payee Added: Apex Global Escrow. If not you, contact us immediately."',
    question: 'Why is a new payee notification without your consent a critical emergency?',
    options: [
      { id: 'a', text: 'It means someone has accessed your account and is preparing to wire money out to an external beneficiary.' },
      { id: 'b', text: 'It means the bank has upgraded your savings interest rate.' },
      { id: 'c', text: 'It is a routine notification sent every calendar quarter.' },
      { id: 'd', text: 'It means your mobile phone needs to be recharged.' }
    ],
    correctOptionId: 'a',
    explanation: 'Adding a new payee is the preparation step for unauthorized wire transfers. Call your bank immediately to block the transfer.'
  },
  {
    id: 'r3-13',
    roundId: 'round-3',
    topic: 'Digital Gift Card Receipts',
    scenario: 'You find three email receipts for $100 digital gift cards charged to your credit card that you did not purchase.',
    question: 'Why do card thieves immediately purchase digital gift cards with stolen credit cards?',
    options: [
      { id: 'a', text: 'Gift cards are delivered instantly, non-refundable, and easily traded for cash.' },
      { id: 'b', text: 'Credit cards only work on gift card websites.' },
      { id: 'c', text: 'Gift cards increase your bank account balance.' },
      { id: 'd', text: 'Stores offer free shipping on digital items.' }
    ],
    correctOptionId: 'a',
    explanation: 'Gift cards are the currency of cybercrime because they are instantly delivered and difficult to reverse. Dispute charges immediately.'
  },
  {
    id: 'r3-14',
    roundId: 'round-3',
    topic: 'Contactless Theft While Unattended',
    scenario: 'You left your smartphone unattended on a café table for 15 minutes. Later, you notice an unauthorized contactless payment made during that window.',
    question: 'What setting should you enable to prevent unauthorized contactless payments when your phone is locked?',
    options: [
      { id: 'a', text: 'Require biometric authentication (Face ID or fingerprint) for all contactless wallet payments.' },
      { id: 'b', text: 'Turn off your phone volume.' },
      { id: 'c', text: 'Set your phone wallpaper to dark mode.' },
      { id: 'd', text: 'Keep your phone connected to public Wi-Fi.' }
    ],
    correctOptionId: 'a',
    explanation: 'Always configure mobile payment wallets to require biometric authentication (face or fingerprint) before approving any payment.'
  },
  {
    id: 'r3-15',
    roundId: 'round-3',
    topic: 'Automated Phone Menu PIN Request',
    scenario: 'An automated robocall says: "Your debit card has a fraud alert. Press 1 and enter your 4-digit PIN followed by your mother maiden name to verify."',
    question: 'Why should you never enter your debit PIN into an automated incoming phone call?',
    options: [
      { id: 'a', text: 'Legitimate banks never request your private PIN through automated inbound phone calls.' },
      { id: 'b', text: 'Phone buttons do not work on robocalls.' },
      { id: 'c', text: 'PIN numbers only have two digits.' },
      { id: 'd', text: 'Entering numbers drains your phone battery.' }
    ],
    correctOptionId: 'a',
    explanation: 'Your PIN is strictly for ATMs and secure card terminals. Banks will never ask you to key in your PIN during an incoming call.'
  },
  {
    id: 'r3-16',
    roundId: 'round-3',
    topic: 'Phone Number Changed on Banking Profile',
    scenario: 'You receive an email notification: "The registered mobile number on your bank profile was updated to +1-555-0921."',
    question: 'Why is an unauthorized change of your registered phone number dangerous?',
    options: [
      { id: 'a', text: 'Future one-time verification passcodes (OTPs) and transaction alerts will now be sent directly to the attacker phone.' },
      { id: 'b', text: 'Your phone will not be able to connect to cellular towers.' },
      { id: 'c', text: 'You will receive double monthly phone bills.' },
      { id: 'd', text: 'Your phone contacts will be deleted.' }
    ],
    correctOptionId: 'a',
    explanation: 'Attackers update the phone number to intercept future two-factor authentication codes. Contact your bank immediately to freeze the account.'
  },
  {
    id: 'r3-17',
    roundId: 'round-3',
    topic: 'Unexpected Transfer Limit Increase',
    scenario: 'An alert indicates your daily electronic transfer limit was increased from $1,000 to $10,000, but you did not make this change.',
    question: 'What is the attacker objective behind raising the account transfer limit?',
    options: [
      { id: 'a', text: 'To drain large sums of money in a single transaction before you notice the compromise.' },
      { id: 'b', text: 'To help you qualify for lower bank fees.' },
      { id: 'c', text: 'To prepare your account for the end of the year.' },
      { id: 'd', text: 'To make your transactions process faster.' }
    ],
    correctOptionId: 'a',
    explanation: 'Raising limits allows criminals to execute massive outbound transfers in a single strike. Freeze your account and call the fraud unit.'
  },
  {
    id: 'r3-18',
    roundId: 'round-3',
    topic: 'Fake Investment Returns Portal',
    scenario: 'An online platform promises guaranteed 50% daily returns on crypto transfers, showing a live dashboard with rapidly growing fake balances.',
    question: 'What is the inevitable outcome of transferring money to an unregulated "guaranteed return" investment site?',
    options: [
      { id: 'a', text: 'The funds will be stolen, and the platform will demand more fees whenever you attempt to withdraw.' },
      { id: 'b', text: 'You will receive 50% returns automatically every day.' },
      { id: 'c', text: 'The bank will match your investment with free money.' },
      { id: 'd', text: 'Your account balance will be converted to gold bars.' }
    ],
    correctOptionId: 'a',
    explanation: 'High-yield investment scams fabricate growth dashboards and refuse withdrawals, demanding fake "taxes" to steal even more funds.'
  },
  {
    id: 'r3-19',
    roundId: 'round-3',
    topic: 'Fake Payment Screenshot',
    scenario: 'A buyer sends you a screenshot of a completed bank transfer and demands you hand over your item immediately, but your bank balance has not updated.',
    question: 'What rule should you follow when accepting peer-to-peer or mobile payments?',
    options: [
      { id: 'a', text: 'Never release items based on screenshots; only release goods after funds are verified directly inside your own official bank app.' },
      { id: 'b', text: 'Accept the screenshot as long as it has today date on it.' },
      { id: 'c', text: 'Ask the buyer to take a clearer screenshot.' },
      { id: 'd', text: 'Hand over the item and check your balance tomorrow.' }
    ],
    correctOptionId: 'a',
    explanation: 'Screenshots can be edited or falsified with fake generator tools in seconds. Always verify cleared funds in your official account.'
  },
  {
    id: 'r3-20',
    roundId: 'round-3',
    topic: 'Unauthorized Secondary Card Request',
    scenario: 'You get an alert that a secondary debit card was ordered and mailed to an unfamiliar address.',
    question: 'What does this notification indicate?',
    options: [
      { id: 'a', text: 'Identity theft: an attacker has gained administrative control of your account profile.' },
      { id: 'b', text: 'The bank is replacing your card with a newer plastic design.' },
      { id: 'c', text: 'Your card was duplicated by a contactless reader.' },
      { id: 'd', text: 'The post office is testing address delivery routes.' }
    ],
    correctOptionId: 'a',
    explanation: 'Ordering additional cards sent to a drop address is a sign of complete account takeover. Call bank fraud support immediately.'
  },
  {
    id: 'r3-21',
    roundId: 'round-3',
    topic: 'Direct Debit Mandate Added',
    scenario: 'A notification arrives stating a new automated monthly direct debit was established for an unknown utility company in another state.',
    question: 'What should you do to stop unauthorized automated withdrawals?',
    options: [
      { id: 'a', text: 'Contact your bank to dispute and cancel the unauthorized direct debit mandate.' },
      { id: 'b', text: 'Pay the first month to see what the utility company provides.' },
      { id: 'c', text: 'Close your email account.' },
      { id: 'd', text: 'Assume your landlord set it up for you.' }
    ],
    correctOptionId: 'a',
    explanation: 'Direct debit mandates allow recurring withdrawals. Contact your bank immediately to cancel unauthorized mandates.'
  },
  {
    id: 'r3-22',
    roundId: 'round-3',
    topic: 'Juice Jacking Public Charging Station',
    scenario: 'You plugged your phone into a public USB charging kiosk without selecting "Charge Only". Later, unexpected browsing sessions appear.',
    question: 'How can public USB ports expose your phone to security risks?',
    options: [
      { id: 'a', text: 'USB data pins can transfer malware or extract files while the phone is connected for charging.' },
      { id: 'b', text: 'Public chargers always overheat the battery.' },
      { id: 'c', text: 'Charging ports change your phone language settings.' },
      { id: 'd', text: 'Public electricity is too fast for smartphones.' }
    ],
    correctOptionId: 'a',
    explanation: 'Public USB ports carry data as well as power. Use a USB data blocker or charge using standard wall AC outlets to stay safe.'
  },
  {
    id: 'r3-23',
    roundId: 'round-3',
    topic: 'Card Trapped in ATM',
    scenario: 'An ATM machine fails to return your card after a transaction, and a bystander immediately approaches offering to help if you enter your PIN again.',
    question: 'What is the bystander most likely trying to do?',
    options: [
      { id: 'a', text: 'They may have installed a mechanical trap to capture your card and are trying to watch you type your PIN.' },
      { id: 'b', text: 'They are an off-duty bank technician trying to fix the machine.' },
      { id: 'c', text: 'They want to guide you to the nearest bank branch.' },
      { id: 'd', text: 'They want to help you print a receipt.' }
    ],
    correctOptionId: 'a',
    explanation: 'In card-trapping scams, a physical snare catches your card while a nearby watcher memorizes your PIN to retrieve the card later.'
  },
  {
    id: 'r3-24',
    roundId: 'round-3',
    topic: 'Payment Kiosk PIN Prompt for Credit',
    scenario: 'At a gas pump kiosk, you select "Credit Card", but the machine still demands your 4-digit bank debit PIN before pumping.',
    question: 'What should you do when a terminal asks for unnecessary security information?',
    options: [
      { id: 'a', text: 'Cancel the transaction and pay inside the store with an attendant or use a different pump.' },
      { id: 'b', text: 'Enter your PIN anyway so you can fill your fuel tank.' },
      { id: 'c', text: 'Type four zeros to bypass the security check.' },
      { id: 'd', text: 'Leave the card inserted while you pump gas.' }
    ],
    correctOptionId: 'a',
    explanation: 'If a payment terminal behaves abnormally or asks for unnecessary credentials, cancel the transaction and use a verified counter.'
  },
  {
    id: 'r3-25',
    roundId: 'round-3',
    topic: 'Foreign Currency Conversion Gouging',
    scenario: 'While shopping online, an unknown checkout screen asks to convert your currency at an unfavorable rate with an extra 15% handling fee.',
    question: 'What is the safest practice when buying from international merchants?',
    options: [
      { id: 'a', text: 'Use a trusted payment gateway or credit card with fraud protection and transparent exchange rates.' },
      { id: 'b', text: 'Wire cash directly through western union.' },
      { id: 'c', text: 'Send an email with your banking login credentials.' },
      { id: 'd', text: 'Provide your debit card PIN number in the order comments.' }
    ],
    correctOptionId: 'a',
    explanation: 'Use protected payment methods like credit cards or recognized payment platforms that offer dispute resolution for foreign purchases.'
  },
  {
    id: 'r3-26',
    roundId: 'round-3',
    topic: 'Unrecognized Subscription Billing',
    scenario: 'You notice a $29.99 recurring charge every month for an "Online Cloud Optimizer" service you never signed up for.',
    question: 'What steps should you take to stop and recover unauthorized recurring charges?',
    options: [
      { id: 'a', text: 'Contact your bank or card issuer to block future charges, dispute the unauthorized debits, and request a replacement card.' },
      { id: 'b', text: 'Wait six months to see if the merchant stops billing you.' },
      { id: 'c', text: 'Send a message on social media asking for a refund.' },
      { id: 'd', text: 'Delete your internet browser cookies.' }
    ],
    correctOptionId: 'a',
    explanation: 'Card issuers can block recurring merchant billing and dispute unauthorized transactions. Requesting a new card number stops recurring theft.'
  },
  {
    id: 'r3-27',
    roundId: 'round-3',
    topic: 'Card Declining Followed by Fraud SMS',
    scenario: 'Your card declines at a restaurant, and within 10 seconds you receive an SMS asking: "Did you attempt $45 at Pasta Grill? Reply YES or NO."',
    question: 'Why did the bank send this SMS alert, and how should you reply?',
    options: [
      { id: 'a', text: 'The bank automated fraud monitoring flagged the transaction; reply YES only if you were indeed the person attempting the purchase.' },
      { id: 'b', text: 'The restaurant was trying to charge you double.' },
      { id: 'c', text: 'The bank has cancelled your checking account.' },
      { id: 'd', text: 'Always reply NO to all banking text messages.' }
    ],
    correctOptionId: 'a',
    explanation: 'Legitimate fraud detection sends quick confirmation alerts for genuine transactions. Reply YES if it was you, or NO if you did not authorize it.'
  },
  {
    id: 'r3-28',
    roundId: 'round-3',
    topic: 'Zero Balance After Wire Transfer',
    scenario: 'You log in and find your checking account balance is zero due to an unauthorized wire transfer to an unknown escrow company.',
    question: 'What is the golden rule of incident response for unauthorized bank transfers?',
    options: [
      { id: 'a', text: 'Act immediately: call your bank emergency fraud hotline within the first hour to attempt a wire recall.' },
      { id: 'b', text: 'Wait until the end of the week to see if the funds bounce back.' },
      { id: 'c', text: 'Send an email to the escrow company asking them to return the money.' },
      { id: 'd', text: 'Deposit more money to keep the account active.' }
    ],
    correctOptionId: 'a',
    explanation: 'Wire recalls have a tight time window. Calling your bank fraud desk immediately gives the highest chance of freezing funds before settlement.'
  },
  {
    id: 'r3-29',
    roundId: 'round-3',
    topic: 'Suspicious Mobile App Permission Request',
    scenario: 'A flashlight app you downloaded asks for permission to read your SMS messages and access contacts.',
    question: 'Why would a simple utility app request permission to read SMS messages?',
    options: [
      { id: 'a', text: 'Malicious apps request SMS access to intercept one-time banking passcodes (OTPs) sent by your bank.' },
      { id: 'b', text: 'To help the flashlight shine brighter during phone calls.' },
      { id: 'c', text: 'To send text messages when your battery is low.' },
      { id: 'd', text: 'To organize your saved photos.' }
    ],
    correctOptionId: 'a',
    explanation: 'Malicious apps seek SMS permissions specifically to harvest two-factor authentication codes and intercept banking alerts.'
  },
  {
    id: 'r3-30',
    roundId: 'round-3',
    topic: 'Bank App Notification vs Suspicious Text',
    scenario: 'You receive a text saying your account has fraud, but your official mobile banking app shows zero notifications or security warnings.',
    question: 'Why is the official bank app more trustworthy than an incoming SMS message?',
    options: [
      { id: 'a', text: 'SMS sender IDs can be spoofed trivially, whereas in-app notifications come directly from your authenticated secure session.' },
      { id: 'b', text: 'SMS messages can only hold 20 characters.' },
      { id: 'c', text: 'Bank apps cannot be opened while traveling.' },
      { id: 'd', text: 'Text messages are always delayed by 48 hours.' }
    ],
    correctOptionId: 'a',
    explanation: 'SMS spoofing allows scammers to fake legitimate sender IDs. Always rely on alerts inside your authenticated bank app.'
  }
];

const totalQuestions = [...round1Questions, ...round2Questions, ...round3Questions];
console.log(`Generated ${round1Questions.length} R1, ${round2Questions.length} R2, ${round3Questions.length} R3 questions. Total: ${totalQuestions.length}`);

// Write to frontend question bank
const content = `/**
 * Cyber Crime Investigation — Dynamic Question Bank
 * Contains at least 30 questions per round (90+ questions total)
 * Calibrated for Beginner-to-Intermediate cybersecurity educational awareness.
 */

export const CYBER_CRIME_QUESTION_BANK = ${JSON.stringify(totalQuestions, null, 2)};

export const ROUND_1_QUESTION_BANK = CYBER_CRIME_QUESTION_BANK.filter((q) => q.roundId === 'round-1');
export const ROUND_2_QUESTION_BANK = CYBER_CRIME_QUESTION_BANK.filter((q) => q.roundId === 'round-2');
export const ROUND_3_QUESTION_BANK = CYBER_CRIME_QUESTION_BANK.filter((q) => q.roundId === 'round-3');
`;

fs.writeFileSync('d:/deepfake/frontend/src/features/game/cyberCrime/cyberCrimeQuestionBank.js', content, 'utf8');
console.log('Successfully wrote cyberCrimeQuestionBank.js');

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || ''

const lk = lang => lang.slice(0, 2)

const CATEGORIES = [
  { key: 'milk_quality',
    emoji: '🥛',
    label: { te: 'పాల నాణ్యత',    ta: 'பால் தரம்',         kn: 'ಹಾಲಿನ ಗುಣಮಟ್ಟ',    en: 'Milk Quality' },
    color: '#dc2626', bg: '#fef2f2', dept: 'Quality Control' },
  { key: 'payment',
    emoji: '💰',
    label: { te: 'చెల్లింపు',      ta: 'கட்டணம்',           kn: 'ಪಾವತಿ',             en: 'Payment' },
    color: '#d97706', bg: '#fffbeb', dept: 'Finance & Accounts' },
  { key: 'equipment',
    emoji: '⚙️',
    label: { te: 'యంత్రం',         ta: 'உபகரணம்',           kn: 'ಉಪಕರಣ',             en: 'Equipment' },
    color: '#b45309', bg: '#fef3c7', dept: 'Technical' },
  { key: 'transport',
    emoji: '🚛',
    label: { te: 'రవాణా',          ta: 'போக்குவரத்து',       kn: 'ಸಾರಿಗೆ',            en: 'Transport' },
    color: '#2563eb', bg: '#eff6ff', dept: 'Logistics' },
  { key: 'staff_behavior',
    emoji: '👤',
    label: { te: 'సిబ్బంది',        ta: 'ஊழியர் நடத்தை',    kn: 'ಸಿಬ್ಬಂದಿ ನಡವಳಿಕೆ',  en: 'Staff Conduct' },
    color: '#7c3aed', bg: '#f5f3ff', dept: 'HR & Administration' },
  { key: 'veterinary',
    emoji: '🐄',
    label: { te: 'పశువుల ఆరోగ్యం', ta: 'கால்நடை ஆரோக்கியம்', kn: 'ಜಾನುವಾರು ಆರೋಗ್ಯ',  en: 'Animal Health' },
    color: '#16a34a', bg: '#f0fdf4', dept: 'Veterinary & Extension' },
  { key: 'membership',
    emoji: '📋',
    label: { te: 'సభ్యత్వం',        ta: 'உறுப்பினர்',         kn: 'ಸದಸ್ಯತ್ವ',          en: 'Membership' },
    color: '#0284c7', bg: '#f0f9ff', dept: 'Member Services' },
  { key: 'other',
    emoji: '📝',
    label: { te: 'ఇతర',            ta: 'மற்றவை',            kn: 'ಇತರೆ',              en: 'Other' },
    color: '#4b5563', bg: '#f9fafb', dept: 'General Management' },
]

const DETAIL_FIELDS = [
  { key: 'farmerName',
    icon: '👤', required: true, voice: true,
    label: { te: 'మీ పూర్తి పేరు',  ta: 'உங்கள் முழு பெயர்',        kn: 'ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು',   en: 'Your Full Name' },
    ph:    { te: 'పేరు చెప్పండి',    ta: 'பெயர் சொல்லுங்கள்',        kn: 'ಹೆಸರು ಹೇಳಿ',          en: 'Say your name' } },
  { key: 'phone',
    icon: '📱', required: true, voice: false, inputType: 'tel',
    label: { te: 'ఫోన్ నంబర్',       ta: 'தொலைபேசி எண்',             kn: 'ಫೋನ್ ಸಂಖ್ಯೆ',         en: 'Phone Number' },
    ph:    { te: '10-digit number',   ta: '10-digit number',           kn: '10-digit number',      en: '10-digit number' } },
  { key: 'villageName',
    icon: '🏘️', required: true, voice: true,
    label: { te: 'గ్రామం పేరు',       ta: 'கிராமத்தின் பெயர்',         kn: 'ಗ್ರಾಮದ ಹೆಸರು',        en: 'Village Name' },
    ph:    { te: 'మీ గ్రామం పేరు',    ta: 'கிராம பெயர் சொல்லுங்கள்',  kn: 'ಗ್ರಾಮದ ಹೆಸರು ಹೇಳಿ',  en: 'Say your village name' } },
  { key: 'villageCode',
    icon: '🔢', required: false, voice: true,
    label: { te: 'గ్రామం కోడ్',       ta: 'கிராம குறியீடு',            kn: 'ಗ್ರಾಮ ಕೋಡ್',          en: 'Village Code' },
    ph:    { te: 'ఉదా: VLG-001',      ta: 'எ.கா: VLG-001',             kn: 'ಉದಾ: VLG-001',         en: 'e.g. VLG-001' } },
  { key: 'bmcuName',
    icon: '🏭', required: true, voice: true,
    label: { te: 'BMCU పేరు',         ta: 'BMCU மையத்தின் பெயர்',      kn: 'BMCU ಕೇಂದ್ರದ ಹೆಸರು',  en: 'BMCU Name' },
    ph:    { te: 'BMCU కేంద్రం పేరు',  ta: 'BMCU பெயர் சொல்லுங்கள்',   kn: 'BMCU ಹೆಸರು ಹೇಳಿ',     en: 'Say BMCU name' } },
  { key: 'bmcuCode',
    icon: '🔢', required: false, voice: true,
    label: { te: 'BMCU కోడ్',         ta: 'BMCU குறியீடு',              kn: 'BMCU ಕೋಡ್',            en: 'BMCU Code' },
    ph:    { te: 'ఉదా: B-001',         ta: 'எ.கா: B-001',                kn: 'ಉದಾ: B-001',            en: 'e.g. B-001' } },
]

const T = {
  te: {
    welcome: 'నమస్కారం!', welcomeSub: 'Welcome · స్వాగతం',
    newComplaint: 'కొత్త ఫిర్యాదు', checkStatus: 'స్థితి తెలుసుకోండి',
    changeLang: '🌐 భాష మార్చండి / Change Language',
    selectProblem: 'మీ సమస్య ఏమిటి?', selectProblemSub: 'What is your problem?',
    next: 'తదుపరి → Next',
    recordTitle: 'మీ ఫిర్యాదు రికార్డ్ చేయండి',
    recordSub: 'మీ సమస్య స్పష్టంగా చెప్పండి · Speak your complaint clearly',
    recordTap: 'రికార్డ్ చేయండి',
    recordStop: 'ఆపండి',
    recordingMsg: 'రికార్డ్ అవుతున్నది',
    playback: '🎵 మీ రికార్డింగ్ వినండి',
    recordAgain: 'మళ్ళీ రికార్డ్ చేయండి',
    recordDone: '✅ రికార్డింగ్ పూర్తైంది!',
    audioRecorded: '🎙️ వాయిస్ ఫిర్యాదు రికార్డ్ చేయబడింది',
    tapSpeakField: 'పైన నొక్కండి · Tap to speak',
    listeningField: '🔴 వింటున్నది... మాట్లాడండి',
    editHint: '✏️ సవరించవచ్చు · You can edit above',
    skip: 'దాటవేయి / Skip',
    btnStop: 'ఆపండి', btnAgain: 'మళ్ళీ', btnTap: 'మాట్లాడండి',
    reviewTitle: 'సమీక్షించి సమర్పించండి', reviewSub: 'Review & Submit',
    grievanceSection: 'ఫిర్యాదు / Grievance', detailsSection: 'వివరాలు / Details',
    submit: '✅ సమర్పించు / Submit', submitting: '⏳ సమర్పిస్తున్నారు...',
    reviewBtn: 'సమీక్షించండి → Review',
    successTitle: 'ఫిర్యాదు నమోదైంది!', successSub: 'Complaint Registered Successfully',
    refLabel: 'మీ నంబర్ / Your Reference Number', saveRef: 'ఈ నంబర్ గుర్తుంచుకోండి / Save this number',
    sentTo: 'విభాగానికి పంపబడింది',
    nextSteps: '📌 తదుపరి ఏమి జరుగుతుందంటే:',
    step48: '• 48 గంటల్లో పరిష్కారం',
    stepEscalate: '• పరిష్కారం కాకపోతే senior management కు వెళ్ళుతుంది',
    another: 'మళ్ళీ ఫిర్యాదు చేయండి / Submit Another',
    statusTitle: 'స్థితి తెలుసుకోండి', statusSub: 'Check Your Complaint Status',
    refInputLabel: 'మీ రిఫరెన్స్ నంబర్',
    checkBtn: '🔍 తెలుసుకోండి / Check', checking: '⏳ వెతుకుతున్నారు...',
    notFound: 'ఈ నంబర్ కనుగొనలేదు. దయచేసి మళ్ళీ తనిఖీ చేయండి.',
    notesLabel: 'గమనికలు', overdue: '🚨 గడువు దాటింది — Senior management దృష్టిలో ఉంది',
    lFarmer: 'రైతు పేరు', lPhone: 'ఫోన్', lVillage: 'గ్రామం', lBmcu: 'BMCU',
    lProblem: 'సమస్య', lDept: 'విభాగం', lDate: 'తేది', lResolved: 'పరిష్కారం', lHours: 'h లో',
    statusOpen: 'తెరిచి ఉంది', statusProg: 'పరిష్కరిస్తున్నారు', statusRes: 'పరిష్కరించారు', statusClosed: 'మూసివేశారు',
  },
  ta: {
    welcome: 'வணக்கம்!', welcomeSub: 'Welcome · வரவேற்கிறோம்',
    newComplaint: 'புதிய புகார்', checkStatus: 'நிலையை அறியுங்கள்',
    changeLang: '🌐 மொழி மாற்று / Change Language',
    selectProblem: 'உங்கள் பிரச்சனை என்ன?', selectProblemSub: 'What is your problem?',
    next: 'அடுத்து → Next',
    recordTitle: 'உங்கள் புகாரை பதிவு செய்யுங்கள்',
    recordSub: 'உங்கள் பிரச்சனையை தெளிவாக பேசுங்கள்',
    recordTap: 'பதிவு செய்ய தொடுங்கள்',
    recordStop: 'நிறுத்து',
    recordingMsg: 'பதிவாகிறது',
    playback: '🎵 உங்கள் பதிவை கேளுங்கள்',
    recordAgain: 'மீண்டும் பதிவு செய்யுங்கள்',
    recordDone: '✅ பதிவு முடிந்தது!',
    audioRecorded: '🎙️ குரல் புகார் பதிவாகிவிட்டது',
    tapSpeakField: 'மேலே தொடுங்கள் · Tap to speak',
    listeningField: '🔴 கேட்கிறது... பேசுங்கள்',
    editHint: '✏️ திருத்தலாம் · You can edit above',
    skip: 'தவிர்க்கவும் / Skip',
    btnStop: 'நிறுத்து', btnAgain: 'மீண்டும்', btnTap: 'பேசுங்கள்',
    reviewTitle: 'சரிபார்த்து சமர்ப்பிக்கவும்', reviewSub: 'Review & Submit',
    grievanceSection: 'புகார் / Grievance', detailsSection: 'விவரங்கள் / Details',
    submit: '✅ சமர்ப்பி / Submit', submitting: '⏳ சமர்ப்பிக்கிறோம்...',
    reviewBtn: 'சரிபார்க்கவும் → Review',
    successTitle: 'புகார் பதிவாயிற்று!', successSub: 'Complaint Registered Successfully',
    refLabel: 'உங்கள் எண் / Your Reference Number', saveRef: 'இந்த எண்ணை நினைவில் வையுங்கள் / Save this number',
    sentTo: 'பிரிவுக்கு அனுப்பப்பட்டது',
    nextSteps: '📌 அடுத்து என்ன நடக்கும்:',
    step48: '• 48 மணி நேரத்தில் தீர்வு',
    stepEscalate: '• தீர்வு இல்லையெனில் மூத்த நிர்வாகத்திற்கு',
    another: 'மறுபடி புகார் / Submit Another',
    statusTitle: 'நிலையை அறியுங்கள்', statusSub: 'Check Your Complaint Status',
    refInputLabel: 'உங்கள் குறிப்பு எண்',
    checkBtn: '🔍 சரிபார்க்கவும் / Check', checking: '⏳ தேடுகிறோம்...',
    notFound: 'இந்த எண் கிடைக்கவில்லை. மீண்டும் சரிபார்க்கவும்.',
    notesLabel: 'குறிப்புகள்', overdue: '🚨 காலம் கடந்தது — மூத்த நிர்வாகம் கவனிக்கிறது',
    lFarmer: 'விவசாயி பெயர்', lPhone: 'தொலைபேசி', lVillage: 'கிராமம்', lBmcu: 'BMCU',
    lProblem: 'பிரச்சனை', lDept: 'பிரிவு', lDate: 'தேதி', lResolved: 'தீர்வு', lHours: 'h இல்',
    statusOpen: 'திறந்துள்ளது', statusProg: 'செயலில் உள்ளது', statusRes: 'தீர்க்கப்பட்டது', statusClosed: 'மூடப்பட்டது',
  },
  kn: {
    welcome: 'ನಮಸ್ಕಾರ!', welcomeSub: 'Welcome · ಸ್ವಾಗತ',
    newComplaint: 'ಹೊಸ ದೂರು', checkStatus: 'ಸ್ಥಿತಿ ತಿಳಿಯಿರಿ',
    changeLang: '🌐 ಭಾಷೆ ಬದಲಿಸಿ / Change Language',
    selectProblem: 'ನಿಮ್ಮ ಸಮಸ್ಯೆ ಏನು?', selectProblemSub: 'What is your problem?',
    next: 'ಮುಂದೆ → Next',
    recordTitle: 'ನಿಮ್ಮ ದೂರು ರೆಕಾರ್ಡ್ ಮಾಡಿ',
    recordSub: 'ನಿಮ್ಮ ಸಮಸ್ಯೆ ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಿ · Speak your complaint clearly',
    recordTap: 'ರೆಕಾರ್ಡ್ ಮಾಡಲು ಒತ್ತಿ',
    recordStop: 'ನಿಲ್ಲಿಸಿ',
    recordingMsg: 'ರೆಕಾರ್ಡ್ ಆಗುತ್ತಿದೆ',
    playback: '🎵 ನಿಮ್ಮ ರೆಕಾರ್ಡಿಂಗ್ ಕೇಳಿ',
    recordAgain: 'ಮತ್ತೆ ರೆಕಾರ್ಡ್ ಮಾಡಿ',
    recordDone: '✅ ರೆಕಾರ್ಡಿಂಗ್ ಮುಗಿದಿದೆ!',
    audioRecorded: '🎙️ ಧ್ವನಿ ದೂರು ರೆಕಾರ್ಡ್ ಆಗಿದೆ',
    tapSpeakField: 'ಮೇಲೆ ಒತ್ತಿ · Tap to speak',
    listeningField: '🔴 ಕೇಳುತ್ತಿದೆ... ಮಾತಾಡಿ',
    editHint: '✏️ ತಿದ್ದಬಹುದು · You can edit above',
    skip: 'ಬಿಟ್ಟುಬಿಡಿ / Skip',
    btnStop: 'ನಿಲ್ಲಿಸಿ', btnAgain: 'ಮತ್ತೆ', btnTap: 'ಮಾತಾಡಿ',
    reviewTitle: 'ಪರಿಶೀಲಿಸಿ ಸಲ್ಲಿಸಿ', reviewSub: 'Review & Submit',
    grievanceSection: 'ದೂರು / Grievance', detailsSection: 'ವಿವರಗಳು / Details',
    submit: '✅ ಸಲ್ಲಿಸಿ / Submit', submitting: '⏳ ಸಲ್ಲಿಸುತ್ತಿದ್ದೇವೆ...',
    reviewBtn: 'ಪರಿಶೀಲಿಸಿ → Review',
    successTitle: 'ದೂರು ನೋಂದಾಯಿಸಲಾಗಿದೆ!', successSub: 'Complaint Registered Successfully',
    refLabel: 'ನಿಮ್ಮ ಸಂಖ್ಯೆ / Your Reference Number', saveRef: 'ಈ ಸಂಖ್ಯೆ ನೆನಪಿಡಿ / Save this number',
    sentTo: 'ವಿಭಾಗಕ್ಕೆ ಕಳುಹಿಸಲಾಗಿದೆ',
    nextSteps: '📌 ಮುಂದೆ ಏನಾಗುತ್ತದೆ:',
    step48: '• 48 ಗಂಟೆಗಳಲ್ಲಿ ಪರಿಹಾರ',
    stepEscalate: '• ಪರಿಹಾರವಾಗದಿದ್ದರೆ ಹಿರಿಯ ನಿರ್ವಹಣೆಗೆ',
    another: 'ಮತ್ತೆ ದೂರು ಸಲ್ಲಿಸಿ / Submit Another',
    statusTitle: 'ಸ್ಥಿತಿ ತಿಳಿಯಿರಿ', statusSub: 'Check Your Complaint Status',
    refInputLabel: 'ನಿಮ್ಮ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ',
    checkBtn: '🔍 ತಿಳಿಯಿರಿ / Check', checking: '⏳ ಹುಡುಕುತ್ತಿದ್ದೇವೆ...',
    notFound: 'ಈ ಸಂಖ್ಯೆ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ.',
    notesLabel: 'ಟಿಪ್ಪಣಿಗಳು', overdue: '🚨 ಗಡುವು ಮೀರಿದೆ — ಹಿರಿಯ ನಿರ್ವಹಣೆ ಗಮನಿಸುತ್ತಿದೆ',
    lFarmer: 'ರೈತ ಹೆಸರು', lPhone: 'ಫೋನ್', lVillage: 'ಗ್ರಾಮ', lBmcu: 'BMCU',
    lProblem: 'ಸಮಸ್ಯೆ', lDept: 'ವಿಭಾಗ', lDate: 'ದಿನಾಂಕ', lResolved: 'ಪರಿಹಾರ', lHours: 'h ನಲ್ಲಿ',
    statusOpen: 'ತೆರೆದಿದೆ', statusProg: 'ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ', statusRes: 'ಪರಿಹರಿಸಲಾಗಿದೆ', statusClosed: 'ಮುಚ್ಚಲಾಗಿದೆ',
  },
  en: {
    welcome: 'Welcome!', welcomeSub: 'Namaste · స్వాగతం',
    newComplaint: 'New Complaint', checkStatus: 'Check Status',
    changeLang: '🌐 Change Language',
    selectProblem: 'What is your problem?', selectProblemSub: 'Select a category below',
    next: 'Next →',
    recordTitle: 'Record Your Complaint',
    recordSub: 'Speak clearly about your problem',
    recordTap: 'Tap to Record',
    recordStop: 'Stop',
    recordingMsg: 'Recording',
    playback: '🎵 Your Recording',
    recordAgain: 'Record Again',
    recordDone: '✅ Recording Complete!',
    audioRecorded: '🎙️ Voice complaint recorded',
    tapSpeakField: 'Tap above to speak',
    listeningField: '🔴 Listening... speak now',
    editHint: '✏️ You can edit above',
    skip: 'Skip',
    btnStop: 'Stop', btnAgain: 'Again', btnTap: 'Speak',
    reviewTitle: 'Review & Submit', reviewSub: 'Check your details below',
    grievanceSection: 'Grievance', detailsSection: 'Details',
    submit: '✅ Submit', submitting: '⏳ Submitting...',
    reviewBtn: 'Review →',
    successTitle: 'Complaint Registered!', successSub: 'Complaint Registered Successfully',
    refLabel: 'Your Reference Number', saveRef: 'Please save this number',
    sentTo: 'department notified',
    nextSteps: '📌 What happens next:',
    step48: '• Resolution within 48 hours',
    stepEscalate: '• Escalated to senior management if unresolved',
    another: 'Submit Another Complaint',
    statusTitle: 'Check Status', statusSub: 'Check Your Complaint Status',
    refInputLabel: 'Your Reference Number',
    checkBtn: '🔍 Check', checking: '⏳ Searching...',
    notFound: 'ID not found. Please check and try again.',
    notesLabel: 'Notes', overdue: '🚨 Overdue — senior management is aware',
    lFarmer: 'Farmer Name', lPhone: 'Phone', lVillage: 'Village', lBmcu: 'BMCU',
    lProblem: 'Problem', lDept: 'Department', lDate: 'Date', lResolved: 'Resolved', lHours: 'h',
    statusOpen: 'Open', statusProg: 'In Progress', statusRes: 'Resolved', statusClosed: 'Closed',
  },
}

const t = lang => T[lk(lang)] || T.te

const PROMPTS = {
  'te-IN': {
    welcome: 'నమస్కారం! తెలుగు ఎంచుకున్నారు. మీ ఫిర్యాదు నమోదు చేయండి.',
    selectProblem: 'మీ సమస్య ఏమిటో ఎంచుకోండి',
    speakNow: 'మీ సమస్య గురించి స్పష్టంగా మాట్లాడండి. రికార్డ్ బటన్ నొక్కి మాట్లాడండి.',
    farmerName: 'మీ పూర్తి పేరు చెప్పండి',
    phone: 'మీ ఫోన్ నంబర్ టైప్ చేయండి',
    villageName: 'మీ గ్రామం పేరు చెప్పండి',
    villageCode: 'మీ గ్రామం కోడ్ చెప్పండి',
    bmcuName: 'BMCU కేంద్రం పేరు చెప్పండి',
    bmcuCode: 'BMCU కోడ్ చెప్పండి',
    review: 'మీ వివరాలు చూసి సమర్పించండి',
  },
  'ta-IN': {
    welcome: 'வணக்கம்! தமிழ் தேர்ந்தெடுத்தீர்கள். புகாரை பதிவு செய்யுங்கள்.',
    selectProblem: 'உங்கள் பிரச்சனையை தேர்ந்தெடுங்கள்',
    speakNow: 'உங்கள் பிரச்சனை பற்றி தெளிவாக பேசுங்கள். பதிவு பொத்தானை அழுத்தி பேசுங்கள்.',
    farmerName: 'உங்கள் முழு பெயரை சொல்லுங்கள்',
    phone: 'தொலைபேசி எண்ணை தட்டச்சு செய்யுங்கள்',
    villageName: 'கிராமத்தின் பெயரை சொல்லுங்கள்',
    villageCode: 'கிராம குறியீட்டை சொல்லுங்கள்',
    bmcuName: 'BMCU மையத்தின் பெயரை சொல்லுங்கள்',
    bmcuCode: 'BMCU குறியீட்டை சொல்லுங்கள்',
    review: 'விவரங்களை சரிபார்த்து சமர்ப்பிக்கவும்',
  },
  'kn-IN': {
    welcome: 'ನಮಸ್ಕಾರ! ಕನ್ನಡ ಆಯ್ಕೆ ಮಾಡಿದ್ದೀರಿ. ದೂರು ನೋಂದಾಯಿಸಿ.',
    selectProblem: 'ನಿಮ್ಮ ಸಮಸ್ಯೆ ಆಯ್ಕೆ ಮಾಡಿ',
    speakNow: 'ನಿಮ್ಮ ಸಮಸ್ಯೆ ಬಗ್ಗೆ ಸ್ಪಷ್ಟವಾಗಿ ಮಾತಾಡಿ. ರೆಕಾರ್ಡ್ ಬಟನ್ ಒತ್ತಿ ಮಾತಾಡಿ.',
    farmerName: 'ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ಹೇಳಿ',
    phone: 'ಫೋನ್ ಸಂಖ್ಯೆ ಟೈಪ್ ಮಾಡಿ',
    villageName: 'ಗ್ರಾಮದ ಹೆಸರು ಹೇಳಿ',
    villageCode: 'ಗ್ರಾಮ ಕೋಡ್ ಹೇಳಿ',
    bmcuName: 'BMCU ಕೇಂದ್ರದ ಹೆಸರು ಹೇಳಿ',
    bmcuCode: 'BMCU ಕೋಡ್ ಹೇಳಿ',
    review: 'ವಿವರಗಳನ್ನು ತಪಾಸಣೆ ಮಾಡಿ ಸಲ್ಲಿಸಿ',
  },
  'en-IN': {
    welcome: 'Welcome! You selected English. Please register your complaint.',
    selectProblem: 'Please select your problem category',
    speakNow: 'Please speak clearly about your problem. Tap the record button and speak.',
    farmerName: 'Please say your full name',
    phone: 'Please type your phone number',
    villageName: 'Please say your village name',
    villageCode: 'Please say your village code',
    bmcuName: 'Please say your BMCU centre name',
    bmcuCode: 'Please say your BMCU code',
    review: 'Please review your details and submit',
  },
}

const LANGS = [
  { code: 'te-IN', label: 'తెలుగు', name: 'Telugu' },
  { code: 'ta-IN', label: 'தமிழ்',  name: 'Tamil' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ',  name: 'Kannada' },
  { code: 'en-IN', label: 'English', name: 'English' },
]

function speak(text, lang = 'te-IN') {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang; u.rate = 0.88
  window.speechSynthesis.speak(u)
}
function stopSpeaking() { window.speechSynthesis?.cancel() }

function Shell({ children, step, totalSteps, onBack }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-600 flex flex-col">
      <div className="bg-green-900 text-white px-4 py-3 flex items-center gap-3 shadow-lg flex-shrink-0">
        {onBack && (
          <button onClick={onBack} className="text-green-200 hover:text-white text-2xl leading-none pr-2">‹</button>
        )}
        <div className="text-3xl">🥛</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm leading-tight truncate">Shreeja MMPCL</div>
          <div className="text-green-300 text-xs">శ్రేజ మహిళా పాల ఉత్పత్తి సంస్థ</div>
        </div>
      </div>
      {step != null && (
        <div className="flex justify-center gap-2 py-3">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`rounded-full transition-all ${
              i < step   ? 'w-6 h-3 bg-green-300' :
              i === step ? 'w-6 h-3 bg-white' :
                           'w-3 h-3 bg-green-600 border border-green-400'
            }`} />
          ))}
        </div>
      )}
      <div className="flex-1 px-4 pb-8 flex flex-col">
        <div className="bg-white rounded-3xl shadow-2xl p-5 max-w-md mx-auto w-full">
          {children}
        </div>
      </div>
    </div>
  )
}

function LangPicker({ onSelect }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-700 flex flex-col">
      <div className="bg-green-950 text-white px-4 py-3 flex items-center gap-3">
        <div className="text-3xl">🥛</div>
        <div>
          <div className="font-bold text-sm">Shreeja MMPCL</div>
          <div className="text-green-300 text-xs">శ్రేజ మహిళా పాల ఉత్పత్తి సంస్థ</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🗣️</div>
          <h1 className="text-2xl font-bold">భాష ఎంచుకోండి</h1>
          <p className="text-green-300 mt-1">Choose your language</p>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {LANGS.map(l => (
            <button key={l.code} onClick={() => onSelect(l.code)}
              className="bg-white rounded-2xl py-7 flex flex-col items-center gap-2 shadow-xl active:scale-95 transition-transform">
              <span className="font-bold text-green-800 text-2xl">{l.label}</span>
              <span className="text-gray-400 text-xs">{l.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Landing({ lang, onNew, onCheck, onChangeLang }) {
  const s = t(lang)
  return (
    <Shell>
      <div className="text-center space-y-6 py-4">
        <div>
          <div className="text-6xl mb-3">🐄</div>
          <h1 className="text-2xl font-bold text-green-800">{s.welcome}</h1>
          <p className="text-gray-500 text-sm mt-1">{s.welcomeSub}</p>
        </div>
        <button onClick={onNew}
          className="w-full py-6 rounded-2xl bg-green-700 text-white shadow-lg active:scale-95 transition-transform flex flex-col items-center gap-2">
          <span className="text-4xl">📣</span>
          <span className="text-xl font-bold">{s.newComplaint}</span>
          <span className="text-green-200 text-sm">Submit New Complaint</span>
        </button>
        <button onClick={onCheck}
          className="w-full py-6 rounded-2xl bg-white border-2 border-green-700 text-green-800 shadow active:scale-95 transition-transform flex flex-col items-center gap-2">
          <span className="text-4xl">🔍</span>
          <span className="text-xl font-bold">{s.checkStatus}</span>
          <span className="text-gray-500 text-sm">Check Complaint Status</span>
        </button>
        <button onClick={onChangeLang} className="text-sm text-gray-400 underline">{s.changeLang}</button>
      </div>
    </Shell>
  )
}

function StepCategory({ lang, selected, onSelect, onNext, onBack }) {
  const s = t(lang)
  useEffect(() => { speak(PROMPTS[lang].selectProblem, lang) }, [lang])
  return (
    <Shell step={0} totalSteps={4} onBack={onBack}>
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">🤔</div>
          <h2 className="text-xl font-bold text-green-800">{s.selectProblem}</h2>
          <p className="text-gray-400 text-sm">{s.selectProblemSub}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => { stopSpeaking(); onSelect(cat.key) }}
              style={{ backgroundColor: selected === cat.key ? cat.color : cat.bg, borderColor: cat.color, color: selected === cat.key ? '#fff' : cat.color }}
              className="border-2 rounded-2xl p-4 flex flex-col items-center gap-1 active:scale-95 transition-all shadow-sm">
              <span className="text-3xl">{cat.emoji}</span>
              <span className="font-bold text-sm leading-tight text-center">{cat.label[lk(lang)] || cat.label.en}</span>
            </button>
          ))}
        </div>
        <button onClick={() => { stopSpeaking(); onNext() }} disabled={!selected}
          className={`w-full py-4 rounded-2xl text-white font-bold text-lg transition-all ${
            selected ? 'bg-green-700 hover:bg-green-800 shadow-md active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}>
          {s.next}
        </button>
      </div>
    </Shell>
  )
}

// ── Audio recording step ──────────────────────────────────────────
function StepRecord({ lang, category, onAudioReady, onNext, onBack }) {
  const s = t(lang)
  const [recState, setRecState] = useState('idle') // idle | recording | done
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)
  const recorderRef = useRef(null)
  const streamRef   = useRef(null)
  const chunksRef   = useRef([])
  const timerRef    = useRef(null)
  const cat = CATEGORIES.find(c => c.key === category) || CATEGORIES[7]

  useEffect(() => {
    speak(PROMPTS[lang].speakNow, lang)
    return () => {
      clearInterval(timerRef.current)
      stopSpeaking()
      if (streamRef.current) streamRef.current.getTracks().forEach(tr => tr.stop())
    }
  }, [])

  async function startRecording() {
    stopSpeaking()
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Microphone not supported on this browser.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url  = URL.createObjectURL(blob)
        setAudioUrl(url)
        onAudioReady(blob)
        setRecState('done')
        stream.getTracks().forEach(tr => tr.stop())
      }
      recorder.start()
      setRecState('recording')
      setDuration(0)
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    } catch {
      alert('Microphone access denied. Please allow microphone and try again.')
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current)
    recorderRef.current?.stop()
  }

  function reRecord() {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setDuration(0)
    setRecState('idle')
    onAudioReady(null)
  }

  const fmt = d => `${String(Math.floor(d / 60)).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}`

  return (
    <Shell step={1} totalSteps={4} onBack={onBack}>
      <div className="space-y-5">
        <div style={{ backgroundColor: cat.bg, borderColor: cat.color, color: cat.color }}
          className="border-2 rounded-2xl px-4 py-2 flex items-center gap-3">
          <span className="text-2xl">{cat.emoji}</span>
          <div className="font-bold text-sm">{cat.label[lk(lang)] || cat.label.en}</div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-green-800">{s.recordTitle}</h2>
          <p className="text-gray-400 text-sm mt-1">{s.recordSub}</p>
        </div>

        <div className="flex flex-col items-center gap-4 py-2">
          {recState === 'idle' && (
            <button onClick={startRecording}
              className="w-36 h-36 rounded-full bg-green-700 hover:bg-green-800 shadow-xl shadow-green-300 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all">
              <span className="text-6xl">🎙️</span>
              <span className="text-white font-bold text-sm">{s.recordTap}</span>
            </button>
          )}

          {recState === 'recording' && (
            <>
              <button onClick={stopRecording}
                className="w-36 h-36 rounded-full bg-red-500 shadow-xl shadow-red-300 animate-pulse flex flex-col items-center justify-center gap-2 active:scale-95 transition-all">
                <span className="text-6xl">⏹️</span>
                <span className="text-white font-bold text-sm">{s.recordStop}</span>
              </button>
              <div className="flex items-center gap-2 text-red-600 font-semibold text-lg">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                {s.recordingMsg} · {fmt(duration)}
              </div>
            </>
          )}

          {recState === 'done' && audioUrl && (
            <div className="w-full space-y-4">
              <div className="text-center">
                <div className="text-green-600 font-bold text-lg">{s.recordDone}</div>
              </div>
              <div className="bg-green-50 border-2 border-green-300 rounded-2xl px-4 py-3">
                <div className="text-xs font-bold text-green-700 uppercase mb-2">{s.playback}</div>
                <audio src={audioUrl} controls className="w-full" />
              </div>
              <button onClick={reRecord}
                className="w-full py-3 rounded-2xl border-2 border-gray-300 text-gray-600 font-semibold text-sm active:scale-95 transition-all">
                🔄 {s.recordAgain}
              </button>
            </div>
          )}
        </div>

        <button onClick={() => { stopSpeaking(); onNext() }} disabled={recState !== 'done'}
          className={`w-full py-4 rounded-2xl text-white font-bold text-lg transition-all ${
            recState === 'done' ? 'bg-green-700 hover:bg-green-800 shadow-md active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}>
          {s.next}
        </button>
      </div>
    </Shell>
  )
}

// ── Details wizard ────────────────────────────────────────────────
function FieldScreen({ field, lang, value, onChange, onAdvance, isLast }) {
  const s = t(lang)
  const [micState, setMicState] = useState('idle')
  const [interim,  setInterim]  = useState('')
  const recRef   = useRef(null)
  const wantsMic = useRef(false)

  useEffect(() => {
    speak(PROMPTS[lang][field.key], lang)
    return () => {
      wantsMic.current = false; stopSpeaking()
      try { recRef.current?.abort() } catch (_) {}
      recRef.current = null
    }
  }, [])

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Voice not supported. Please type.'); return }
    if (recRef.current) return
    stopSpeaking()
    const r = new SR()
    r.lang = lang; r.continuous = false; r.interimResults = true
    r.onresult = e => {
      let final = '', inter = ''
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
        else inter += e.results[i][0].transcript
      }
      if (final) { onChange(final.trim()); setInterim(''); wantsMic.current = false; setMicState('done') }
      else setInterim(inter)
    }
    r.onerror = e => {
      setInterim(''); wantsMic.current = false; recRef.current = null
      if (e.error !== 'aborted') setMicState('idle')
    }
    r.onend = () => {
      setInterim(''); recRef.current = null
      setMicState(prev => prev === 'done' ? 'done' : 'idle')
    }
    recRef.current = r; wantsMic.current = true; setMicState('listening')
    try { r.start() } catch (_) { wantsMic.current = false; recRef.current = null; setMicState('idle') }
  }

  function stopVoice() {
    wantsMic.current = false; setInterim(''); setMicState('idle')
    try { recRef.current?.abort() } catch (_) {}
    recRef.current = null
  }

  const canAdvance = !field.required || (value || '').trim()
  const fieldLabel = field.label[lk(lang)] || field.label.en
  const fieldPh    = field.ph[lk(lang)]    || field.ph.en

  return (
    <div className="space-y-5">
      <div className="text-center pb-1">
        <div className="text-5xl mb-3">{field.icon}</div>
        <h2 className="text-2xl font-bold text-green-800">{fieldLabel}</h2>
        {!field.required && <p className="text-sm text-gray-400">(optional)</p>}
      </div>

      {field.voice && (
        <div className="flex flex-col items-center gap-3">
          <button type="button" onClick={micState === 'listening' ? stopVoice : startVoice}
            className={`w-28 h-28 rounded-full flex flex-col items-center justify-center gap-1 shadow-xl transition-all active:scale-95 ${
              micState === 'listening' ? 'bg-red-500 animate-pulse shadow-red-300' :
              micState === 'done'      ? 'bg-green-500 shadow-green-300' :
                                        'bg-green-700 hover:bg-green-800 shadow-green-400'
            }`}>
            <span className="text-4xl">
              {micState === 'listening' ? '⏹️' : micState === 'done' ? '✅' : '🎙️'}
            </span>
            <span className="text-white text-xs font-bold">
              {micState === 'listening' ? s.btnStop : micState === 'done' ? s.btnAgain : s.btnTap}
            </span>
          </button>
          {micState === 'listening' && !interim && <p className="text-sm font-semibold text-red-600 animate-pulse">{s.listeningField}</p>}
          {interim && <div className="w-full bg-yellow-50 border-2 border-yellow-300 rounded-xl px-3 py-2 text-sm italic">🎙️ {interim}…</div>}
          {micState === 'idle' && !interim && <p className="text-sm text-gray-400">{s.tapSpeakField}</p>}
        </div>
      )}

      <div>
        <input type={field.inputType || 'text'} value={value}
          onChange={e => { stopSpeaking(); onChange(e.target.value) }}
          placeholder={fieldPh}
          className={`w-full px-4 py-4 border-2 rounded-2xl text-lg focus:outline-none transition-colors ${
            micState === 'listening' ? 'border-red-400 bg-red-50' :
            micState === 'done'      ? 'border-green-500 bg-green-50' :
                                       'border-gray-200 focus:border-green-500 bg-white'
          }`} />
        {field.voice && <p className="text-xs text-gray-400 mt-1.5 px-1">{s.editHint}</p>}
      </div>

      <button onClick={() => { stopSpeaking(); onAdvance() }} disabled={!canAdvance}
        className={`w-full py-4 rounded-2xl text-white font-bold text-lg transition-all ${
          canAdvance ? 'bg-green-700 hover:bg-green-800 shadow-md active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}>
        {isLast ? s.reviewBtn : s.next}
      </button>

      {!field.required && (
        <button onClick={() => { stopSpeaking(); onAdvance() }} className="w-full py-2 text-sm text-gray-400 active:text-gray-600">
          {s.skip}
        </button>
      )}
    </div>
  )
}

function StepDetails({ lang, data, onChange, onNext, onBack }) {
  const [fieldIdx, setFieldIdx] = useState(0)
  const field  = DETAIL_FIELDS[fieldIdx]
  const isLast = fieldIdx === DETAIL_FIELDS.length - 1
  function advance() { if (isLast) onNext(); else setFieldIdx(i => i + 1) }
  function goBack()  { if (fieldIdx === 0) onBack(); else setFieldIdx(i => i - 1) }
  return (
    <Shell step={2} totalSteps={4} onBack={goBack}>
      <div className="flex gap-1.5 mb-6">
        {DETAIL_FIELDS.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
            i < fieldIdx ? 'bg-green-400' : i === fieldIdx ? 'bg-green-700' : 'bg-gray-200'
          }`} />
        ))}
      </div>
      <FieldScreen key={fieldIdx} field={field} lang={lang}
        value={data[field.key] || ''} onChange={v => onChange(field.key, v)}
        onAdvance={advance} isLast={isLast} />
    </Shell>
  )
}

// ── Review ────────────────────────────────────────────────────────
function StepReview({ lang, data, category, audioUrl, onSubmit, onBack, loading }) {
  const s = t(lang)
  const cat = CATEGORIES.find(c => c.key === category) || CATEGORIES[7]
  useEffect(() => { speak(PROMPTS[lang].review, lang) }, [lang])
  return (
    <Shell step={3} totalSteps={4} onBack={() => { stopSpeaking(); onBack() }}>
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">📋</div>
          <h2 className="text-xl font-bold text-green-800">{s.reviewTitle}</h2>
          <p className="text-gray-400 text-sm">{s.reviewSub}</p>
        </div>
        <div style={{ backgroundColor: cat.bg, borderColor: cat.color, color: cat.color }}
          className="border-2 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-3xl">{cat.emoji}</span>
          <div>
            <div className="font-bold">{cat.label[lk(lang)] || cat.label.en}</div>
            <div className="text-xs opacity-70">→ {cat.dept}</div>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 space-y-2">
          <div className="text-xs font-bold text-gray-400 uppercase">{s.grievanceSection}</div>
          <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
            <span>🎙️</span><span>{s.audioRecorded}</span>
          </div>
          {audioUrl && <audio src={audioUrl} controls className="w-full mt-1" />}
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 space-y-1.5">
          <div className="text-xs font-bold text-green-600 uppercase mb-1">{s.detailsSection}</div>
          <ReviewRow label={s.lFarmer} value={data.farmerName} />
          {data.phone && <ReviewRow label={s.lPhone} value={data.phone} />}
          <ReviewRow label={s.lVillage} value={`${data.villageName}${data.villageCode ? ` (${data.villageCode})` : ''}`} />
          {data.bmcuName && <ReviewRow label={s.lBmcu} value={`${data.bmcuName}${data.bmcuCode ? ` (${data.bmcuCode})` : ''}`} />}
        </div>
        <button onClick={() => { stopSpeaking(); onSubmit() }} disabled={loading}
          className="w-full py-5 rounded-2xl bg-green-700 hover:bg-green-800 text-white font-bold text-xl shadow-lg active:scale-95 transition-all disabled:opacity-60">
          {loading ? s.submitting : s.submit}
        </button>
      </div>
    </Shell>
  )
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-500 w-28 flex-shrink-0">{label}:</span>
      <span className="text-gray-900 font-semibold">{value}</span>
    </div>
  )
}

// ── Success ───────────────────────────────────────────────────────
function SuccessScreen({ lang, complaint, onAnother }) {
  const s = t(lang)
  const cat = CATEGORIES.find(c => c.key === complaint.category) || CATEGORIES[7]
  return (
    <Shell>
      <div className="flex flex-col items-center text-center space-y-5 py-4">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-5xl shadow-lg">✅</div>
        <div>
          <h2 className="text-2xl font-bold text-green-800">{s.successTitle}</h2>
          <p className="text-gray-500 text-sm mt-1">{s.successSub}</p>
        </div>
        <div className="w-full bg-green-50 border-2 border-green-400 rounded-2xl px-6 py-5">
          <div className="text-sm text-gray-500 mb-1">{s.refLabel}</div>
          <div className="text-3xl font-bold text-green-800 font-mono tracking-wider">{complaint.id}</div>
          <div className="text-xs text-gray-400 mt-1">{s.saveRef}</div>
        </div>
        <div style={{ backgroundColor: cat.bg, borderColor: cat.color }}
          className="w-full border-2 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-3xl">{cat.emoji}</span>
          <div className="text-left">
            <div className="font-bold text-sm" style={{ color: cat.color }}>{cat.label[lk(lang)] || cat.label.en}</div>
            <div className="text-xs text-gray-600">→ <strong>{complaint.department}</strong> {s.sentTo}</div>
          </div>
        </div>
        <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-left space-y-1">
          <p className="font-bold text-amber-800 text-sm">{s.nextSteps}</p>
          <p className="text-sm text-gray-700">{s.step48}</p>
          <p className="text-sm text-gray-700">{s.stepEscalate}</p>
        </div>
        <button onClick={onAnother}
          className="w-full py-4 rounded-2xl bg-green-700 text-white font-bold text-base shadow active:scale-95">
          {s.another}
        </button>
      </div>
    </Shell>
  )
}

// ── Status check ──────────────────────────────────────────────────
function StatusCheck({ lang, onBack }) {
  const s = t(lang)
  const [id,      setId]      = useState('')
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const STATUS_LABELS = {
    open:        { label: s.statusOpen,   emoji: '🔴', bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300' },
    in_progress: { label: s.statusProg,   emoji: '🟡', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    resolved:    { label: s.statusRes,    emoji: '🟢', bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300' },
    closed:      { label: s.statusClosed, emoji: '✅', bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300' },
  }

  async function check() {
    const trimmed = id.trim().toUpperCase()
    if (!trimmed) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await axios.get(`${API}/api/grievance/status/${encodeURIComponent(trimmed)}`)
      setResult(res.data)
    } catch (e) {
      setError(e?.response?.status === 404 ? s.notFound : 'Error. Please try again.')
    } finally { setLoading(false) }
  }

  const st  = result ? (STATUS_LABELS[result.status] || STATUS_LABELS.open) : null
  const cat = result ? CATEGORIES.find(c => c.key === result.category) : null

  return (
    <Shell onBack={onBack}>
      <div className="space-y-5">
        <div className="text-center">
          <div className="text-4xl mb-2">🔍</div>
          <h2 className="text-xl font-bold text-green-800">{s.statusTitle}</h2>
          <p className="text-gray-400 text-sm">{s.statusSub}</p>
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-2">{s.refInputLabel}</label>
          <input value={id} onChange={e => setId(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="GRV-2026-0001"
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg font-mono focus:outline-none focus:border-green-500 bg-white uppercase tracking-wider" />
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
        <button onClick={check} disabled={!id.trim() || loading}
          className={`w-full py-4 rounded-2xl text-white font-bold text-lg transition-all ${
            id.trim() && !loading ? 'bg-green-700 hover:bg-green-800 shadow-md active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}>
          {loading ? s.checking : s.checkBtn}
        </button>
        {result && st && (
          <div className={`rounded-2xl border-2 ${st.border} ${st.bg} overflow-hidden`}>
            <div className={`px-4 py-4 flex items-center gap-3 ${st.bg}`}>
              <span className="text-4xl">{st.emoji}</span>
              <div className={`text-xl font-bold ${st.text}`}>{st.label}</div>
            </div>
            <div className="bg-white px-4 py-3 space-y-2 text-sm">
              <ReviewRow label={s.lProblem} value={cat ? `${cat.emoji} ${cat.label[lk(lang)] || cat.label.en}` : result.category} />
              <ReviewRow label={s.lDept}    value={result.department} />
              <ReviewRow label={s.lDate}    value={new Date(result.submittedAt).toLocaleDateString()} />
              {result.resolvedAt && <ReviewRow label={s.lResolved} value={`${result.resolutionHours} ${s.lHours}`} />}
              {result.notes && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-400 uppercase font-bold mb-1">{s.notesLabel}</div>
                  <p className="text-gray-700">{result.notes}</p>
                </div>
              )}
              {result.isOverdue && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-700 text-xs font-bold">{s.overdue}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}

// ── Main ──────────────────────────────────────────────────────────
const INITIAL = { farmerName: '', phone: '', villageName: '', villageCode: '', bmcuCode: '', bmcuName: '' }

export default function ComplaintForm() {
  const [screen,    setScreen]    = useState('lang')
  const [lang,      setLang]      = useState('te-IN')
  const [category,  setCategory]  = useState('')
  const [data,      setData]      = useState(INITIAL)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl,  setAudioUrl]  = useState(null)
  const [submitted, setSubmitted] = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  function update(key, val) { setData(d => ({ ...d, [key]: val })) }

  function handleAudioReady(blob) {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(blob)
    setAudioUrl(blob ? URL.createObjectURL(blob) : null)
  }

  function reset() {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setScreen('lang'); setCategory(''); setData(INITIAL)
    setAudioBlob(null); setAudioUrl(null)
    setSubmitted(null); setError('')
  }

  function selectLang(code) {
    setLang(code); speak(PROMPTS[code].welcome, code); setScreen('landing')
  }

  async function submit() {
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => fd.append(k, v))
      fd.append('categoryOverride', category)
      if (audioBlob) fd.append('audio', audioBlob, 'complaint.webm')
      const res = await axios.post(`${API}/api/grievance/complaints`, fd)
      setSubmitted(res.data.complaint); setScreen('success')
    } catch (e) {
      setError(e?.response?.data?.error || 'Submission failed. Please try again.')
    } finally { setLoading(false) }
  }

  if (screen === 'lang')    return <LangPicker onSelect={selectLang} />
  if (screen === 'status')  return <StatusCheck lang={lang} onBack={() => setScreen('landing')} />
  if (screen === 'success' && submitted) return <SuccessScreen lang={lang} complaint={submitted} onAnother={reset} />
  if (screen === 'landing') return <Landing lang={lang} onNew={() => setScreen('category')} onCheck={() => setScreen('status')} onChangeLang={() => setScreen('lang')} />
  if (screen === 'category') return <StepCategory lang={lang} selected={category} onSelect={setCategory} onNext={() => setScreen('voice')} onBack={() => setScreen('landing')} />
  if (screen === 'voice')   return <StepRecord lang={lang} category={category} onAudioReady={handleAudioReady} onNext={() => setScreen('details')} onBack={() => setScreen('category')} />
  if (screen === 'details') return <StepDetails lang={lang} data={data} onChange={update} onNext={() => setScreen('review')} onBack={() => setScreen('voice')} />
  if (screen === 'review')  return (
    <>
      {error && <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-3 text-sm font-medium text-center">{error}</div>}
      <StepReview lang={lang} data={data} category={category} audioUrl={audioUrl} onSubmit={submit} onBack={() => setScreen('details')} loading={loading} />
    </>
  )
  return null
}

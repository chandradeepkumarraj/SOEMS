import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    en: {
        translation: {
            "dashboard": {
                "title": "Student Hub",
                "welcome": "Welcome back, {{name}}",
                "active_exams": "Active Exams",
                "upcoming_exams": "Upcoming",
                "recent_results": "Recent Results",
                "localization": "Global Localization",
                "select_lang": "Select the preferred language for the interface.",
                "stats": {
                    "completed": "Exams Completed",
                    "avg_score": "Average Score",
                    "upcoming": "Upcoming Exams",
                    "trend_week": "+2 this week",
                    "trend_top": "Top 15%",
                    "trend_days": "Next in 2 days"
                },
                "up_next": "Up Next",
                "upcoming_exam": "Upcoming Exam",
                "go_to_hall": "Go to Exam Hall",
                "no_exams": "No upcoming exams scheduled.",
                "browse_all": "Browse All Exams",
                "score_journey": "Score Journey",
                "complete_to_see": "Complete an exam to see your progress",
                "exam_n": "Exam {{n}}"
            },
            "mentor": {
                "title": "AI Performance Mentor",
                "subtitle": "Personalized Learning Roadmap",
                "analyze": "Analyze Progress",
                "scanning": "Scanning your performance history...",
                "synthesizing": "Synthesizing topic-wise accuracy and behavioral patterns.",
                "regenerate": "Regenerate Roadmap",
                "ready_title": "Ready for your Roadmap?",
                "ready_desc": "Your AI Mentor can analyze your scores across all subjects to create a customized study plan tailored to your strengths and weaknesses.",
                "focus_weak": "Focus on Weak Topics",
                "practice_high": "Practice High-yield Concepts"
            },
            "proctor_detail": {
                "live_grid": "Live Grid",
                "ai_active": "AI Analysis Active",
                "terminate": "Terminate Session",
                "timeline": "Violation Timeline",
                "timeline_desc": "Temporal visualization of flagging events",
                "critical": "Critical",
                "warning": "Warning",
                "incident_log": "Incident Log",
                "no_incidents": "No incidents recorded yet",
                "monitoring": "Monitoring session...",
                "device_integrity": "Device Integrity",
                "webcam": "Primary Webcam",
                "mic": "Microphone (VOIP)",
                "screen": "Desktop Streaming",
                "secure_stream": "Secure Stream",
                "limited": "Limited connectivity",
                "question_depth": "Question Depth",
                "intercom": "Active Intercom",
                "reauth": "Request Re-Auth",
                "record_flag": "Record Flag",
                "security_enforcement": "Security Enforcement",
                "enforcement_desc": "If multiple critical violations are detected without explanation, use the Intercom to warn the student before termination.",
                "suspend": "Suspend Session"
            },
            "proctor_dashboard": {
                "monitor": "Live Monitor",
                "intelligence_hub": "Intelligence Hub",
                "search_placeholder": "Search by student name or roll no...",
                "no_records": "No intelligence data found for this exam.",
                "export_report": "Export Intelligence Report",
                "view_details": "View Forensic Details"
            },
            "exam": {
                "start": "Start Exam",
                "submit": "Submit Exam",
                "next": "Next",
                "prev": "Previous",
                "flag": "Flag Question",
                "time_left": "Time Left",
                "syncing": "Syncing progress...",
                "saved": "Progress saved",
                "offline": "Offline - Progress buffered",
                "unsupported_browser": "Unsupported Browser",
                "browser_desc": "To maintain examination security and ensure advanced proctoring features function correctly, this exam must be taken using a Chromium-based browser (e.g., Google Chrome, Microsoft Edge, Brave).",
                "return_hub": "Return to Dashboard",
                "instructions": "Academic Instructions",
                "questions": "Questions",
                "minutes": "Minutes",
                "max_violations": "Max Violations",
                "go_fullscreen": "Go Fullscreen",
                "live_connection": "Live Connection",
                "disconnected": "Disconnected",
                "time_expired": "Time expired. Your exam has been auto-submitted.",
                "cat_mode": "Adaptive Mode (C.A.T.)",
                "preparing_cat": "Preparing Personalized Path",
                "cat_desc": "AI is generating your unique question pool across difficulty tiers. This usually takes 30-60 seconds.",
                "cat_syncing": "Awaiting Question Synchronicity...",
                "cat_complete": "Adaptive Exam Complete",
                "cat_submitted": "Your personalized assessment has been submitted.",
                "cat_answered": "Answered",
                "cat_correct": "Correct",
                "start_exam": "I Understand — Begin Exam",
                "session_closed": "This exam has been ended by the teacher. Your current progress will be submitted automatically.",
                "session_resumed": "Your exam session has been resumed. You can continue now.",
                "question_n_of_m": "Question {{n}} of {{m}}",
                "mark_review": "Mark for Review",
                "theoretical_response": "Your Theoretical Response",
                "auto_saving": "Auto-saving to cloud...",
                "descriptive_placeholder": "Type your detailed answer here. Focus on key points and clarity...",
                "char_count": "Character Count",
                "ai_eval_note": "This answer will be evaluated by the AI examiner.",
                "sidebar": {
                    "current": "Current",
                    "answered": "Answered",
                    "unanswered": "Not Answered",
                    "flagged": "Flagged for Review",
                    "attempted": "Attempted",
                    "remaining": "Remaining"
                },
                "score": "Score",
                "instruction_header": "Instructions from Examiner",
                "security_notice": "Security Notice",
                "proctor_notice": "This exam is proctored. Tab switching, fullscreen exit, and unauthorized shortcuts will be flagged as violations.",
                "violation_audit": "In-Progress Violation Audit #{{count}}"
            }
        }
    },
    hi: {
        translation: {
            "dashboard": {
                "title": "विद्यार्थी केंद्र",
                "welcome": "दोबारा स्वागत है, {{name}}",
                "active_exams": "सक्रिय परीक्षाएं",
                "upcoming_exams": "आगामी",
                "recent_results": "हाल के परिणाम",
                "localization": "वैश्विक स्थानीयकरण",
                "select_lang": "इंटरफ़ेस के लिए पसंदीदा भाषा चुनें।",
                "stats": {
                    "completed": "परीक्षाएं पूरी हुईं",
                    "avg_score": "औसत स्कोर",
                    "upcoming": "आगामी परीक्षाएं",
                    "trend_week": "+2 इस सप्ताह",
                    "trend_top": "शीर्ष 15%",
                    "trend_days": "अगले 2 दिनों में"
                },
                "up_next": "अगला",
                "upcoming_exam": "आगामी परीक्षा",
                "go_to_hall": "परीक्षा हॉल में जाएं",
                "no_exams": "कोई आगामी परीक्षा निर्धारित नहीं है।",
                "browse_all": "सभी परीक्षाएं देखें",
                "score_journey": "स्कोर यात्रा",
                "complete_to_see": "अपनी प्रगति देखने के लिए एक परीक्षा पूरी करें",
                "exam_n": "परीक्षा {{n}}"
            },
            "mentor": {
                "title": "AI प्रदर्शन संरक्षक",
                "subtitle": "व्यक्तिगत शिक्षण रोडमैप",
                "analyze": "प्रगति का विश्लेषण करें",
                "scanning": "आपके प्रदर्शन इतिहास को स्कैन किया जा रहा है...",
                "synthesizing": "विषय-वार सटीकता और व्यवहारिक पैटर्न का संश्लेषण किया जा रहा है।",
                "regenerate": "रोडमैप को पुनर्जीवित करें",
                "ready_title": "अपने रोडमैप के लिए तैयार हैं?",
                "ready_desc": "आपका AI संरक्षक आपकी ताकत और कमजोरियों के अनुरूप एक कस्टमाइज अध्ययन योजना बनाने के लिए सभी विषयों में आपके स्कोर का विश्लेषण कर सकता है।",
                "focus_weak": "कमजोर विषयों पर ध्यान दें",
                "practice_high": "उच्च-उपज अवधारणाओं का अभ्यास करें"
            },
            "proctor_detail": {
                "live_grid": "लाइव ग्रिड",
                "ai_active": "AI विश्लेषण सक्रिय",
                "terminate": "सत्र समाप्त करें",
                "timeline": "उल्लंघन समयरेखा",
                "timeline_desc": "फ्लैगिंग घटनाओं का अस्थायी दृश्य",
                "critical": "महत्वपूर्ण",
                "warning": "चेतावनी",
                "incident_log": "घटना लॉग",
                "no_incidents": "अभी तक कोई घटना दर्ज नहीं की गई है",
                "monitoring": "निगरानी सत्र...",
                "device_integrity": "डिवाइस अखंडता",
                "webcam": "प्राथमिक वेबकैम",
                "mic": "माइक्रोफ़ोन (VOIP)",
                "screen": "डेस्कटॉप स्ट्रीमिंग",
                "secure_stream": "सुरक्षित स्ट्रीम",
                "limited": "सीमित कनेक्टिविटी",
                "question_depth": "प्रश्न गहराई",
                "intercom": "सक्रिय इंटरकॉम",
                "reauth": "पुनः प्रमाणीकरण का अनुरोध करें",
                "record_flag": "रिकॉर्ड ध्वज",
                "security_enforcement": "सुरक्षा प्रवर्तन",
                "enforcement_desc": "यदि बिना स्पष्टीकरण के कई महत्वपूर्ण उल्लंघन पाए जाते हैं, तो समाप्ति से पहले छात्र को चेतावनी देने के लिए इंटरकॉम का उपयोग करें।",
                "suspend": "सत्र स्थगित करें"
            },
            "proctor_dashboard": {
                "monitor": "लाइव मॉनिटर",
                "intelligence_hub": "इंटेलिजेंस हब",
                "search_placeholder": "छात्र का नाम या रोल नंबर खोजें...",
                "no_records": "इस परीक्षा के लिए कोई इंटेलिजेंस डेटा नहीं मिला।",
                "export_report": "इंटेलिजेंस रिपोर्ट निर्यात करें",
                "view_details": "फॉरेंसिक विवरण देखें"
            },
            "exam": {
                "start": "परीक्षा शुरू करें",
                "submit": "परीक्षा जमा करें",
                "next": "अगला",
                "prev": "पिछला",
                "flag": "प्रश्न को चिह्नित करें",
                "time_left": "बचा हुआ समय",
                "syncing": "प्रगति सिंक हो रही है...",
                "saved": "प्रगति सहेजी गई",
                "offline": "ऑफ़लाइन - प्रगति बफ़र की गई",
                "unsupported_browser": "असमर्थित ब्राउज़र",
                "browser_desc": "परीक्षा सुरक्षा बनाए रखने और उन्नत प्रॉक्टरिंग सुविधाओं के सही संचालन को सुनिश्चित करने के लिए, यह परीक्षा क्रोमियम-आधारित ब्राउज़र (जैसे, गूगल क्रोम, माइक्रोसॉफ्ट एज, ब्रेव) का उपयोग करके दी जानी चाहिए।",
                "return_hub": "डैशबोर्ड पर वापस जाएं",
                "instructions": "शैक्षणिक निर्देश",
                "questions": "प्रश्न",
                "minutes": "मिनट",
                "max_violations": "अधिकतम उल्लंघन",
                "go_fullscreen": "फुलस्क्रीन पर जाएं",
                "live_connection": "लाइव कनेक्शन",
                "disconnected": "डिस्कनेक्ट हो गया",
                "time_expired": "समय समाप्त हो गया। आपकी परीक्षा स्वतः जमा कर दी गई है।",
                "cat_mode": "अनुकूली मोड (C.A.T.)",
                "preparing_cat": "व्यक्तिगत पथ तैयार किया जा रहा है",
                "cat_desc": "AI कठिनाई स्तरों के बीच आपके अद्वितीय प्रश्न पूल तैयार कर रहा है। इसमें आमतौर पर 30-60 सेकंड लगते हैं।",
                "cat_syncing": "प्रश्न समकालिकता की प्रतीक्षा कर रहे हैं...",
                "cat_complete": "अनुकूली परीक्षा पूरी हुई",
                "cat_submitted": "आपका व्यक्तिगत मूल्यांकन जमा कर दिया गया है।",
                "cat_answered": "उत्तर दिया",
                "cat_correct": "सही",
                "start_exam": "मैं समझता हूँ — परीक्षा शुरू करें",
                "session_closed": "यह परीक्षा शिक्षक द्वारा समाप्त कर दी गई है। आपकी वर्तमान प्रगति स्वतः जमा हो जाएगी।",
                "session_resumed": "आपका परीक्षा सत्र फिर से शुरू हो गया है। अब आप जारी रख सकते हैं।",
                "question_n_of_m": "प्रश्न {{n}} का {{m}}",
                "mark_review": "समीक्षा के लिए चिह्नित करें",
                "theoretical_response": "आपकी सैद्धांतिक प्रतिक्रिया",
                "auto_saving": "क्लाउड पर ऑटो-सेव हो रहा है...",
                "descriptive_placeholder": "यहाँ अपना विस्तृत उत्तर लिखें। मुख्य बिंदुओं और स्पष्टता पर ध्यान दें...",
                "char_count": "वर्ण संख्या",
                "ai_eval_note": "इस उत्तर का मूल्यांकन AI परीक्षक द्वारा किया जाएगा।",
                "sidebar": {
                    "current": "वर्तमान",
                    "answered": "उत्तर दिया",
                    "unanswered": "उत्तर नहीं दिया",
                    "flagged": "समीक्षा के लिए चिह्नित",
                    "attempted": "प्रयास किया",
                    "remaining": "शेष"
                },
                "score": "स्कोर",
                "instruction_header": "परीक्षक के निर्देश",
                "security_notice": "सुरक्षा सूचना",
                "proctor_notice": "यह परीक्षा प्रॉक्टर्ड है। टैब स्विच करना, फुलस्क्रीन से बाहर निकलना और अनधिकृत शॉर्टकट उल्लंघन के रूप में चिह्नित किए जाएंगे।",
                "violation_audit": "प्रगति में उल्लंघन ऑडिट #{{count}}"
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: "en",
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;

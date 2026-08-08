const FAQ = require('../models/FAQ');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

exports.createFAQ = factory.createOne(FAQ);
exports.getAllFAQs = factory.getAll(FAQ);
exports.getFAQ = factory.getOne(FAQ);
exports.updateFAQ = factory.updateOne(FAQ);
exports.deleteFAQ = factory.deleteOne(FAQ);

const normalizeArabic = (str) => {
    if (!str) return '';
    return str
        .trim()
        .toLowerCase()
        .replace(/ى/g, 'ي')
        .replace(/أ|إ|آ/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/\s+/g, ' ');
};

// كلمات دالة على مواد تانية غير الكيمياء - تقدر تزود عليها براحتك
const OTHER_SUBJECTS_KEYWORDS = [
    'رياضيات', 'حساب', 'جبر', 'هندسه',
    'فيزياء',
    'احياء', 'علم الاحياء',
    'لغه عربيه', 'نحو', 'بلاغه', 'ادب',
    'انجليزي', 'english',
    'تاريخ',
    'جغرافيا',
    'فلسفه', 'منطق',
    'حاسب الي', 'برمجه',
];

const NOT_CHEMISTRY_MESSAGE =
    'أنا حاليًا بجاوب على أسئلة مادة الكيمياء بس. للمواد التانية، تقدر تتواصل مع المدرس أو فريق الدعم مباشرة.';

const DEFAULT_FALLBACK =
    'معلش، مقدرتش ألاقي إجابة واضحة لسؤالك في الكيمياء. لو محتاج مساعدة أكتر، تقدر تتواصل مع فريق الدعم مباشرة.';

exports.askChatbot = catchAsync(async (req, res, next) => {
    const { message } = req.body;

    if (!message || !message.trim()) {
        return next(new ApiError('Please provide a message', 400));
    }

    const normalizedMessage = normalizeArabic(message);
    const messageWords = normalizedMessage.split(' ').filter((w) => w.length > 1);

    const faqs = await FAQ.find();

    let bestMatch = null;
    let bestScore = 0;

    faqs.forEach((faq) => {
        let score = 0;

        faq.keywords.forEach((keyword) => {
            const normalizedKeyword = normalizeArabic(keyword);
            if (normalizedMessage.includes(normalizedKeyword)) {
                score += 2;
            }
        });

        const normalizedQuestion = normalizeArabic(faq.question);
        messageWords.forEach((word) => {
            if (normalizedQuestion.includes(word)) {
                score += 1;
            }
        });

        if (score > bestScore) {
            bestScore = score;
            bestMatch = faq;
        }
    });

    const MIN_SCORE_THRESHOLD = 2;

    if (bestMatch && bestScore >= MIN_SCORE_THRESHOLD) {
        return res.status(200).json({
            status: 'success',
            data: {
                answer: bestMatch.answer,
                matchedQuestion: bestMatch.question,
                confident: true,
            },
        });
    }

    // مفيش تطابق - نشيك هل السؤال أصلاً في مادة تانية غير الكيمياء
    const isOtherSubject = OTHER_SUBJECTS_KEYWORDS.some((keyword) =>
        normalizedMessage.includes(normalizeArabic(keyword))
    );

    if (isOtherSubject) {
        return res.status(200).json({
            status: 'success',
            data: {
                answer: NOT_CHEMISTRY_MESSAGE,
                matchedQuestion: null,
                confident: false,
            },
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            answer: DEFAULT_FALLBACK,
            matchedQuestion: null,
            confident: false,
        },
    });
});
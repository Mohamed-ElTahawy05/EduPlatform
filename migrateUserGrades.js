/**
 * Migration Script: Convert User.grade from String to Grade ObjectId
 *
 * شغّل السكريبت ده مرة واحدة بس، وقبل ما تعمل deploy للـ Schema الجديد بتاع User
 * (أو حتى لو الـ Schema اتغير خلاص، السكريبت بيشتغل على الـ collection مباشرة
 * من غير ما يعدي على الـ Mongoose Schema، فمش هيحصل أي Cast Error).
 *
 * طريقة التشغيل من الـ terminal:
 *   node migrateUserGrades.js
 *
 * تأكد إنك حاطط الملف ده في نفس مكان config.env أو عدّل الـ path تحت.
 */

const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

// إزالة أي فروق بين "ي" العادية و"ى" المقصورة، ومسافات زيادة
const normalizeArabic = (str) => {
    if (!str) return '';
    return str
        .trim()
        .replace(/ى/g, 'ي')
        .replace(/\s+/g, ' ');
};

const runMigration = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully.\n');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        const gradesCollection = db.collection('grades');

        // 1) هات كل الصفوف الموجودة فعلاً في كولكشن Grade
        const grades = await gradesCollection.find({}).toArray();

        if (grades.length === 0) {
            console.log('⚠️  لا يوجد أي مستندات في كولكشن Grade. أضف الصفوف أولاً ثم أعد المحاولة.');
            await mongoose.disconnect();
            return;
        }

        console.log(`تم العثور على ${grades.length} صف/صفوف في كولكشن Grade:`);
        grades.forEach(g => console.log(`  - ${g.name} (${g._id})`));
        console.log('');

        // خريطة: الاسم المُطبَّع -> _id بتاع الصف
        const gradeMap = new Map();
        grades.forEach(g => {
            gradeMap.set(normalizeArabic(g.name), g._id);
        });

        // 2) هات كل اليوزرز
        const users = await usersCollection.find({}).toArray();
        console.log(`تم العثور على ${users.length} يوزر/يوزرز.\n`);

        let updated = 0;
        let skippedAlreadyObjectId = 0;
        let failed = [];

        for (const user of users) {
            const currentGrade = user.grade;

            // لو الحقل خالص مش موجود
            if (!currentGrade) {
                failed.push({ id: user._id, name: user.name, reason: 'لا يوجد حقل grade' });
                continue;
            }

            // لو خلاص اتحول قبل كده لـ ObjectId (يعني السكريبت اتشغل مرتين بالغلط)
            if (currentGrade instanceof mongoose.Types.ObjectId) {
                skippedAlreadyObjectId++;
                continue;
            }

            const normalized = normalizeArabic(String(currentGrade));
            const matchedGradeId = gradeMap.get(normalized);

            if (!matchedGradeId) {
                failed.push({ id: user._id, name: user.name, reason: `لا يوجد صف مطابق لـ "${currentGrade}"` });
                continue;
            }

            await usersCollection.updateOne(
                { _id: user._id },
                { $set: { grade: matchedGradeId } }
            );

            console.log(`✅ ${user.name} : "${currentGrade}" -> ${matchedGradeId}`);
            updated++;
        }

        console.log('\n--- ملخص النتيجة ---');
        console.log(`تم التحديث بنجاح : ${updated}`);
        console.log(`متجاهَل (كان ObjectId بالفعل) : ${skippedAlreadyObjectId}`);
        console.log(`فشل : ${failed.length}`);

        if (failed.length > 0) {
            console.log('\n⚠️  اليوزرز اللي محتاجين تعديل يدوي:');
            failed.forEach(f => {
                console.log(`  - ${f.name} (${f.id}): ${f.reason}`);
            });
            console.log('\nراجع أسماء الصفوف يدويًا في MongoDB Atlas وصحّح القيمة بنفسك لليوزرز دول.');
        }

        await mongoose.disconnect();
        console.log('\nتم قطع الاتصال. انتهى السكريبت.');
    } catch (err) {
        console.error('حصل خطأ أثناء تشغيل السكريبت:', err);
        process.exit(1);
    }
};

runMigration();
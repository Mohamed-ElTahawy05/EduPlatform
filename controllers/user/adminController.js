const User = require('../../models/User');
const Lesson = require('../../models/Lesson');
const LessonProgress = require('../../models/LessonProgress');
const catchAsync = require('../../utils/catchAsync');

const ACTIVE_THRESHOLD_MINUTES = 15;

exports.getDashboardStats = catchAsync(async (req, res, next) => {
    const activeThreshold = new Date(Date.now() - ACTIVE_THRESHOLD_MINUTES * 60 * 1000);

    const totalUsers = await User.countDocuments();

    const activeUsersNow = await User.countDocuments({
        lastActiveAt: { $gte: activeThreshold },
    });

    const totalLessons = await Lesson.countDocuments({ status: 'published' });

    const viewsAgg = await Lesson.aggregate([
        { $group: { _id: null, totalViews: { $sum: '$views' } } },
    ]);
    const totalViews = viewsAgg.length > 0 ? viewsAgg[0].totalViews : 0;

    const totalProgressRecords = await LessonProgress.countDocuments();
    const completionRate =
        totalUsers === 0 || totalLessons === 0
            ? 0
            : Math.round((totalProgressRecords / (totalUsers * totalLessons)) * 100);

    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 6 * 7);

    const weeklySignups = await User.aggregate([
        { $match: { createdAt: { $gte: sixWeeksAgo } } },
        {
            $group: {
                _id: {
                    $dateTrunc: { date: '$createdAt', unit: 'week', binSize: 1 },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    const weeklyGrowth = [];
    for (let i = 5; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - i * 7);
        weekStart.setHours(0, 0, 0, 0);

        const matchingWeek = weeklySignups.find((w) => {
            const wDate = new Date(w._id);
            return (
                wDate.getFullYear() === weekStart.getFullYear() &&
                Math.abs(wDate - weekStart) < 7 * 24 * 60 * 60 * 1000
            );
        });

        weeklyGrowth.push({
            weekStart,
            newUsers: matchingWeek ? matchingWeek.count : 0,
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            stats: {
                totalUsers,
                activeUsers: activeUsersNow,
                totalLessons,
                totalViews,
                completionRate,
            },
            userGrowth: weeklyGrowth,
        },
    });
});

exports.getAllUsers = async (req, res) => {

};

exports.getUser = async (req, res) => {

};

exports.deleteUser = async (req, res) => {

};

exports.getAllCourses = async (req, res) => {

};

exports.deleteCourse = async (req, res) => {

};

exports.getAllQuizResults = async (req, res) => {

};

exports.getReports = async (req, res) => {

};
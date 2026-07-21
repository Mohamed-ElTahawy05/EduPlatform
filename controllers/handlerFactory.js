const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

exports.deleteOne = Model =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);

        if (!doc) {
            return next(new ApiError('No document found with that ID', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    });

exports.updateOne = Model => 
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!doc) {
            return next(new ApiError('No document found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                data: doc
            }
        });
    });

exports.createOne = Model =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                data: doc
            }
        });
    });

exports.getOne = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        if (popOptions) query = query.populate(popOptions);
        const doc = await query;

        if (!doc) {
            return next(new ApiError('No document found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                data: doc
            }
        });
    });

exports.getAll = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {
        let filter = {};
        if (req.params.courseId) filter = { course: req.params.courseId };
        if (req.params.gradeId) filter = { grade: req.params.gradeId };

        let query = Model.find(filter);
        if (popOptions) query = query.populate(popOptions);

        const docs = await query;

        res.status(200).json({
            status: 'success',
            results: docs.length,
            data: {
                data: docs
            }
        });
    });

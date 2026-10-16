"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = void 0;
const asyncHandler = (controller) => (req, res, next) => {
    Promise.resolve(controller(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;

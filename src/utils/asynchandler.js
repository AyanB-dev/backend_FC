const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch(next);
    };
};

// module.exports = asyncHandler;
// This utility function wraps an asynchronous function to handle errors

export default asyncHandler;
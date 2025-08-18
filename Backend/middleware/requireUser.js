module.exports = function requireUser(req, res, next){
    const userId = req.header('x-user-id');
    if(!userId || !userId.trim()){
        return res.status(400).json({
            error: 'missing user',
            message: 'X-User-Id header is required',
        });
    }
    req.userId = userId.trim();
    next();
};
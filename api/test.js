// Simple test endpoint
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ 
    message: 'Test endpoint working',
    method: req.method,
    query: req.query 
  });
};
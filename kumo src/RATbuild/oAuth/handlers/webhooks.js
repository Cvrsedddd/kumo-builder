export default function handleWebhooks() {
  return function (req, res, next) {
    if (!req.body) return res.json({ success: false, message: "No body provided." });
    if (!req.body.id) return res.json({ success: false, message: "No ID Provided." });
    res.json({ success: false });
    next();
  };
}

export const BUILD_TIME = 1792299457188;

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  return res.status(200).json({ version: '2.2.0', buildTime: BUILD_TIME });
}

import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const apkPath = path.join(process.cwd(), 'public', 'EasyBasePoint.apk');
    if (!fs.existsSync(apkPath)) {
      return res.status(404).send('APK file not found');
    }

    const stat = fs.statSync(apkPath);
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="EasyBasePoint.apk"');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const readStream = fs.createReadStream(apkPath);
    readStream.pipe(res);
  } catch (error) {
    console.error('Error serving APK:', error);
    res.status(500).send('Internal Server Error');
  }
}

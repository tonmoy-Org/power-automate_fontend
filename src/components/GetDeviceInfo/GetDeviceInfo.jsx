import { UAParser } from 'ua-parser-js';

const getDeviceInfo = () => {
  const parser = new UAParser();
  const result = parser.getResult();

  // 🔐 Stable device ID per browser
  let deviceId = localStorage.getItem('deviceId');

  if (!deviceId) {
    const rawId = `${result.browser.name}-${result.browser.version}-${result.os.name}-${navigator.userAgent}`;
    deviceId = btoa(rawId);
    localStorage.setItem('deviceId', deviceId);
  }

  return {
    deviceId,
    browser: result.browser.name || 'Unknown',
    browserVersion: result.browser.version || 'Unknown',
    os: result.os.name || 'Unknown',
    osVersion: result.os.version || 'Unknown',
    deviceType: result.device.type || 'Desktop',
    date: new Date(),
  };
};

export default getDeviceInfo;

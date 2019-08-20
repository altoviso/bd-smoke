const testingBotCapabilities = require('./testingBotCapabilities.js');

let smokeOrder = 1;

const browserStackUser = process.env.BROWSER_STACK_USER || false;
const browserStackKey = process.env.BROWSER_STACK_KEY || false;
const browserStackServer = {
    provider: 'browserstack',
    url: 'http://hub-cloud.browserstack.com/wd/hub'
};

const testingBotKey = process.env.TESTINGBOT_KEY || false;
const testingBotSecret = process.env.TESTINGBOT_SECRET || false;
const testingBotServer = {
    name: 'testingbot',
    url: 'http://localhost:4445/wd/hub'
};

function getBrowserStackCaps(os, osVersion, browser, rest) {
    return {
        os,
        os_version: osVersion,
        browserName: browser,
        'browserstack.local': 'true',
        'browserstack.selenium_version': '3.5.2',
        'browserstack.console': 'verbose',
        'browserstack.user': browserStackUser,
        'browserstack.key': browserStackKey,
        provider: browserStackServer,
        smokeOrder: smokeOrder++,
        ...rest
    };
}

function getTestingBotCaps(deviceName, platformName, browserName, versionId, rest) {
    // loosen the platformName and browserName matching to just look at significant characters and ignore case
    function conditionName(name) {
        return name.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
    }

    const platformNameLoose = conditionName(platformName);
    const browserNameLoose = conditionName(browserName);
    let properPlatformName;
    let properbrowserName;

    const device = testingBotCapabilities[deviceName];
    if (!device) {
        throw new Error(`device name '${deviceName}' not found in TestingBot capabilities`);
    }

    let platform;
    Object.keys(device).find(
        name => conditionName(name) === platformNameLoose && (platform = device[(properPlatformName = name)])
    );
    if (!platform) {
        throw new Error(`platform name '${platformName} not found in TestingBot capabilities`);
    }

    let browser;
    Object.keys(platform).find(
        name => conditionName(name) === browserNameLoose && (browser = platform[(properbrowserName = name)])
    );
    if (!browser) {
        throw new Error(`browser name '${browserName}' not found in TestingBot capabilities`);
    }

    // browsers are either an array of versions or an array of pairs (arrays) of [version, platformname]
    const getVersion = i => Array.isArray(browser[i]) ? browser[i][0] : browser[i];
    const version = versionId === 'latest' ?
        // versions are sorted "beta", "dev", high..low
        browser.find((v, i) => getVersion(i) !== 'dev' && getVersion(i) !== 'beta') :
        browser.find((v, i) => getVersion(i) === versionId);
    const versionName = Array.isArray(version) ? version[0] : version;
    const testingBotPlatformName = Array.isArray(version) ? version[1] : undefined;

    return {
        'selenium-version': '3.14.0',
        client_key: testingBotKey,
        client_secret: testingBotSecret,
        platform: properPlatformName,
        version: versionName,
        properbrowserName,
        deviceName: deviceName === 'desktop' ? undefined : deviceName,
        platformName: testingBotPlatformName,
        provider: testingBotServer,
        smokeOrder: smokeOrder++,
        ...rest
    };
}

const capabilities = {
    chrome: {
        browserName: 'chrome',
        smokeOrder: smokeOrder++
    },
    firefox: {
        browserName: 'firefox',
        smokeOrder: smokeOrder++
    },
    safari: {
        browserName: 'safari',
        smokeOrder: smokeOrder++
    },
    tbchrome: getTestingBotCaps('desktop', 'WIN10', 'chrome', 'latest'),
    tbfirefox: getTestingBotCaps('desktop', 'WIN10', 'firefox', 'latest'),
    tbsafari: getTestingBotCaps('desktop', 'MOJAVE', 'safari', 'latest'),
    ipad: getBrowserStackCaps(undefined, '11.3', 'iPad', { device: 'iPad 6th', realMobile: 'true' })
};

['10', '8.1', '7'].forEach(version => {
    ['Chrome', 'Firefox', 'Edge', 'IE'].forEach(browser => {
        if (browser !== 'Edge' || version === '10') {
            const cap = getBrowserStackCaps('Windows', version, browser);
            capabilities[(`${browser}-win-${version}`).toLowerCase()] = cap;
            if (browser === 'Firefox') {
                cap.browser_version = '62.0 beta';
            }
        }
    });
});

['High Sierra', 'Sierra'].forEach(version => {
    ['Safari', 'Chrome', 'Firefox'].forEach(browser => {
        capabilities[(`${browser}-osx-${version.replace(/\s/g, '-')}`).toLowerCase().replace(' ')] = getBrowserStackCaps('OS X', version, browser);
    });
});

capabilities.presets = {
    default: ['firefox'],
    defaultRemote: ['firefox-win-10'],
    local: ['chrome', 'firefox'],
    osx: ['safari-os, x-high-sierra'],
    win7: ['firefox-win-7', 'ie-win-7', 'edge-win-7', 'chrome-win-7'],
    'win8.1': ['firefox-win-8.1', 'ie-win-8.1', 'edge-win-8.1', 'chrome-win-8.1'],
    win10: ['firefox-win-10', 'ie-win-10', 'edge-win-10', 'chrome-win-10'],
    sierra: ['firefox-osx-sierra', 'safari-osx-sierra', 'chrome-osx-sierra'],
    highSierra: ['firefox-osx-high-sierra', 'safari-osx-high-sierra', 'chrome-osx-high-sierra'],
    chrome: ['chrome-osx-high-sierra', 'chrome-osx-sierra', 'chrome-win-7', 'chrome-win-8.1', 'chrome-win-10'],
    firefox: ['firefox-osx-high-sierra', 'firefox-osx-sierra', 'firefox-win-7', 'firefox-win-8.1', 'firefox-win-10'],
    safari: ['safari-osx-high-sierra', 'safari-osx-sierra'],
    ie: ['ie-win-7', 'ie-win-8.1', 'ie-win-10'],
    edge: ['edge-win-10'],
    all: [
        'chrome-osx-high-sierra', 'chrome-osx-sierra', 'chrome-win-7', 'chrome-win-8.1', 'chrome-win-10',
        'firefox-osx-high-sierra', 'firefox-osx-sierra', 'firefox-win-7', 'firefox-win-8.1', 'firefox-win-10',
        'safari-osx-high-sierra', 'safari-osx-sierra',
        'ie-win-7', 'ie-win-8.1', 'ie-win-10',
        'edge-win-10'
    ]
};

capabilities.testingBotCapabilities = testingBotCapabilities;

module.exports = capabilities;

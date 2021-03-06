//
// Routine to manually scrape testing bot capabilities
//
// (function(){
//     let catalog = {};
//     document.querySelectorAll("a").forEach(n => {
//         if (n.getAttribute('data-automated')) {
//             let browser = n.getAttribute('data-browser');
//             if(browser==='googlechrome') browser = 'chrome';
//             let platform = n.getAttribute('data-platform');
//             let version = n.getAttribute('data-version');
//             let deviceName = n.getAttribute('data-devicename') || 'desktop';
//             let platformName = n.getAttribute('data-platformname');
//             let dest = catalog[deviceName] || (catalog[deviceName] = {});
//             dest = dest[platform] || (dest[platform] = {});
//             dest = dest[browser] || (dest[browser] = []);
//             if(platformName){
//                 dest.push([version, platformName]);
//             }else {
//                 dest.push(version)
//             }
//         }
//     });
//     console.log(JSON.stringify(catalog));
// }());

const testingBotCapabilities = {
    "desktop": {
        "WIN10": {
            "iexplore": ["11"],
            "microsoftedge": ["dev", "18", "17", "16", "15", "14"],
            "chrome": ["beta", "dev", "76", "75", "74", "73", "72", "71", "70", "69", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "37", "36"],
            "firefox": ["beta", "dev", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "37", "36", "35", "34", "33", "32", "31", "30", "29", "28", "27", "26", "25", "24", "23", "22", "21", "20", "19", "18", "17", "16", "15", "14", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4"],
            "opera": ["60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50"]
        },
        "WIN8_1": {
            "iexplore": ["11"],
            "chrome": ["beta", "dev", "76", "75", "74", "73", "72", "71", "70", "69", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "37", "36"],
            "firefox": ["beta", "dev", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "37", "36", "35", "34", "33", "32", "31", "30", "29", "28", "27", "26", "25", "24", "23", "22", "21", "20", "19", "18", "17", "16", "15", "14", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4"]
        },
        "WIN8": {
            "iexplore": ["10"],
            "chrome": ["beta", "dev", "76", "75", "74", "73", "72", "71", "70", "69", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "37", "36"],
            "firefox": ["beta", "dev", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "37", "36", "35", "34", "33", "32", "31", "30", "29", "28", "27", "26", "25", "24", "23", "22", "21", "20", "19", "18", "17", "16", "15", "14", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4"]
        },
        "VISTA": {
            "iexplore": ["11", "10", "9", "8"],
            "chrome": ["beta", "dev", "76", "75", "74", "73", "72", "71", "70", "69", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "37", "36"],
            "firefox": ["beta", "dev", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "37", "36", "35", "34", "33", "32", "31", "30", "29", "28", "27", "26", "25", "24", "23", "22", "21", "20", "19", "18", "17", "16", "15", "14", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4"],
            "opera": ["60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50"]
        },
        "CATALINA": {
            "safari": ["13"],
            "chrome": ["beta", "dev", "76", "75", "74", "73", "72", "71", "70", "69", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "36"],
            "firefox": ["beta", "dev", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "37", "36", "35", "34", "33", "32", "31", "30", "29", "28", "27", "26", "25", "24", "23", "22", "21", "20", "19", "18", "17", "16", "15", "14", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4"],
            "opera": ["60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50"]
        },
        "MOJAVE": {
            "safari": ["dev", "12"],
            "chrome": ["beta", "dev", "76", "75", "74", "73", "72", "71", "70", "69", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "36"],
            "firefox": ["beta", "dev", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "37", "36", "35", "34", "33", "32", "31", "30", "29", "28", "27", "26", "25", "24", "23", "22", "21", "20", "19", "18", "17", "16", "15", "14", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4"],
            "opera": ["60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50"]
        },
        "HIGH-SIERRA": {
            "safari": ["dev", "12", "11"],
            "chrome": ["beta", "dev", "76", "75", "74", "73", "72", "71", "70", "69", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "36"],
            "firefox": ["beta", "dev", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "37", "36", "35", "34", "33", "32", "31", "30", "29", "28", "27", "26", "25", "24", "23", "22", "21", "20", "19", "18", "17", "16", "15", "14", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4"],
            "opera": ["60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50"]
        },
        "SIERRA": {
            "safari": ["dev", "11", "10"],
            "chrome": ["beta", "dev", "76", "75", "74", "73", "72", "71", "70", "69", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "36"],
            "firefox": ["beta", "dev", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "37", "36", "35", "34", "33", "32", "31", "30", "29", "28", "27", "26", "25", "24", "23", "22", "21", "20", "19", "18", "17", "16", "15", "14", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4"],
            "opera": ["60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50"]
        },
        "CAPITAN": {
            "safari": ["dev", "9"],
            "chrome": ["beta", "dev", "76", "75", "74", "73", "72", "71", "70", "69", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "36"],
            "firefox": ["beta", "dev", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "37", "36", "35", "34", "33", "32", "31", "30", "29", "28", "27", "26", "25", "24", "23", "22", "21", "20", "19", "18", "17", "16", "15", "14", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4"],
            "opera": ["60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50"]
        },
        "YOSEMITE": {
            "safari": ["8"],
            "chrome": ["beta", "dev", "76", "75", "74", "73", "72", "71", "70", "69", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "36"],
            "firefox": ["beta", "dev", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "37", "36", "35", "34", "33", "32", "31", "30", "29", "28", "27", "26", "25", "24", "23", "22", "21", "20", "19", "18", "17", "16", "15", "14", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4"],
            "opera": ["60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50"]
        },
        "MAVERICKS": {
            "safari": ["7"],
            "chrome": ["67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51"],
            "firefox": ["beta", "dev", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "37", "36", "35", "34", "33", "32", "31", "30", "29", "28", "27", "26", "25", "24", "23", "22", "21", "20", "19", "18", "17", "16", "15", "14", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4"],
            "opera": ["60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50"]
        },
        "LINUX": {
            "chrome": ["beta", "dev", "76", "75", "74", "73", "72", "71", "70", "69", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "37"],
            "firefox": ["beta", "dev", "68", "67", "66", "65", "64", "63", "62", "61", "60", "59", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50", "49", "48", "47", "46", "45", "44", "43", "42", "41", "40", "39", "38", "37", "36", "35", "34", "33", "32", "31", "30", "29", "28", "27", "26", "25", "24", "23", "22", "21", "20", "19", "18", "17", "16", "15", "14", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4"],
            "opera": ["60", "59", "58", "57", "56", "55", "54", "53", "52", "51", "50"]
        }
    },
    "iPhone Xr": { "CATALINA": { "safari": [["13.0", "iOS"]] } },
    "iPhone Xs Max": { "CATALINA": { "safari": [["13.0", "iOS"]] }, "MOJAVE": { "safari": [["12.2", "iOS"]] } },
    "iPhone Xs": { "CATALINA": { "safari": [["13.0", "iOS"]] }, "MOJAVE": { "safari": [["12.2", "iOS"]] } },
    "iPhone 8 Plus": {
        "CATALINA": { "safari": [["13.0", "iOS"]] },
        "MOJAVE": { "safari": [["12.2", "iOS"], ["12.1", "iOS"]] },
        "HIGH-SIERRA": { "safari": [["11.4", "iOS"]] }
    },
    "iPhone 8": {
        "CATALINA": { "safari": [["13.0", "iOS"]] },
        "MOJAVE": { "safari": [["12.2", "iOS"], ["12.1", "iOS"]] },
        "HIGH-SIERRA": { "safari": [["11.4", "iOS"]] }
    },
    "iPhone XR": { "MOJAVE": { "safari": [["12.2", "iOS"]] } },
    "iPhone X": {
        "MOJAVE": { "safari": [["12.2", "iOS"], ["12.1", "iOS"]] },
        "HIGH-SIERRA": { "safari": [["11.4", "iOS"]] }
    },
    "iPhone 7 Plus": {
        "MOJAVE": { "safari": [["12.2", "iOS"], ["12.1", "iOS"]] },
        "HIGH-SIERRA": { "safari": [["11.4", "iOS"]] }
    },
    "iPhone 7": {
        "MOJAVE": { "safari": [["12.2", "iOS"], ["12.1", "iOS"]] },
        "HIGH-SIERRA": { "safari": [["11.4", "iOS"]] }
    },
    "iPhone 6s Plus": {
        "MOJAVE": { "safari": [["12.2", "iOS"], ["12.1", "iOS"]] },
        "SIERRA": { "safari": [["10.3", "iOS"]] },
        "CAPITAN": { "safari": [["9.3", "iOS"]] }
    },
    "iPhone 6s": {
        "MOJAVE": { "safari": [["12.2", "iOS"], ["12.1", "iOS"]] },
        "HIGH-SIERRA": { "safari": [["11.4", "iOS"]] },
        "SIERRA": { "safari": [["10.3", "iOS"]] },
        "CAPITAN": { "safari": [["9.3", "iOS"]] }
    },
    "iPhone 6": {
        "MOJAVE": { "safari": [["12.2", "iOS"], ["12.1", "iOS"]] },
        "HIGH-SIERRA": { "safari": [["11.4", "iOS"]] },
        "SIERRA": { "safari": [["10.3", "iOS"]] },
        "CAPITAN": { "safari": [["9.3", "iOS"]] }
    },
    "iPhone 5s": {
        "MOJAVE": { "safari": [["12.1", "iOS"]] },
        "HIGH-SIERRA": { "safari": [["11.4", "iOS"]] },
        "SIERRA": { "safari": [["10.3", "iOS"]] },
        "CAPITAN": { "safari": [["9.3", "iOS"]] },
        "YOSEMITE": { "safari": [["8.1", "iOS"]] }
    },
    "iPhone 6 Plus": {
        "HIGH-SIERRA": { "safari": [["11.4", "iOS"]] },
        "SIERRA": { "safari": [["10.3", "iOS"]] },
        "CAPITAN": { "safari": [["9.3", "iOS"]] }
    },
    "iPhone 5": { "CAPITAN": { "safari": [["9.3", "iOS"]] }, "YOSEMITE": { "safari": [["8.1", "iOS"]] } },
    "iPhone 4s": { "CAPITAN": { "safari": [["9.3", "iOS"]] } },
    "iPad Pro (11-inch)": { "CATALINA": { "safari": [["13.0", "iOS"]] } },
    "iPad Pro (9.7-inch)": { "CATALINA": { "safari": [["13.0", "iOS"]] } },
    "iPad (6th generation)": { "MOJAVE": { "safari": [["12.2", "iOS"], ["12.1", "iOS"]] } },
    "iPad Air": {
        "MOJAVE": { "safari": [["12.2", "iOS"]] },
        "HIGH-SIERRA": { "safari": [["11.4", "iOS"]] },
        "CAPITAN": { "safari": [["9.3", "iOS"]] },
        "SIERRA": { "safari": [["10.3", "iOS"]] }
    },
    "iPad Pro (12.9-inch)": {
        "MOJAVE": { "safari": [["12.2", "iOS"], ["12.1", "iOS"]] },
        "SIERRA": { "safari": [["10.3", "iOS"]] }
    },
    "iPad (5th generation)": { "HIGH-SIERRA": { "safari": [["11.4", "iOS"]] } },
    "iPad Air 2": {
        "HIGH-SIERRA": { "safari": [["11.4", "iOS"]] },
        "CAPITAN": { "safari": [["9.3", "iOS"]] },
        "SIERRA": { "safari": [["10.3", "iOS"]] }
    },
    "iPad 2": { "CAPITAN": { "safari": [["9.3", "iOS"]] } },
    "iPad Pro": { "CAPITAN": { "safari": [["9.3", "iOS"]] } },
    "iPad Retina": { "CAPITAN": { "safari": [["9.3", "iOS"]] }, "SIERRA": { "safari": [["10.3", "iOS"]] } },
    "Pixel 2": { "ANDROID": { "Chrome": [["7.1", "Android"]] } },
    "Nexus 7": { "ANDROID": { "Chrome": [["7.1", "Android"]] } },
    "Nexus S": { "ANDROID": { "browser": [["6.0", "Android"]] } },
    "Nexus 4": { "ANDROID": { "browser": [["6.0", "Android"]] } },
    "Nexus 6": { "ANDROID": { "chrome": [["6.0", "Android"]] } },
    "Galaxy S6": { "ANDROID": { "browser": [["6.0", "Android"]] } },
    "Nexus 1": { "ANDROID": { "browser": [["5.0", "Android"]] } },
    "Galaxy S5": { "ANDROID": { "browser": [["5.0", "Android"]] } },
    "Galaxy Nexus": { "ANDROID": { "browser": [["4.4", "Android"]] } },
    "Galaxy S4": { "ANDROID": { "browser": [["4.4", "Android"]] } },
    "Pixel 2 XL": { "ANDROID": { "Chrome": [["8.0", "Android"]] } },
    "Pixel C": { "ANDROID": { "Chrome": [["8.0", "Android"]] } }
};

module.exports = testingBotCapabilities;

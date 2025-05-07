const semver = require("semver");

function compareVersions(currentVersion, latestVersion) {
    const isUpToDate = semver.lt(currentVersion, latestVersion);
    return isUpToDate;
}
module.exports = compareVersions
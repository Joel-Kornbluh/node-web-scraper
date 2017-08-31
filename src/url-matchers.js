
const URL_REGEX = /\w/g;

function getDefaultUrlMatcher(baseUrl){
    let urlObject = url.parse(baseUrl);
    return new RegExp(urlObject.hostname.replace(/\./g, '\\.'), 'g');
}

module.exports = {
    URL_REGEX: URL_REGEX,
    getDefaultUrlMatcher: getDefaultUrlMatcher
};

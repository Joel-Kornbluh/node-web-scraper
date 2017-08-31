const urlMatchers = require('./url-matchers');

function Scraper(rules, urlMatcher) {
    this.rules = [].concat(rules);
    this.urlMatcher = urlMatcher || urlMatchers.URL_REGEX;
}

Scraper.prototype.rules = null;

Scraper.prototype.shouldScrape = function(url){
    return this.urlMatcher.test(url);
};

Scraper.prototype.scrape = function(page){
    return this.rules.map(function(rule){
        return rule.scrape(page);
    });
};

module.exports = Scraper;

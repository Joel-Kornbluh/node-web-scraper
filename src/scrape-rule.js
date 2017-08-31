const valueExtractors = require('./extractors');
const valueParsers = require('./parsers');

function ensureScrapeRuleChecker(s){
    //
    if(typeof s === 'function'){
        return s;
    }

    // assume it is a regex
    if(s) {
        return function (page) {
            return s.test(page.url);
        }
    }

    //
    return function(){return true;};
}

function ScrapeRule(model, s){
    this.model = model;
    this.shouldScrape = ensureScrapeRuleChecker(s);
}

ScrapeRule.prototype.model = null;

ScrapeRule.prototype.scrape = function(page){
    if(!this.shouldScrape(page)){
        return null;
    }

    let modal = this.model;
    let data = {};

    for (let key of Object.keys(model)) {
        let selector = model[key].selector;
        let extractValue = model[key].extract || valueExtractors.text;
        let transformers = [].concat(model[key].transformers || []);
        let value = extractValue(page.$(selector));

        for (let transform of transformers) {
            value = transform(value)
        }

        data[key] = value;
    }

    return data;
};

module.exports = ScrapeRule;

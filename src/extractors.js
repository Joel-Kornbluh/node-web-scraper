
function createNodeMethodExtractor(methodName){
    return function (...args) {
        return function(node){
            return node[methodName].apply(node, args);
        };
    };
}

function textExtractor(node){
    return node.text().trim();
}

function lengthExtractor(node){
    return node.length;
}

let createValueExtractor = createNodeMethodExtractor('value');
let createAttrExtractor = createNodeMethodExtractor('attr');
let createPropExtractor = createNodeMethodExtractor('prop');
let createDataExtractor = createNodeMethodExtractor('data');

module.exports = {
    text: textExtractor,
    length: lengthExtractor,
    value: createValueExtractor,
    attr: createAttrExtractor,
    prop: createPropExtractor,
    data: createDataExtractor
};

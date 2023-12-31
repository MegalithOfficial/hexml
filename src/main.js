const {
    clogUtils
} = require("clog-utils");
const {
    InvalidArgument,
    EvaluationError
} = require("./error.js")
const logger = new clogUtils({
    disableModification: true
});

module.exports = class Hexml {

    constructor() { };

    /**
     * removes Comments (made with #) from Hexml data.
     * @param {string} str 
     * @returns {string}
     */
    static removeComments(inputString) {
        const lines = inputString.split('\n');
        const commentCharacter = "#";

        const cleanedLines = lines.map((line) => {
            const commentIndex = line.indexOf(commentCharacter);

            if (commentIndex === -1 || commentIndex === line.length - 1) return line;
            const newLine = line.slice(0, commentIndex);

            return newLine;
        });

        const cleanedString = cleanedLines.join('\n');
        return cleanedString;
    };

    static deserialize(input) {
        if (!input) return logger.error(new InvalidArgument("'input' cannot be a null or undefined."));
        if (typeof input !== "string") return logger.error(new InvalidArgument("'input' must be a String."))

        const result = {};
        const keyValuePairs = Hexml.removeComments(input).split(';');

        keyValuePairs.forEach((pair) => {
            const trimmedPair = pair.trim();
            if (trimmedPair.startsWith('#')) return;

            const [key, ...rest] = trimmedPair.split(':').map((str) => str.trim());
            const value = rest.join(':').trim();

            if (value.startsWith('<Date("') && value.endsWith('")>')) {
                const dateString = value.substring(7, value.length - 3);
                try {
                    if (dateString.toLowerCase() === "now") result[key] = Date.now();
                    else {
                        const dateValue = new Date(dateString);
                        result[key] = dateValue.getTime();
                    }
                } catch (error) {
                    return logger.error(new EvaluationError(`Error parsing date for key "${key}": ${error.message}`));
                };
            } else if (value.startsWith("$")) {
                const requestedValue = value.replace("$", "");
                try {
                    result[key] = (result[requestedValue]);
                } catch (error) {
                    return logger.error(new EvaluationError(`Error evaluating expression for key "${key}": ${error.message}`));
                };
            } else if (value.startsWith('m{') && value.endsWith('}')) {
                const expression = value.substring(2, value.length - 1);
                try {
                    const evaluatedValue = Function("return " + expression)();
                    result[key] = evaluatedValue;
                } catch (error) {
                    return logger.error(new EvaluationError(`Error evaluating expression for key "${key}": ${error.message}`));
                };
            } else if (value.startsWith('={') && value.endsWith('}')) {
                const expression = value.substring(2, value.length - 1);
                const splitter = expression.split(" ");

                const operators = ["+", "-", "/", "*", "%%", "%"];
                let Mathexpression = splitter.map(item =>
                    operators.some(op => item.startsWith(op)) ? item : result[item] ? result[item] : logger.error(new EvaluationError(`Error evaluating expression for key "${key}": ${item} is not defined`))
                ).join('');
                try {
                    const evaluatedValue = Function("return " + Mathexpression)();
                    result[key] = evaluatedValue;
                } catch (error) {
                    logger.error(new EvaluationError(error))
                };
            } else {
                switch (true) {
                    case value === 'true' || value === 'false':
                        result[key] = value === 'true';
                        break;
                    case value === 'undefined':
                        result[key] = undefined;
                        break;
                    case value === 'null':
                        result[key] = null;
                        break;
                    case !isNaN(parseFloat(value)):
                        result[key] = parseFloat(value);
                        break;
                    case value.startsWith('<[') && value.endsWith(']>'):
                        const arrayValues = value
                            .slice(2, -2)
                            .split(',')
                            .map((item) => {
                                item = item.trim();
                                if (item === 'true' || item === 'false') {
                                    return item === 'true';
                                } else if (!isNaN(parseFloat(item))) {
                                    return parseFloat(item);
                                } else if (item === 'null') {
                                    return null;
                                } else {
                                    return item.replace(/"/g, '');
                                }
                            });
                        result[key] = arrayValues;
                        break;
                    case value.startsWith('<{') && value.endsWith('}>'):
                        let ArraysanitizedValue = value.slice(1, -1).replace(/<\[(.*?)\]>/g, '[$1]');

                        const timeExpression = value.substring(1, value.length - 1);
                        const timeRegex = /<Date\("([^"]+)"\)>/g;
                        const matchesTime = [];
                        let matchTime;

                        while ((matchTime = timeRegex.exec(timeExpression)) !== null) {
                            matchesTime.push({ key: matchTime[0], timeParameter: matchTime[1] });
                        }

                        for (let i = 0; i < matchesTime.length; i++) {
                            const dateString = matchesTime[i];
                            try {
                                if (dateString.timeParameter.toLowerCase() === "now") ArraysanitizedValue = ArraysanitizedValue.replace(dateString.key, Date.now());
                                else {
                                    const dateValue = new Date(dateString.timeParameter);
                                    ArraysanitizedValue = ArraysanitizedValue.replace(dateString.key, dateValue.getTime());
                                }
                            } catch (error) {
                                return logger.error(new EvaluationError(`Error parsing date for key "${key}": ${error.message}`));
                            };
                        }

                        const Mathregex = /m{[^{}]*}/g;
                        const Mathmatches = ArraysanitizedValue.match(Mathregex) || [];

                        const keyRegexPattern = /(\w+):\s*m{[^{}]+}/g;
                        const keysArray = [];
                        const keyMatches = ArraysanitizedValue.match(keyRegexPattern);

                        if (keyMatches) {
                            for (const match of keyMatches) {
                                const key = match.match(/(\w+):/)[1].trim();
                                keysArray.push(key);
                            }
                        }

                        for (let i = 0; i < Mathmatches.length; i++) {
                            const expression = Mathmatches[i].substring(2, value.length - 1).replace(/{/g, '').replace(/}/g, '');
                            try {
                                const evaluatedValue = Function("return " + expression)();
                                result[key + keysArray[i]] = evaluatedValue;
                                ArraysanitizedValue = ArraysanitizedValue.replace(Mathmatches[i], evaluatedValue);
                            } catch (error) {
                                return logger.error(new EvaluationError(`Error evaluating expression for key "${key}": ${error.message}`));
                            };
                        }

                        const dollarSignRegex = /\$[^\s$]+/g;
                        const ReplaceMatches = ArraysanitizedValue.match(dollarSignRegex) || [];

                        for (let i = 0; i < ReplaceMatches.length; i++) {
                            const requestedValue = ReplaceMatches[i].replace("$", "").replace(/,/g, "");

                            try {
                                const key = requestedValue;
                                result[key] = result[requestedValue];
                                ArraysanitizedValue = ArraysanitizedValue.replace(`$${requestedValue}`, typeof result[requestedValue] === "string" ? `"${result[requestedValue]}"` : result[requestedValue]);
                            } catch (error) {
                                return logger.error(new EvaluationError(`Error evaluating expression for key "${key}": ${error.message}`));
                            }
                        }

                        let rawparsedObj = convertToQuotedProperties(`${ArraysanitizedValue}`);

                        const mathOperatorExpression = value.substring(1, value.length - 1);
                        const regex = /=\{(.*?)\}/g;
                        const matchesMath = [];
                        let matchMath;

                        while ((matchMath = regex.exec(mathOperatorExpression)) !== null) {
                            matchesMath.push(matchMath[0]);
                        }

                        for (let i = 0; i < matchesMath.length; i++) {
                            const expression = matchesMath[i].substring(2, value.length - 1).replace(/{/g, '').replace(/}/g, '');
                            const splitter = expression.split(" ");

                            const operators = ["+", "-", "/", "*", "%%", "%"];
                            let Mathexpression = splitter.map(item =>
                                operators.some(op => item.startsWith(op)) ? item : result[item] ? result[item] : result[key + item] ?? logger.error(new EvaluationError(`Error evaluating expression for key "${key}": ${item} is not defined`))
                            ).join('');

                            try {
                                const evaluatedValue = Function("return " + Mathexpression)();
                                rawparsedObj = rawparsedObj.replace(matchesMath[i], evaluatedValue);
                            } catch (error) {
                                logger.error(new EvaluationError(error))
                            };
                        }

                        console.log(rawparsedObj)

                        try {
                            const parsedValue = JSON.parse(rawparsedObj);
                            result[key] = parsedValue;
                        } catch (error) {
                            return logger.error(new EvaluationError(`Error parsing object for key "${key}": ${error.message}`));
                        };
                        break;
                    default:
                        result[key] = value.replace(/"/g, "");
                };
            };
        });
        delete result[''];
        return result;
    };

    static serialize(data) {
        let result = '';

        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const value = data[key];
                if (Array.isArray(value)) {
                    const arrayStr = `<[${value.map((item) => JSON.stringify(item)).join(', ')}]>`;
                    result += `${key}: ${arrayStr};\n`;
                } else if (typeof value === 'object') {
                    const objectStr = `<${JSON.stringify(value)}>`;
                    result += `${key}: ${objectStr};\n`;
                } else {
                    result += `${key}: ${JSON.stringify(value)};\n`;
                };
            };
        };

        return result.trim();
    };
};

function convertToQuotedProperties(inputString) {
    try {
        const wrappedKeysString = inputString.replace(/(\w+)(:)/g, '"$1"$2');
        return wrappedKeysString;
    } catch (error) {
        return logger.error(new EvaluationError(`Error while parsing into JSON: ${error}`));
    };
};
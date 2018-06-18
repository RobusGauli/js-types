/**
 * index.js
 * ~~~~~~~~~~
 * This module provides the helper functions to validate your primitives in JS
 */

const String = undefinedContract(Type("string"));
const Number = Type("number");
const Boolean = Type("boolean");

function errorHandler(errorType) {
  return {
    error: true,
    type: errorType
  };
}

function undefinedContract(func) {
  return function(validationRule) {
    const oldFunction = func(validationRule);
    function validate(data) {
      if (data === undefined || data.toString() === "undefined") {
        return errorHandler("undefined");
      }
      return oldFunction(data);
    };
    return {
      validate
    }
  };
}

function Type(type) {
  return function(validationRule) {
    function validate(data) {
      // first check if the data has undefined
      return {
        error: false,
        result: null
      };
    };
    return {
      validate,
    }
  };
}

function main() {
  console.log(String({}).validate('this is the value'));
}

main();

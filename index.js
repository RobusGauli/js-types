/**
 * index.js
 * ~~~~~~~~~~
 * This module provides the helper functions to validate your primitives in JS
 */



const String = undefinedContract(Type('string'))
const Number = Type('number');
const Boolean = Type('boolean');

function errorHandler(errorType) {
  return {
    error: true,
    type: errorType
  }
}

function undefinedContract(func) {
  return function(validationRule) {
    const oldFunction = func(validationRule);
    return function(oldFunction) {
      return function(data) {
        if (
          data === undefined ||
          data.toString() === 'undefined'
        ) {
          return errorHandler('undefined');
        }
        return oldFunction(data);
      }
    }
  }
}

function Type(type) {
  return function(validationRule) {
    return function(data) {
      // first check if the data has undefined
      return {
        error: false,
        result: null
      }
    }
  }
}




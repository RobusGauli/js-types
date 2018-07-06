/**
 * index.js
 * ~~~~~~~~~~
 * This module provides the helper functions to validate your primitives in JS
 */

const string = primitiveType("string");
const number = primitiveType("number");
const boolean = primitiveType("boolean");
const symbol = primitiveType("symbol");

function getType(value) {
  let val = `${value}`;
  if (isNaN(value) && val === "NaN") {
    return "NaN";
  }

  if (value === undefined && val === "undefined") {
    return "undefined";
  }

  if (value === null && val === "null") {
    return "null";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  return typeof value;
}

function primitiveTypeCheck(value, type) {
  const actualType = getType(value);
  if (actualType !== type) {
    return typeError(type, actualType);
  }
  return success(value);
}

function success(value) {
  return {
    error: null,
    value: value
  };
}

function typeError(expected, actual) {
  return {
    error: `Expected ${expected} but got ${actual}`,
    value: null
  };
}

function primitiveType(type) {
  return function() {
    let optional = false;
    return {
      validate: function(value) {
        if (optional && (value === undefined || value === null)) {
          // safely return
          return success(value);
        }

        return primitiveTypeCheck(value, type);
      },
      optional: function() {
        optional = true;
        return this;
      }
    };
  };
}

function object(validationSchema) {
  let optional = false;
  return {
    validate: function(payload) {
      // here we write our validation rule
      if (optional && (payload === undefined || payload === null)) {
        //safely return
        return success(payload);
      }

      const value = primitiveTypeCheck(payload, "object");
      if (value.error) {
        return value;
      }
      const errorPayload = {};
      const valuePayload = {};
      Object.keys(validationSchema).forEach(key => {
        const validation = validationSchema[key];
        if (
          typeof validation !== "object" ||
          validation === null ||
          !validation.validate ||
          typeof validation.validate !== "function"
        ) {
          throw new TypeError(`Invalid schema for ${key}`);
        }
        const val = payload[key];

        const { error, value } = validation.validate(val);
        if (error !== null) {
          errorPayload[key] = error;
        } else {
          valuePayload[key] = value;
        }
      });
      return {
        error: Object.keys(errorPayload).length ? errorPayload : null,
        value: Object.keys(valuePayload).length ? valuePayload : null
      };
    },
    optional: function() {
      optional = true;
      return this;
    }
  };
}
// goes to util
function all(args) {
  if (!Array.isArray(args)) {
    throw new TypeError("Argument must be of type array.");
  }

  return args.reduce((acc, val) => acc && val, true);
}
function lengthError(value, lengthSchema, minFailed) {
  if (minFailed) {
    return {
      error: `${getType(value)} must have minimum length of ${lengthSchema.minLength}`,
      value: null
    }
  }
  return {
    error: `${getType(value)} must have maximum length of ${lengthSchema.maxLength}`,
    value: null
  }
}

function lengthCheck(value, lengthSchema) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${value} must be of type Array.`);
  }
  if (
    lengthSchema.minLength !== null && 
    getType(lengthSchema.minLength) === 'number' &&
    value.length < lengthSchema.minLength
  ) {
    return lengthError(value, lengthSchema, true)
  }

  const maxLength = lengthSchema.maxLength;
  if (
    maxLength !== null &&
    getType(maxLength) === 'number' &&
    value.length > maxLength
  ) {
    return lengthError(value, lengthSchema, false);
  }

  return success(value);
}


function list(validationSchema) {
  let optional = false;
  let minLength = null;
  let maxLength = null;

  return {
    validate: function(payload) {
      if (optional && (payload === undefined || payload === null)) {
        // safely return from the validation
        return success(payload);
      }
      const value = primitiveTypeCheck(payload, "array");

      if (value.error) {
        return value;
      }

      // before validating each item we irst validate the length
      if (
        minLength !== null ||
        maxLength !== null
      ) {
        const lengthResult =  lengthCheck(payload, {minLength: minLength, maxLength: maxLength});
        if (lengthResult.error) {
          return lengthResult;
        }
      }
      const res = payload.reduce((acc, val, index) => {
        const { error, value } = validationSchema.validate(val);
        return error !== null
          ? { ...acc, [index]: { error: error, value: value } }
          : { ...acc };
      }, {});

      if (all(Object.values(res).map(v => v.error === null))) {
        return {
          error: null,
          value: payload
        };
      }
      return {
        error: res,
        value: null
      };
    },
    optional: function() {
      optional = true;
      return this;
    },
    minLength: function(length) {
      const lengthType = getType(length);
      if (lengthType !== 'number') {
        throw new TypeError(`Argument to the minLength must be of type number but got ${lengthType}.`);
      }
      if (maxLength !== null && minLength >= maxLength) {
        throw new Error('Min length must be less than Max Length. Length Mismatch.');
      }
      minLength = length;
      return this;
    },
    maxLength: function(length) {
      const lengthType = getType(length);
      if (lengthType !== 'number') {
        throw new TypeError(`Argument to the minLength must be of type numner but got ${lengthType}.`);
      }
      
      if (minLength !== null && length <= minLength) {
        throw new Error('Max length must be greater than Min Length. Length Mismatch.');
      }

      maxLength = length;
      return this;
    }
  };
}

function main() {
  // here we validate the js objects types
  const payload = {
    name: "s",
    age: undefined,
    friends: [ {name: 'sd', age: 3}],
    detail: {}
  };

  const schema = object({
    friends: list(object({
      name: string(),
      age: number().optional()
    })).minLength(2),
    name: string().optional(),
    age: number().optional(),
    detail: object({
      firstName: number().optional(),
      lastName: number().optional()
    }).optional()
  });
  const { error, value } = schema.validate(payload);
  console.log(error);
  console.log(value);
}

main();

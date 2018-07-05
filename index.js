/**
 * index.js
 * ~~~~~~~~~~
 * This module provides the helper functions to validate your primitives in JS
 */

const string = primitiveType("string");
const number = primitiveType("number");
const boolean = primitiveType("boolean");
const symbol = primitiveType('symbol');

function success(value) {
  return {
    error: null,
    value: value
  };
}

function typeError(expected, actual) {
  return {
    error: `Expected ${expected} but got ${typeof actual}`,
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

        if (typeof value !== type) {
          return typeError(type, value);
        }
      },
      optional: function() {
        optional = true;
        return this;
      }
    };
  };
}

function object(validationSchema) {
  return {
    validate: function(payload) {
      // here we write our validation rule
      if (typeof payload !== "object" || payload === null) {
        throw new Error("Payload must be of type object.");
      }

      const errorPayload = {};
      const valuePayload = {};
      Object.keys(validationSchema).forEach(key => {
        const validation = validationSchema[key];
        const val = payload[key];

        const { error, value } = validation.validate(val);
        if (error !== null) {
          errorPayload[key] = error;
        } else {
          valuePayload[key] = value;
        }
      });
      return {
        error: errorPayload,
        value: valuePayload
      };
    }
  };
}

function main() {
  // here we validate the js objects types
  const payload = {
    name: 3
  };

  const schema = object({
    name: string().optional(),
    age: number().optional()
  });
  const { error, value } = schema.validate(payload);
  console.log(error, value);
}
main();
